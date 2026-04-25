"""
Biological Age Calculation System.

Pipeline:
  biomarkers dict → z-scores → domain scores → weighted aggregation → bio age

⚠️  DO NOT MODIFY this module's public interface or calculation logic.
"""

from __future__ import annotations

import logging
import math
from typing import Optional

from normalizer import DOMAIN_STRUCTURE

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Reference ranges  (population means + std deviations)
# Direction:
#   "higher_worse" → higher value = older biological age
#   "lower_worse"  → lower value  = older biological age
#   "bidirectional"→ deviation in either direction = older age
# ---------------------------------------------------------------------------

_REFERENCE: dict[str, dict] = {
    # CMF
    "HbA1c":      {"mean": 5.5,   "std": 0.5,   "direction": "higher_worse"},
    "TC":         {"mean": 180.0, "std": 20.0,  "direction": "higher_worse"},
    "LDL":        {"mean": 100.0, "std": 20.0,  "direction": "higher_worse"},
    "HDL":        {"mean": 55.0,  "std": 10.0,  "direction": "lower_worse"},
    "TG":         {"mean": 120.0, "std": 30.0,  "direction": "higher_worse"},
    # RFF
    "Creatinine": {"mean": 0.9,   "std": 0.2,   "direction": "higher_worse"},
    "BUN":        {"mean": 15.0,  "std": 5.0,   "direction": "higher_worse"},
    "eGFR":       {"mean": 90.0,  "std": 15.0,  "direction": "lower_worse"},
    # BMF
    "Calcium":    {"mean": 9.5,   "std": 0.5,   "direction": "bidirectional"},
    "Phosphorus": {"mean": 3.5,   "std": 0.5,   "direction": "bidirectional"},
    "VitaminD":   {"mean": 40.0,  "std": 10.0,  "direction": "lower_worse"},
    "PTH":        {"mean": 40.0,  "std": 15.0,  "direction": "higher_worse"},
    "Osteocalcin":{"mean": 20.0,  "std": 8.0,   "direction": "bidirectional"},
    # IRF
    "CRP":        {"mean": 1.0,   "std": 0.5,   "direction": "higher_worse"},
    "IL6":        {"mean": 2.0,   "std": 1.0,   "direction": "higher_worse"},
    "MDA":        {"mean": 1.5,   "std": 0.5,   "direction": "higher_worse"},
    # VAF
    "VEGF":       {"mean": 200.0, "std": 80.0,  "direction": "bidirectional"},
    "MMP9":       {"mean": 50.0,  "std": 20.0,  "direction": "higher_worse"},
    "TGFB1":      {"mean": 10.0,  "std": 4.0,   "direction": "higher_worse"},
    # PNF
    "BDNF":       {"mean": 30.0,  "std": 10.0,  "direction": "lower_worse"},
    "SP":         {"mean": 100.0, "std": 30.0,  "direction": "higher_worse"},
    # MHF
    "COMP":       {"mean": 10.0,  "std": 3.0,   "direction": "higher_worse"},
    "CKMM":       {"mean": 100.0, "std": 40.0,  "direction": "higher_worse"},
    "AldolaseA":  {"mean": 5.0,   "std": 2.0,   "direction": "higher_worse"},
    "CTXII":      {"mean": 300.0, "std": 100.0, "direction": "higher_worse"},
}

# Domain weights  (must sum to 1.0)
_DOMAIN_WEIGHTS: dict[str, float] = {
    "CMF": 0.25,
    "RFF": 0.20,
    "IRF": 0.20,
    "BMF": 0.15,
    "MHF": 0.10,
    "VAF": 0.05,
    "PNF": 0.05,
}

_BASE_AGE = 35.0   # healthy reference age
_SCALE = 10.0      # years per z-score unit


def _z_score(canonical: str, value: float) -> Optional[float]:
    """Signed z-score, direction-adjusted so positive = biologically older."""
    ref = _REFERENCE.get(canonical)
    if ref is None:
        return None
    z = (value - ref["mean"]) / ref["std"]
    if ref["direction"] == "lower_worse":
        z = -z
    elif ref["direction"] == "bidirectional":
        z = abs(z)
    return z


def _domain_score(domain: str, biomarkers: dict[str, dict]) -> Optional[float]:
    """Mean z-score for all present biomarkers in this domain."""
    members = DOMAIN_STRUCTURE.get(domain, [])
    zs = []
    for name in members:
        if name in biomarkers:
            z = _z_score(name, biomarkers[name]["value"])
            if z is not None:
                zs.append(z)
    return sum(zs) / len(zs) if zs else None


def calculate_biological_age(
    biomarkers: dict[str, dict],
) -> tuple[float, dict[str, float]]:
    """
    Returns (biological_age, domain_scores_dict).

    biological_age = base_age + scale * weighted_mean_z
    """
    domain_scores: dict[str, float] = {}
    weighted_sum = 0.0
    weight_total = 0.0

    for domain, weight in _DOMAIN_WEIGHTS.items():
        score = _domain_score(domain, biomarkers)
        if score is not None:
            domain_scores[domain] = round(score, 4)
            weighted_sum += weight * score
            weight_total += weight

    if weight_total == 0:
        raise ValueError("No domain scores computable — insufficient biomarkers")

    # Normalise in case not all domains are present
    normalised_z = weighted_sum / weight_total
    bio_age = round(_BASE_AGE + _SCALE * normalised_z, 2)

    logger.info(
        "Biological age: %.2f  (normalised_z=%.4f, domains=%d)",
        bio_age, normalised_z, len(domain_scores),
    )
    return bio_age, domain_scores
