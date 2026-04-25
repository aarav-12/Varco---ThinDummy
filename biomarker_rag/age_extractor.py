"""
Age extractor — completely independent of biomarker pipeline.

Runs on raw PDF text BEFORE any skip/clean/filter logic.
Never touches biomarker data. Never modifies it.

Returns:
  {
    "extractedAge": int | None,
    "ageConfidence": float   # 0.0 – 1.0
  }

Confidence tiers:
  0.95 — structured lab header  "Age/Gender : 42 Y"
  0.90 — labelled field         "Age: 42" / "Age : 42"
  0.75 — natural sentence       "42 years old" / "42-year-old"
  0.60 — bare number near word  "patient aged 42"
  0.00 — not found
"""

from __future__ import annotations
import logging
import re
import pdfplumber

logger = logging.getLogger(__name__)

# ── Patterns ordered by confidence (high → low) ──────────────────────────────

_PATTERNS: list[tuple[float, re.Pattern]] = [
    # Tier 1 — lab report header fields (most reliable)
    # "Age/Gender : 42 Y 0 M 0 D /M"  or  "Age/Gender: 42 Y"
    (0.95, re.compile(
        r"age\s*/\s*gender\s*[:\-]\s*(\d{1,3})\s*[Yy]",
        re.IGNORECASE,
    )),
    # "Age : 42 Y" or "AGE: 42Y"
    (0.95, re.compile(
        r"\bage\s*[:\-]\s*(\d{1,3})\s*[Yy]",
        re.IGNORECASE,
    )),

    # Tier 2 — labelled field without Y suffix
    # "Age: 42"  "Age : 42"
    (0.90, re.compile(
        r"\bage\s*[:\-]\s*(\d{1,3})\b",
        re.IGNORECASE,
    )),

    # Tier 3 — natural language
    # "42 years old"  "42-year-old"  "42 year old"
    (0.75, re.compile(
        r"\b(\d{1,3})\s*[-\s]?year[s]?\s*[-\s]?old\b",
        re.IGNORECASE,
    )),
    # "42 years"  "42 Yrs"
    (0.75, re.compile(
        r"\b(\d{1,3})\s*(?:years?|yrs?)\b",
        re.IGNORECASE,
    )),

    # Tier 4 — weaker contextual clues
    # "patient aged 42"  "aged 42"
    (0.60, re.compile(
        r"\baged?\s+(\d{1,3})\b",
        re.IGNORECASE,
    )),
    # "DOB" lines won't be used — too hard to parse reliably
]

_MIN_AGE = 1
_MAX_AGE = 120


def _is_valid_age(age: int) -> bool:
    return _MIN_AGE <= age <= _MAX_AGE


def extract_age(pdf_path: str) -> dict:
    """
    Extract patient age from raw PDF text.
    Returns {"extractedAge": int|None, "ageConfidence": float}.
    """
    # Pull raw text from all pages — no cleaning, no skipping
    raw_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            raw_text = "\n".join(
                page.extract_text() or "" for page in pdf.pages
            )
    except Exception as exc:
        logger.warning("Age extraction: could not read PDF: %s", exc)
        return {"extractedAge": None, "ageConfidence": 0.0}

    if not raw_text.strip():
        return {"extractedAge": None, "ageConfidence": 0.0}

    # Try patterns from highest confidence to lowest
    # Return on first valid match
    for confidence, pattern in _PATTERNS:
        for match in pattern.finditer(raw_text):
            try:
                age = int(match.group(1))
            except (IndexError, ValueError):
                continue
            if _is_valid_age(age):
                logger.info(
                    "Age extracted: %d (confidence=%.2f, pattern=%r)",
                    age, confidence, pattern.pattern,
                )
                return {
                    "extractedAge": age,
                    "ageConfidence": confidence,
                }

    logger.info("Age not found in PDF")
    return {"extractedAge": None, "ageConfidence": 0.0}
