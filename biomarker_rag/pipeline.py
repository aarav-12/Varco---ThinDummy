# # """
# # Pipeline orchestrator.

# # Responsibility: PDF → biomarkers only.
# # Biological age calculation stays in your Node backend.
# # """

# # from __future__ import annotations

# # import logging

# # from config import settings
# # from ingest import build_store
# # from retriever import retrieve
# # from extractor import extract_biomarkers
# # from normalizer import map_to_domains

# # logger = logging.getLogger(__name__)


# # def run_pipeline(pdf_path: str) -> dict:
# #     """
# #     Returns:
# #       {
# #         "biomarkers": { "HbA1c": { "value": 5.9, "unit": "%" }, ... },
# #         "biomarkersByDomain": { "CMF": ["HbA1c", "LDL"], ... },
# #         "rawList": [ { "name": "HbA1c", "value": 5.9, "unit": "%" }, ... ],
# #         "count": 14
# #       }
# #     or:
# #       { "error": "..." }
# #     """

# #     # 1. Build in-memory vector store from PDF
# #     try:
# #         store = build_store(pdf_path)
# #     except Exception as exc:
# #         logger.exception("Ingest failed")
# #         return {"error": f"Extraction failed: {exc}"}

# #     # 2. Retrieve top 3 most relevant chunks
# #     query = (
# #         "biomarker values lab results HbA1c LDL HDL cholesterol creatinine "
# #         "calcium vitamin D CRP glucose triglycerides"
# #     )
# #     chunks = retrieve(store, query)
# #     if not chunks:
# #         return {"error": "Extraction failed: no chunks retrieved"}

# #     # 3. Single LLM call
# #     try:
# #         raw_list = extract_biomarkers(chunks)
# #     except Exception as exc:
# #         logger.exception("LLM extraction failed")
# #         return {"error": f"Extraction failed: {exc}"}

# #     if not raw_list:
# #         return {"error": "Extraction failed: LLM returned no biomarkers"}

# #     # 4. Build mapped structure
# #     biomarkers: dict[str, dict] = {
# #         item["name"]: {"value": item["value"], "unit": item["unit"]}
# #         for item in raw_list
# #     }

# #     # 5. Domain grouping
# #     domains = map_to_domains(biomarkers)

# #     # 6. Minimum data check — return error Node can handle
# #     n = len(biomarkers)
# #     d = len(domains)
# #     if n < settings.MIN_BIOMARKERS or d < settings.MIN_DOMAINS:
# #         logger.warning("Insufficient: %d biomarkers, %d domains", n, d)
# #         return {
# #             "error": "Insufficient data for biological age calculation",
# #             "biomarkers": biomarkers,
# #             "biomarkersByDomain": domains,
# #             "count": n,
# #         }

# #     return {
# #         "biomarkers": biomarkers,
# #         "biomarkersByDomain": domains,
# #         "rawList": raw_list,
# #         "count": n,
# #     }
# """
# Pipeline: PDF → extract → return raw list.
# No domain mapping, no validation, no normalization.
# Node backend owns all of that.
# """

# from __future__ import annotations
# import logging
# import re

# import pdfplumber
# from ingest import build_store
# from retriever import retrieve
# from extractor import extract_biomarkers

# logger = logging.getLogger(__name__)


# def extract_age_from_pdf(pdf_path: str) -> tuple[int | None, str | None]:
#     patterns = [
#         (re.compile(r"age\s*/\s*gender\s*:\s*(\d{1,3})", re.IGNORECASE), "high"),
#         (re.compile(r"\bage\s*[:\-]?\s*(\d{1,3})\b", re.IGNORECASE), "medium"),
#         (re.compile(r"\b(\d{1,3})\s*y(?:ears?)?\b", re.IGNORECASE), "low"),
#     ]

#     try:
#         with pdfplumber.open(pdf_path) as pdf:
#             pages = pdf.pages[:3]
#             text = "\n".join((p.extract_text() or "") for p in pages)
#     except Exception:
#         return None, None

#     for pattern, confidence in patterns:
#         match = pattern.search(text)
#         if not match:
#             continue

#         try:
#             age = int(match.group(1))
#         except Exception:
#             continue

#         if 1 <= age <= 120:
#             return age, confidence

#     return None, None


# def run_pipeline(pdf_path: str) -> dict:
#     # 1. Build vector store (for LLM fallback chunks)
#     try:
#         store = build_store(pdf_path)
#     except Exception as exc:
#         logger.exception("Ingest failed")
#         return {"error": f"Extraction failed: {exc}"}

#     chunks = retrieve(store, "biomarker lab results test values")

#     # 2. Extract — table parser first, LLM fallback
#     try:
#         biomarkers = extract_biomarkers(chunks, pdf_path=pdf_path)
#     except Exception as exc:
#         logger.exception("Extraction failed")
#         return {"error": f"Extraction failed: {exc}"}

#     if not biomarkers:
#         return {"error": "No biomarkers found in this report"}

#     extracted_age, age_confidence = extract_age_from_pdf(pdf_path)

#     return {
#         "biomarkers": biomarkers,
#         "count": len(biomarkers),
#         "extractedAge": extracted_age,
#         "ageConfidence": age_confidence,
#     }
"""
Pipeline: PDF → extract → return raw list.
No domain mapping, no validation, no normalization.
Node backend owns all of that.
"""

from __future__ import annotations
import logging

from ingest import build_store
from retriever import retrieve
from extractor import extract_biomarkers
from age_extractor import extract_age   # independent module, runs on raw text

logger = logging.getLogger(__name__)


def run_pipeline(pdf_path: str) -> dict:
    # 1. Build vector store (for LLM fallback chunks)
    try:
        store = build_store(pdf_path)
    except Exception as exc:
        logger.exception("Ingest failed")
        return {"error": f"Extraction failed: {exc}"}

    chunks = retrieve(store, "biomarker lab results test values")

    # 2. Extract — table parser first, LLM fallback
    try:
        biomarkers = extract_biomarkers(chunks, pdf_path=pdf_path)
    except Exception as exc:
        logger.exception("Extraction failed")
        return {"error": f"Extraction failed: {exc}"}

    if not biomarkers:
        return {"error": "No biomarkers found in this report"}

    # 3. Age extraction — independent, runs on raw PDF text, not affected by
    #    any biomarker skip/clean logic
    age_result = extract_age(pdf_path)   # {"extractedAge": int|None, "ageConfidence": float}

    return {
        "biomarkers": biomarkers,
        "count": len(biomarkers),
        **age_result,
    }