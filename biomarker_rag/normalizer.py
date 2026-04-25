# """
# Biomarker name normalisation and domain mapping.
# All lookups are O(1). No external calls.
# """

# from __future__ import annotations

# # ---------------------------------------------------------------------------
# # 1.  Canonical domain structure  (DO NOT MODIFY)
# # ---------------------------------------------------------------------------
# DOMAIN_STRUCTURE: dict[str, list[str]] = {
#     "IRF": ["CRP", "IL6", "MDA"],
#     "VAF": ["VEGF", "MMP9", "TGFB1"],
#     "PNF": ["BDNF", "SP"],
#     "MHF": ["COMP", "CKMM", "AldolaseA", "CTXII"],
#     "BMF": ["Calcium", "Phosphorus", "VitaminD", "PTH", "Osteocalcin"],
#     "CMF": ["HbA1c", "TC", "LDL", "HDL", "TG"],
#     "RFF": ["Creatinine", "BUN", "eGFR"],
# }

# # Reverse map: canonical_name → domain
# _CANONICAL_TO_DOMAIN: dict[str, str] = {
#     bio: domain
#     for domain, bios in DOMAIN_STRUCTURE.items()
#     for bio in bios
# }

# # ---------------------------------------------------------------------------
# # 2.  Alias table  – lower-cased source strings → canonical name
# # ---------------------------------------------------------------------------
# _RAW_ALIASES: dict[str, str] = {
#     # CMF
#     "hba1c": "HbA1c",
#     "hba1c %": "HbA1c",
#     "glycated haemoglobin": "HbA1c",
#     "glycated hemoglobin": "HbA1c",
#     "hemoglobin a1c": "HbA1c",
#     "haemoglobin a1c": "HbA1c",
#     "total cholesterol": "TC",
#     "tc": "TC",
#     "cholesterol": "TC",
#     "ldl cholesterol": "LDL",
#     "ldl-c": "LDL",
#     "low density lipoprotein": "LDL",
#     "ldl": "LDL",
#     "hdl cholesterol": "HDL",
#     "hdl-c": "HDL",
#     "high density lipoprotein": "HDL",
#     "hdl": "HDL",
#     "triglycerides": "TG",
#     "triglyceride": "TG",
#     "tg": "TG",
#     # RFF
#     "creatinine": "Creatinine",
#     "serum creatinine": "Creatinine",
#     "bun": "BUN",
#     "blood urea nitrogen": "BUN",
#     "urea nitrogen": "BUN",
#     "egfr": "eGFR",
#     "estimated gfr": "eGFR",
#     "glomerular filtration rate": "eGFR",
#     # BMF
#     "calcium": "Calcium",
#     "serum calcium": "Calcium",
#     "phosphorus": "Phosphorus",
#     "phosphate": "Phosphorus",
#     "serum phosphorus": "Phosphorus",
#     "vitamin d": "VitaminD",
#     "vitd": "VitaminD",
#     "vit d": "VitaminD",
#     "25-hydroxy vitamin d": "VitaminD",
#     "25-oh vitamin d": "VitaminD",
#     "25(oh)d": "VitaminD",
#     "pth": "PTH",
#     "parathyroid hormone": "PTH",
#     "osteocalcin": "Osteocalcin",
#     "bone gla protein": "Osteocalcin",
#     # IRF
#     "crp": "CRP",
#     "c-reactive protein": "CRP",
#     "c reactive protein": "CRP",
#     "high sensitivity crp": "CRP",
#     "hs-crp": "CRP",
#     "hscrp": "CRP",
#     "il6": "IL6",
#     "il-6": "IL6",
#     "interleukin 6": "IL6",
#     "interleukin-6": "IL6",
#     "mda": "MDA",
#     "malondialdehyde": "MDA",
#     # VAF
#     "vegf": "VEGF",
#     "vascular endothelial growth factor": "VEGF",
#     "mmp9": "MMP9",
#     "mmp-9": "MMP9",
#     "matrix metalloproteinase 9": "MMP9",
#     "matrix metalloproteinase-9": "MMP9",
#     "tgfb1": "TGFB1",
#     "tgf-b1": "TGFB1",
#     "tgf-beta1": "TGFB1",
#     "transforming growth factor beta 1": "TGFB1",
#     # PNF
#     "bdnf": "BDNF",
#     "brain-derived neurotrophic factor": "BDNF",
#     "brain derived neurotrophic factor": "BDNF",
#     "sp": "SP",
#     "substance p": "SP",
#     # MHF
#     "comp": "COMP",
#     "cartilage oligomeric matrix protein": "COMP",
#     "ckmm": "CKMM",
#     "ck-mm": "CKMM",
#     "creatine kinase mm": "CKMM",
#     "aldolasea": "AldolaseA",
#     "aldolase a": "AldolaseA",
#     "aldolase": "AldolaseA",
#     "ctxii": "CTXII",
#     "ctx-ii": "CTXII",
#     "c-terminal telopeptide type ii": "CTXII",
# }

# # Pre-build lower-cased key map (already lower in dict above)
# _ALIAS_MAP: dict[str, str] = {k.lower(): v for k, v in _RAW_ALIASES.items()}


# # ---------------------------------------------------------------------------
# # 3.  Public API
# # ---------------------------------------------------------------------------

# def normalize_name(raw: str) -> str | None:
#     """Return canonical biomarker name or None if unknown."""
#     return _ALIAS_MAP.get(raw.strip().lower())


# def get_domain(canonical: str) -> str | None:
#     return _CANONICAL_TO_DOMAIN.get(canonical)


# def map_to_domains(biomarkers: dict[str, dict]) -> dict[str, list[str]]:
#     """Return domain → [canonical_name] for present biomarkers only."""
#     result: dict[str, list[str]] = {}
#     for name in biomarkers:
#         domain = get_domain(name)
#         if domain:
#             result.setdefault(domain, []).append(name)
#     return result
from __future__ import annotations

DOMAIN_STRUCTURE: dict[str, list[str]] = {
    "IRF": ["CRP", "IL6", "MDA"],
    "VAF": ["VEGF", "MMP9", "TGFB1"],
    "PNF": ["BDNF", "SP"],
    "MHF": ["COMP", "CKMM", "AldolaseA", "CTXII"],
    "BMF": ["Calcium", "Phosphorus", "VitaminD", "PTH", "Osteocalcin"],
    "CMF": ["HbA1c", "TC", "LDL", "HDL", "TG"],
    "RFF": ["Creatinine", "BUN", "eGFR"],
}

_CANONICAL_TO_DOMAIN: dict[str, str] = {
    bio: domain
    for domain, bios in DOMAIN_STRUCTURE.items()
    for bio in bios
}

# Every alias LOWERCASED → canonical name
_ALIASES: dict[str, str] = {
    # ── CMF ──────────────────────────────────────────────────────────────
    "hba1c": "HbA1c",
    "hba1c %": "HbA1c",
    "hemoglobin a1c": "HbA1c",
    "haemoglobin a1c": "HbA1c",
    "glycated haemoglobin": "HbA1c",
    "glycated hemoglobin": "HbA1c",
    "glycosylated hemoglobin": "HbA1c",

    "total cholesterol": "TC",
    "serum cholesterol": "TC",
    "tc": "TC",
    "cholesterol": "TC",
    "cholesterol, total": "TC",

    "ldl cholesterol": "LDL",
    "ldl-c": "LDL",
    "ldl": "LDL",
    "l d l cholesterol": "LDL",
    "low density lipoprotein": "LDL",
    "low-density lipoprotein": "LDL",
    "ldl chol": "LDL",
    "ldl-cholesterol": "LDL",

    "hdl cholesterol": "HDL",
    "hdl-c": "HDL",
    "hdl": "HDL",
    "h d l cholesterol": "HDL",
    "high density lipoprotein": "HDL",
    "high-density lipoprotein": "HDL",
    "hdl chol": "HDL",
    "hdl-cholesterol": "HDL",

    "triglycerides": "TG",
    "triglyceride": "TG",
    "tg": "TG",
    "serum triglycerides": "TG",
    "trigs": "TG",

    # ── RFF ──────────────────────────────────────────────────────────────
    "creatinine": "Creatinine",
    "serum creatinine": "Creatinine",
    "s. creatinine": "Creatinine",
    "creatinine, serum": "Creatinine",

    "bun": "BUN",
    "blood urea nitrogen": "BUN",
    "blood urea nitrogen (bun)": "BUN",
    "urea nitrogen": "BUN",
    "urea nitrogen, blood": "BUN",
    "blood urea nitrogen(bun)": "BUN",

    "egfr": "eGFR",
    "estimated gfr": "eGFR",
    "glomerular filtration rate": "eGFR",
    "estimated glomerular filtration rate": "eGFR",

    # ── BMF ──────────────────────────────────────────────────────────────
    "calcium": "Calcium",
    "serum calcium": "Calcium",
    "serum total calcium": "Calcium",
    "total calcium": "Calcium",
    "calcium, serum": "Calcium",
    "ca": "Calcium",

    "phosphorus": "Phosphorus",
    "phosphate": "Phosphorus",
    "serum phosphorus": "Phosphorus",
    "serum inorganic phosphorus": "Phosphorus",
    "inorganic phosphorus": "Phosphorus",
    "serum phosphate": "Phosphorus",
    "phosphorus, serum": "Phosphorus",

    "vitamind": "VitaminD",
    "vitamin d": "VitaminD",
    "vit d": "VitaminD",
    "vitd": "VitaminD",
    "25-hydroxy vitamin d": "VitaminD",
    "25-oh vitamin d": "VitaminD",
    "25(oh)d": "VitaminD",
    "25 hydroxy vitamin d": "VitaminD",
    "vitamin d, 25-hydroxy": "VitaminD",
    "vitamin d total": "VitaminD",
    "vitamin d3": "VitaminD",
    "25 oh vitamin d": "VitaminD",

    "pth": "PTH",
    "parathyroid hormone": "PTH",
    "intact pth": "PTH",
    "i-pth": "PTH",
    "human i-pth": "PTH",
    "human i-pth (intact parathormone)": "PTH",
    "intact parathormone": "PTH",
    "human intact parathormone": "PTH",
    "ipth": "PTH",
    "parathormone": "PTH",

    "osteocalcin": "Osteocalcin",
    "bone gla protein": "Osteocalcin",
    "osteocalcin (sandwich-elisa)": "Osteocalcin",

    # ── IRF ──────────────────────────────────────────────────────────────
    "crp": "CRP",
    "c-reactive protein": "CRP",
    "c reactive protein": "CRP",
    "high sensitivity crp": "CRP",
    "hs-crp": "CRP",
    "hscrp": "CRP",
    "c-reactive protein (quantitative)(crp)": "CRP",
    "c-reactive protein (quantitative)": "CRP",
    "c-reactive protein(quantitative)": "CRP",

    "il6": "IL6",
    "il-6": "IL6",
    "interleukin 6": "IL6",
    "interleukin-6": "IL6",
    "il-6 (interleukin 6)": "IL6",
    "il-6 (interleukin 6) (sandwich-elisa)": "IL6",
    "il6 (interleukin 6) (sandwich-elisa)": "IL6",

    "mda": "MDA",
    "malondialdehyde": "MDA",
    "malondialdehyde (mda)": "MDA",
    "malondialdehyde (mda) (competitive elisa)": "MDA",

    # ── VAF ──────────────────────────────────────────────────────────────
    "vegf": "VEGF",
    "vascular endothelial growth factor": "VEGF",
    "human vegf-a": "VEGF",
    "vegf-a": "VEGF",
    "human vegf-a (vascular endothelial cell growth factor a) (sandwich-elisa)": "VEGF",
    "human vegf-a (vascular endothelial cell* growth factor a) (sandwich-elisa)": "VEGF",

    "mmp9": "MMP9",
    "mmp-9": "MMP9",
    "matrix metalloproteinase 9": "MMP9",
    "matrix metalloproteinase-9": "MMP9",
    "human mmp-9": "MMP9",
    "human mmp-9 (matrix metalloproteinase 9) (sandwich-elisa)": "MMP9",
    "human mmp-9 (matrix metalloproteinase* 9) (sandwich-elisa)": "MMP9",

    "tgfb1": "TGFB1",
    "tgf-b1": "TGFB1",
    "tgf-beta1": "TGFB1",
    "tgfbeta1": "TGFB1",
    "transforming growth factor beta 1": "TGFB1",
    "transforming growth factor beta-1": "TGFB1",
    "transforming growth factor beta1": "TGFB1",
    "tgfb1 (serum eia)": "TGFB1",
    "transforming growth factor beta 1 (tgfb1)": "TGFB1",
    "transforming growth factor beta 1 (tgfb1) (serum eia)": "TGFB1",
    "transforming growth factor beta 1 (tgfb1)*(serum eia)": "TGFB1",

    # ── PNF ──────────────────────────────────────────────────────────────
    "bdnf": "BDNF",
    "brain-derived neurotrophic factor": "BDNF",
    "brain derived neurotrophic factor": "BDNF",
    "brain derived neurotrophic factor (bdnf)": "BDNF",
    "brain derived neurotrophic factor* (serum eia)": "BDNF",
    "brain derived neurotrophic factor (serum eia)": "BDNF",

    "sp": "SP",
    "substance p": "SP",
    "substance p (competitive elisa)": "SP",
    "substance p* (competitive elisa)": "SP",

    # ── MHF ──────────────────────────────────────────────────────────────
    "comp": "COMP",
    "cartilage oligomeric matrix protein": "COMP",
    "human comp": "COMP",
    "human comp (cartilage oligomeric matrix protein) (sandwich-elisa)": "COMP",
    "human comp (cartilage oligomeric matrix* protein) (sandwich-elisa)": "COMP",

    "ckmm": "CKMM",
    "ck-mm": "CKMM",
    "creatine kinase mm": "CKMM",
    "creatine kinase, muscle": "CKMM",
    "creatine kinase, muscle (ckm)": "CKMM",
    "creatine kinase muscle": "CKMM",
    "creatine kinase, muscle (ckm)* (serum eia)": "CKMM",
    "ckm": "CKMM",
    "ck mm": "CKMM",

    "aldolasea": "AldolaseA",
    "aldolase a": "AldolaseA",
    "aldolase": "AldolaseA",
    "aldolase a* (serum eia)": "AldolaseA",
    "aldolase a (serum eia)": "AldolaseA",

    "ctxii": "CTXII",
    "ctx-ii": "CTXII",
    "c-terminal telopeptide type ii": "CTXII",
    "ctx ii": "CTXII",
    "ctx-ii (cross linked c-telopeptide of type ii collagen)(sandwich-elisa)": "CTXII",
    "ctx-ii (cross linked c-telopeptide of type ii* collagen)(sandwich-elisa)": "CTXII",
}

# Pre-lower all keys (already lower above, but belt-and-suspenders)
_ALIAS_MAP: dict[str, str] = {k.lower().strip(): v for k, v in _ALIASES.items()}


def normalize_name(raw: str) -> str | None:
    if not raw:
        return None
    cleaned = raw.strip().lower()
    # Direct lookup
    if cleaned in _ALIAS_MAP:
        return _ALIAS_MAP[cleaned]
    # Strip trailing asterisks/numbers/EIA/ELISA suffixes and retry
    shortened = re.sub(r"[\*\d]+$", "", cleaned).strip()
    if shortened in _ALIAS_MAP:
        return _ALIAS_MAP[shortened]
    # Partial match — if any alias is a substring of the cleaned name
    for alias, canonical in _ALIAS_MAP.items():
        if alias in cleaned:
            return canonical
    return None


import re  # noqa: E402  (needed for normalize_name)


def get_domain(canonical: str) -> str | None:
    return _CANONICAL_TO_DOMAIN.get(canonical)


def map_to_domains(biomarkers: dict[str, dict]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for name in biomarkers:
        domain = get_domain(name)
        if domain:
            result.setdefault(domain, []).append(name)
    return result
