import fitz  # PyMuPDF
import re

def extract_text_from_pdf(pdf_path: str, chunk_size: int = 500) -> list:
    doc = fitz.open(pdf_path)
    full_text = ""

    for page in doc:
        full_text += page.get_text()

    # Clean and chunk
    full_text = re.sub(r'\s+', ' ', full_text).strip()
    chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
    return chunks
