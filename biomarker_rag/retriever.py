"""
Retriever: cosine-similarity search over the in-memory VectorStore.

Priority scoring also boosts chunks with high numeric density and
biomarker keyword hits — matches the spec's retrieval criteria.
"""

from __future__ import annotations

import re
import logging

import numpy as np

from config import settings
from ingest import VectorStore, _embed

logger = logging.getLogger(__name__)

# Quick keyword set — used only to boost scoring, not for filtering
_BIOMARKER_KEYWORDS = {
    "hba1c", "ldl", "hdl", "creatinine", "calcium", "bun", "egfr",
    "cholesterol", "triglyceride", "crp", "vitamin d", "glucose",
    "urea", "phosphorus", "osteocalcin", "pth", "bdnf", "vegf",
    "mmp", "tgf", "il-6", "il6", "albumin", "hemoglobin", "haemoglobin",
}


def _numeric_density(text: str) -> float:
    """Fraction of tokens that are numeric."""
    tokens = text.split()
    if not tokens:
        return 0.0
    numeric = sum(1 for t in tokens if re.search(r"\d", t))
    return numeric / len(tokens)


def _keyword_score(text: str) -> float:
    lower = text.lower()
    hits = sum(1 for kw in _BIOMARKER_KEYWORDS if kw in lower)
    return min(hits / 5.0, 1.0)  # cap at 1.0


def retrieve(store: VectorStore, query: str, k: int | None = None) -> list[str]:
    """
    Return top-k chunk texts ranked by:
        0.6 * cosine_similarity  +  0.25 * numeric_density  +  0.15 * keyword_score
    """
    k = k or settings.TOP_K_CHUNKS
    if store.is_empty():
        return []

    query_vec = _embed([query])[0]   # unit-normed

    scores: list[tuple[float, int]] = []
    for i, (chunk, emb) in enumerate(zip(store.chunks, store.embeddings)):
        cosine = float(np.dot(query_vec, emb))
        nd = _numeric_density(chunk.text)
        ks = _keyword_score(chunk.text)
        score = 0.6 * cosine + 0.25 * nd + 0.15 * ks
        scores.append((score, i))

    scores.sort(reverse=True)
    top = scores[:k]

    logger.info(
        "Top-%d chunks: %s",
        k,
        [(round(s, 3), store.chunks[i].index) for s, i in top],
    )
    return [store.chunks[i].text for _, i in top]
