"""
FastAPI entry point.

POST /analyze  → multipart form: file=<pdf>
GET  /health   → liveness probe
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from pipeline import run_pipeline

# 🔧 Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Biomarker RAG API", version="1.0.0")


# 🟢 Health check (Render uses this)
@app.get("/health")
def health():
    return {"status": "ok"}


# 🔥 Main extraction endpoint
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # ✅ Validate PDF
    is_pdf_name = file.filename.lower().endswith(".pdf")
    is_pdf_type = file.content_type in (
        "application/pdf",
        "application/octet-stream",
        "binary/octet-stream",
    )

    if not is_pdf_name and not is_pdf_type:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # 📄 Save to temp file (required by pdf libraries)
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        logger.info(f"📄 Processing file: {file.filename}")

        result = run_pipeline(tmp_path)

        logger.info(f"✅ Extraction complete: {result.get('count', 0)} biomarkers")

    except Exception as e:
        logger.exception("❌ Pipeline failed")
        return JSONResponse(
            content={"error": f"Internal error: {str(e)}"},
            status_code=500,
        )

    finally:
        # 🧹 Safe cleanup
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    # ⚠️ Handle pipeline-level errors
    if "error" in result:
        status = 422 if "Insufficient" in result["error"] else 500
        return JSONResponse(content=result, status_code=status)

    return JSONResponse(content=result, status_code=200)


# 🚀 Render-compatible entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))  # 🔥 REQUIRED for Render
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)