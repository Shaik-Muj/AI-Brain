import fitz  # PyMuPDF
import os
import uuid
import logging
from PIL import Image
import pytesseract

logging.basicConfig(level=logging.INFO)


def extract_text_from_pdf(file_path):
    text_by_page = []
    try:
        with fitz.open(file_path) as doc:
            logging.info(f"Opened PDF: {file_path}, Total pages: {len(doc)}")
            for page_num, page in enumerate(doc, start=1):
                text = page.get_text()
                if text.strip():
                    logging.info(f"Extracted text from page {page_num}: {len(text)} characters")
                    text_by_page.append(text)
                else:
                    logging.warning(f"No text found on page {page_num} of {file_path}")
        if not text_by_page:
            logging.error(f"No extractable text found in the PDF: {file_path}")
        return text_by_page
    except Exception as e:
        logging.error(f"Error extracting text from PDF {file_path}: {str(e)}")
        return []


def save_uploaded_pdf(file):
    try:
        temp_dir = "temp_pdfs"
        os.makedirs(temp_dir, exist_ok=True)
        file_id = uuid.uuid4().hex
        file_path = os.path.join(temp_dir, f"{file_id}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        logging.info(f"PDF saved successfully: {file_path}")
        return file_path
    except Exception as e:
        logging.error(f"Error saving uploaded PDF: {str(e)}")
        raise RuntimeError(f"Failed to save uploaded PDF: {str(e)}")