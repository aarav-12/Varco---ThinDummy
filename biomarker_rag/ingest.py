from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

import httpx
import numpy as np
import pdfplumber

from config import settings

logger = logging.getLogger(__name__)

MAX_CHUNKS = 3
CHUNK_TARGET_CHARS = 3000
EMBED_MAX_CHARS = 3500   # nomic-embed-text safe limit (~8192 tokens but be conservative)


@dataclass
class Chunk:
    text: str
    index: int


@dataclass
class VectorStore:
    chunks: list[Chunk] = field(default_factory=list)
    embeddings: list[np.ndarray] = field(default_factory=list)

    def is_empty(self) -> bool:
        return len(self.chunks) == 0


def _extract_text(pdf_path: str) -> str:
    pages: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    for row in table:
                        cleaned = "  |  ".join(
                            (cell or "").strip() for cell in row if cell
                        )
                        if cleaned:
                            pages.append(cleaned)
            text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if text:
                pages.append(text)
    return "\n\n".join(pages)


def _clean_text(raw: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", raw)
    text = text.replace("\x0c", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(lines)


def _chunk_text(text: str) -> list[str]:
    if len(text) <= CHUNK_TARGET_CHARS:
        return [text]
    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for para in paragraphs:
        if current_len + len(para) > CHUNK_TARGET_CHARS and current:
            chunks.append("\n\n".join(current))
            current = [para]
            current_len = len(para)
        else:
            current.append(para)
            current_len += len(para)
    if current:
        chunks.append("\n\n".join(current))
    while len(chunks) > MAX_CHUNKS:
        last = chunks.pop()
        chunks[-1] = chunks[-1] + "\n\n" + last
    return chunks


def _embed_one(text: str) -> np.ndarray:
    """
    Truncate to EMBED_MAX_CHARS before sending.
    Try new Ollama /api/embed first, fall back to /api/embeddings.
    """
    # Truncate — embedder only needs enough text to build a retrieval vector
    safe_text = text[:EMBED_MAX_CHARS]
    raw = None

    # New Ollama >= 0.1.26
    try:
        resp = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/embed",
            json={"model": settings.EMBEDDING_MODEL, "input": safe_text},
            timeout=60,
        )
        if resp.status_code == 200:
            data = resp.json()
            if "embeddings" in data and data["embeddings"]:
                raw = data["embeddings"][0]
    except Exception:
        pass

    # Old Ollama fallback
    if raw is None:
        resp = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/embeddings",
            json={"model": settings.EMBEDDING_MODEL, "prompt": safe_text},
            timeout=60,
        )
        resp.raise_for_status()
        raw = resp.json()["embedding"]

    vec = np.array(raw, dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec


def _embed(texts: list[str]) -> list[np.ndarray]:
    return [_embed_one(t) for t in texts]


def build_store(pdf_path: str) -> VectorStore:
    logger.info("Building vector store from: %s", pdf_path)
    raw = _extract_text(pdf_path)
    if not raw.strip():
        raise ValueError("PDF produced no extractable text")
    cleaned = _clean_text(raw)
    texts = _chunk_text(cleaned)
    logger.info("Created %d chunk(s)", len(texts))
    embeddings = _embed(texts)
    store = VectorStore(
        chunks=[Chunk(text=t, index=i) for i, t in enumerate(texts)],
        embeddings=embeddings,
    )
    return store
