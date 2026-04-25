"""
Biomarker extractor.

Extraction order:
  1. pdfplumber TABLE parser   — structured tables (KNEE OA page etc.)
  2. TEXT LINE parser          — plain-text rows like "HbA1c 5.4 % 4.0-5.7"
  3. LLM via Ollama            — fallback for scanned PDFs, split rows, inline text

Edge cases handled:
  ✅ Missing units        — unit-less lines allowed when value clearly separated
  ✅ Scientific notation  — 1.2E3, 3.5e-2
  ✅ Unit merged into val — "5.6%", "120mg/dL"
  ✅ Reference range rows — lines starting with < > ≤ ≥ skipped
  ✅ Duplicate biomarkers — kept distinct (Glucose Fasting ≠ Glucose Post)
  ✅ Scanned / split rows — LLM fallback
  ✅ Inline messy text    — LLM fallback
  ⚠️  OCR noise (S→5)    — unfixable without OCR layer; LLM may partially recover
"""

from __future__ import annotations
import json, logging, math, re
import httpx, pdfplumber
from config import settings

logger = logging.getLogger(__name__)

# ── Unit pattern ─────────────────────────────────────────────────────────────
_UNIT_PAT = (
    r"ng/mL|pg/mL|mg/dL|mg/dl|mg /dL|mg/ dL|mg/L|mg/l|"
    r"mmol/L|µmol/L|umol/L|nmol/L|pmol/L|ng/dL|µg/dL|ug/dL|"
    r"IU/L|U/L|mIU/L|g/dL|g/L|mEq/L|%"
)
_UNIT_RE = re.compile(r"(?<!\w)(" + _UNIT_PAT + r")(?!\w)", re.IGNORECASE)

# ── Number pattern — standard + scientific notation ───────────────────────────
# Matches: 5.4  |  5  |  1.2E3  |  3.5e-2  |  1.2E+3
_NUM_STRICT_RE = re.compile(r"^\s*(\d+\.?\d*(?:[eE][+\-]?\d+)?)\s*$")
_NUM_SEARCH_RE = re.compile(r"(\d+\.?\d*(?:[eE][+\-]?\d+)?)")

# ── Noise lines — EXACT patterns only, not broad keywords ────────────────────
# Goal: skip header/metadata/commentary lines WITHOUT accidentally
# catching real biomarker names.
_SKIP_LINE_RE = re.compile(
    r"^("
    # Patient info header fields
    r"visit\s*id\s*:|uhid|patient\s*name\s*:|age/gender\s*:|"
    r"ref\s*doctor\s*:|ref\s*by\s*:|client\s*code\s*:|"
    r"registration\s*:|collected\s*:|received\s*:|reported\s*:|"
    r"status\s*:|barcode\s*no\s*:|powered\s*by|"
    # Section headers
    r"department\s*of|page\s*\d+\s*of|"
    # Table column headers
    r"test\s*name\s*$|parameter\s*$|result\s*$|investigation\s*$|"
    r"bio\.\s*ref\.?\s*range|sample\s*type\s*:"
    r")",
    re.IGNORECASE,
)

# Secondary skip — lines we're confident are reference/commentary, not results
# Kept SHORT and specific to avoid false positives.
_SKIP_CONTENT_RE = re.compile(
    r"("
    r"according\s+to\s+ada|ada\s+criteria|reference\s+group\s*$|"
    r"non\s+diabetic\s+adults\s*>=|at\s+risk\s+\(prediabetes\)|"
    r"diagnosing\s+diabetes\s*>=|"
    r"treatment\s+targets?\s+for\s+lipid|lipid\s+association\s+of\s+india|"
    r"risk\s+group\s*$|low-risk\s+group|moderate-risk\s+group|"
    r"high-risk\s+group|very\s+high-risk\s+group|extreme-risk\s+group|"
    r"friedewald\s+equation|e\.g\.,\s*lower\s+eryth|"
    r"a\s+reasonable\s+a1c\s+goal|stringent\s+a1c\s+goals|"
    r"less\s+stringent\s+a1c|older\s+adults\s+who\s+are|"
    r"a1c\s+goals\s+must|an\s+a1c\s+of\s+<|"
    r"pregnancy:\s+normal\s+value|creatinine\s+secretion\s+is\s+inhibited|"
    r"serum\s+phosphate\s+between\s+1\.5|contains\s+approximately\s+2\.5|"
    r"levels\s+below\s+1\.[50]\s+mg/dL\s+may|phosphorus\s+levels\s+below\s+1\.0"
    r")",
    re.IGNORECASE,
)

# Skip table rows used as section dividers / risk tables
_SKIP_TABLE_RE = re.compile(
    r"^("
    r"test\s*name|parameter|result|reference\s*(range)?|method|"
    r"sample\s*type|powered\s*by|visit\s*id|patient|page\s*\d|"
    r"risk\s*group|treatment\s*target|risk\s*factors|"
    r"high[- ]risk\s*features|risk\s*modifiers"
    r")$",
    re.IGNORECASE,
)


def _clean_name(raw: str) -> str:
    """Strip kit/method suffixes, collapse whitespace."""
    name = re.split(
        r"\*\s*$|\(serum\s*eia\)|\(sandwich-?elisa\)|\(competitive\s*elisa\)",
        raw, flags=re.IGNORECASE
    )[0]
    # Fix 2: strip ANY parenthetical containing ELISA/EIA
    name = re.sub(r"\([^)]*(?:elisa|eia)[^)]*\)", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[\*\n\r\t]+", " ", name)
    name = re.sub(r"\s+", " ", name)
    # Strip trailing > < symbols that leaked from ">50" style values
    name = re.sub(r"\s*[<>≤≥]\s*$", "", name)
    return name.strip()


def _extract_unit(cell: str) -> str:
    m = _UNIT_RE.search(cell or "")
    return m.group(0).strip() if m else ""


def _parse_numeric(s: str) -> float | None:
    """Parse standard or scientific notation number. Returns None if not a number."""
    s = s.strip()
    # Handle values like "5.6%" or "120mg/dL" — strip unit suffix first
    s = _UNIT_RE.sub("", s).strip()
    m = _NUM_STRICT_RE.match(s)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


# ── TABLE PARSER ──────────────────────────────────────────────────────────────
def _parse_tables(pdf_path: str) -> list[dict]:
    results, seen = [], set()
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for table in (page.extract_tables() or []):
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    cells = [(c or "").strip() for c in row]
                    name_raw = cells[0]

                    if not name_raw:
                        continue
                    # Skip if name is a table header
                    name_stripped = name_raw.strip().split("\n")[0]
                    if _SKIP_TABLE_RE.match(name_stripped):
                        continue

                    value_cell = cells[1] if len(cells) > 1 else ""
                    unit_cell  = cells[2] if len(cells) > 2 else ""

                    # If value cell is a reference range (starts with < > etc.), skip row
                    if re.match(r"^\s*[<>≤≥]", value_cell):
                        continue

                    # Try to parse value — handle "5.6%", "120 mg/dL", "1.2E3"
                    unit_in_value = _UNIT_RE.search(value_cell)
                    if unit_in_value and not unit_cell:
                        unit_cell = unit_in_value.group(0)

                    # Extract the numeric part
                    clean_val = _UNIT_RE.sub("", value_cell).strip()
                    value = _parse_numeric(clean_val)
                    if value is None:
                        # Try extracting first number from cell
                        nm = _NUM_SEARCH_RE.search(clean_val)
                        if nm:
                            value = float(nm.group(1))
                        else:
                            continue

                    unit  = _extract_unit(unit_cell) or _extract_unit(value_cell)
                    name  = _clean_name(name_raw)
                    key   = name.lower()

                    if name and len(name) > 1 and key not in seen:
                        seen.add(key)
                        results.append({"name": name, "value": value, "unit": unit})
    return results


# ── TEXT LINE PARSER ──────────────────────────────────────────────────────────
def _parse_line(line: str) -> dict | None:
    line = line.strip()

    # Hard length limits
    if not line or len(line) > 150:
        return None

    # Skip known noise patterns
    if _SKIP_LINE_RE.search(line) or _SKIP_CONTENT_RE.search(line):
        return None

    # Skip reference range lines like "Normal: < 100 mg/dL"
    if re.match(r"^\s*(normal|reference|ref\.?\s*range|bio\.?\s*ref)[:\s]", line, re.IGNORECASE):
        return None

    # ── Strategy: find unit, take number immediately before it ──────────────
    unit_m = _UNIT_RE.search(line)
    if unit_m:
        unit        = unit_m.group(1)
        before_unit = line[:unit_m.start()].strip()
        num_m       = _NUM_SEARCH_RE.search(before_unit[::-1])  # search backwards
        if num_m:
            num_str = num_m.group(1)[::-1]
            value   = float(num_str)
            # Name = everything before the number
            num_end_pos = len(before_unit) - num_m.start() - len(num_str)
            name    = before_unit[:num_end_pos].strip()

            # Skip if number was preceded by < > ≤ ≥ (reference range)
            prefix = before_unit[:num_end_pos].rstrip()
            if prefix and prefix[-1] in '<>≤≥':
                return None

            if name and len(name) >= 2 and len(name) <= 80:
                if not re.match(r'^[\d\s<>≤≥\.\-\+\(\)]+$', name):
                    name = re.sub(r'\s+', ' ', name).strip()
                    return {"name": name, "value": value, "unit": unit}

    # ── Fallback: no unit in line — require strong whitespace separation ─────
    # Pattern: NAME  <2+ spaces>  NUMBER  (e.g. "HbA1c   5.6")
    # Only trigger when name is substantial and number is clearly separated
    no_unit_m = re.match(
        r"^([A-Za-z][A-Za-z0-9\s\-\(\)/,\.]{3,50}?)\s{2,}(\d+\.?\d*(?:[eE][+\-]?\d+)?)\s*$",
        line,
    )
    if no_unit_m:
        name  = no_unit_m.group(1).strip()
        value = float(no_unit_m.group(2))
        if not _SKIP_CONTENT_RE.search(name) and len(name) >= 3:
            return {"name": name, "value": value, "unit": ""}
    
    return None


def _parse_text(pdf_path: str) -> list[dict]:
    results, seen = [], set()
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for line in (page.extract_text() or "").splitlines():
                parsed = _parse_line(line)
                if parsed:
                    key = parsed["name"].lower()
                    if key not in seen:
                        seen.add(key)
                        results.append(parsed)
    return results


# ── MERGE (table wins on conflict, text fills gaps) ───────────────────────────
def _merge(table_results: list[dict], text_results: list[dict]) -> list[dict]:
    seen  = {r["name"].lower() for r in table_results}
    merged = list(table_results)
    for r in text_results:
        if r["name"].lower() not in seen:
            seen.add(r["name"].lower())
            merged.append(r)
    return merged


# ── LLM FALLBACK ──────────────────────────────────────────────────────────────
_SYS_PROMPT = """\
Extract ALL biomarkers from this medical lab report.
Return ONLY a JSON array. No markdown, no explanation.
Format: [{"name": "<exact name from report>", "value": <number>, "unit": "<unit>"}]
Rules:
- Include every test result with a numeric value
- For values like ">50", use 50 as the value
- value must be a number (no strings)
- one entry per test
- output [] if nothing found
"""

def _llm_extract(chunks: list[str]) -> list[dict]:
    combined = "\n\n---\n\n".join(c[:4000] for c in chunks)
    logger.info("LLM fallback: %d chars", len(combined))
    resp = httpx.post(
        f"{settings.OLLAMA_BASE_URL}/api/chat",
        json={
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": _SYS_PROMPT},
                {"role": "user",   "content": combined},
            ],
            "stream": False,
            "options": {"temperature": 0.0, "num_predict": 1024},
        },
        timeout=300,
    )
    resp.raise_for_status()
    raw   = resp.json()["message"]["content"]
    clean = re.sub(r"```(?:json)?|```", "", raw).strip()
    try:
        parsed = json.loads(clean)
    except json.JSONDecodeError:
        m = re.search(r"\[.*?\]", clean, re.DOTALL)
        parsed = json.loads(m.group()) if m else []

    out = []
    for item in (parsed or []):
        if not isinstance(item, dict):
            continue
        try:
            v = float(str(item.get("value", "")).lstrip("><≤≥"))
        except (TypeError, ValueError):
            continue
        if not (math.isnan(v) or math.isinf(v)):
            out.append({
                "name":  str(item.get("name", "")).strip(),
                "value": v,
                "unit":  str(item.get("unit", "")).strip(),
            })
    return out


# ── Junk name filter ─────────────────────────────────────────────────────────
# These are reference-table rows, patient-info fields, or lab commentary
# that slip through the parsers despite our skip lists.
# Pattern types:
#   str  → name.contains(pattern)   case-insensitive
#   re   → regex match against name
_JUNK_PATTERNS: list = [
    # Patient / report metadata
    "Visit ID", "UHID", "Barcode", "Ref Doctor", "Ref By", "Client Code",
    "Registration", "Collected", "Received", "Reported", "Status",

    # ADA / reference classification rows
    "Reference Group", "Non diabetic", "At risk", "Diagnosing Diabetes",
    "Insufficiency", "Sufficient", "Deficiency", "Toxicity",

    # Lipid risk table rows
    "Low-risk group", "Moderate-risk", "High-risk group",
    "Very high-risk", "Extreme-risk",

    # Lab commentary / interpretation headers
    "Increased In", "Decreased In", "Powered By", "Comments",
    "Sample Type", "Department of",

    # Pure numeric rows (e.g. reference table values like "6", "126")
    re.compile(r"^\d+$"),

    # Rows that are clearly reference ranges, not results
    re.compile(r"^[<>≤≥]\s*\d"),

    # Single character or empty
    re.compile(r"^.{0,1}$"),
]

def _drop_junk(biomarkers: list[dict]) -> list[dict]:
    """
    Remove entries whose name matches any junk pattern.
    Equivalent to the JS isValidBiomarker() filter.
    """
    clean = []
    for b in biomarkers:
        name = b.get("name", "")
        is_junk = False
        for pattern in _JUNK_PATTERNS:
            if isinstance(pattern, re.Pattern):
                if pattern.search(name):
                    is_junk = True
                    break
            else:
                # string → case-insensitive contains check
                if pattern.lower() in name.lower():
                    is_junk = True
                    break
        if is_junk:
            logger.debug("Dropping junk row: %r", name)
        else:
            clean.append(b)
    return clean


# ── NaN / Inf guard ──────────────────────────────────────────────────────────
def _drop_invalid(biomarkers: list[dict]) -> list[dict]:
    """
    Fix 1: Remove any entry whose value is NaN, Inf, or not a real number.
    Runs on ALL code paths — table parser, text parser, and LLM output.
    """
    clean = []
    for b in biomarkers:
        v = b.get("value")
        if not isinstance(v, (int, float)):
            logger.debug("Dropping non-numeric value for %r: %r", b.get("name"), v)
            continue
        if math.isnan(v) or math.isinf(v):
            logger.debug("Dropping NaN/Inf for %r", b.get("name"))
            continue
        clean.append(b)
    return clean


# ── PUBLIC API ────────────────────────────────────────────────────────────────
def extract_biomarkers(chunks: list[str], pdf_path: str | None = None) -> list[dict]:
    """
    Returns list of {"name": str, "value": float, "unit": str}.
    Names are exactly as they appear in the report — no normalization.
    Node backend handles all mapping.
    """
    if pdf_path:
        table_res = _parse_tables(pdf_path)
        text_res  = _parse_text(pdf_path)
        merged    = _merge(table_res, text_res)
        logger.info(
            "Extraction: table=%d  text=%d  merged=%d",
            len(table_res), len(text_res), len(merged)
        )
        if len(merged) >= 3:
            return _drop_invalid(_drop_junk(merged))

    # Fallback for scanned PDFs, split rows, inline text, OCR-degraded files
    logger.info("Deterministic parsers yielded < 3 results — falling back to LLM")
    return _drop_invalid(_drop_junk(_llm_extract(chunks)))
