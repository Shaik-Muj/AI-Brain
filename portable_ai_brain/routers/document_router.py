from fastapi import APIRouter, UploadFile, File, Form
from document.pdf_parser import extract_text_from_pdf
from document.vector_store import create_or_load_vector_store, query_vector_store
import os
import uuid

router = APIRouter()
VECTOR_DB_DIR = "vector_dbs"
os.makedirs(VECTOR_DB_DIR, exist_ok=True)

# Upload and parse PDF to build vector store
@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    file_id = uuid.uuid4().hex
    pdf_path = f"temp_{file_id}.pdf"

    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    text_chunks = extract_text_from_pdf(pdf_path)
    db_path = os.path.join(VECTOR_DB_DIR, f"{file_id}.faiss")
    create_or_load_vector_store(text_chunks, db_path)

    os.remove(pdf_path)
    return {"file_id": file_id, "message": "PDF uploaded and indexed."}

# Ask question based on PDF context
@router.post("/ask-pdf")
async def ask_pdf(file_id: str = Form(...), question: str = Form(...)):
    db_path = os.path.join(VECTOR_DB_DIR, f"{file_id}.faiss")
    if not os.path.exists(db_path):
        return {"error": "Document not found."}

    answer = query_vector_store(db_path, question)
    return {"answer": answer}
