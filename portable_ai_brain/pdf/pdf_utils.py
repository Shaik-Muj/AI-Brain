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


def save_uploaded_pdf(file, file_id=None):
    """
    Save the uploaded PDF file to the temp_pdfs directory.
    Returns the file path where the PDF was saved.
    """
    try:
        temp_dir = "temp_pdfs"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate a file ID if not provided
        if file_id is None:
            file_id = uuid.uuid4().hex
        
        # Ensure file_id is a string
        file_id = str(file_id)
        
        # Get a safe filename from the original
        safe_filename = file.filename.replace(' ', '_').replace('/', '_').replace('\\', '_')
        
        # Create the file path with the ID as a prefix
        file_path = os.path.join(temp_dir, f"{file_id}_{safe_filename}")
        
        # Read and write the file in binary mode
        with open(file_path, "wb") as f:
            # Read file content
            content = file.file.read()
            # Verify we have data
            if not content:
                raise ValueError("Uploaded file is empty")
            # Write to disk
            f.write(content)
        
        # Verify the file was saved correctly
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            logging.info(f"PDF saved successfully: {file_path} ({os.path.getsize(file_path)} bytes)")
            return file_path
        else:
            raise ValueError(f"File was not saved properly to {file_path}")
            
    except Exception as e:
        logging.error(f"Error saving uploaded PDF: {str(e)}")
        raise RuntimeError(f"Failed to save uploaded PDF: {str(e)}")