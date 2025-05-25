from fastapi import APIRouter, UploadFile, File, Form, Request
from pdf.pdf_utils import extract_text_from_pdf, save_uploaded_pdf
from utils.context_injector import inject_context
from utils.task_planner import split_into_subtasks
from models import get_llm_client
import uuid
import logging

logging.basicConfig(level=logging.INFO)

router = APIRouter()

# Store the text globally per session (in real apps, use session/context mgmt)
pdf_text_cache = {}


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        file_path = save_uploaded_pdf(file)
        pages = extract_text_from_pdf(file_path)
        if not pages:
            logging.error(f"No text extracted from the uploaded PDF: {file.filename}")
            return {"success": False, "error": "No extractable text found in the uploaded PDF."}

        logging.info(f"Extracted text from PDF {file.filename}: {sum(len(page) for page in pages)} characters across {len(pages)} pages")

        pdf_id = uuid.uuid4().hex
        pdf_text_cache[pdf_id] = pages
        full_text = "\n".join(pages)

        # Use LLM to generate summary points
        llm_client = get_llm_client("openai")
        summary_prompt = (
            "Read the following document and extract the most important points as concise bullet points:\n\n"
            f"{full_text}\n\nBullet Points:"
        )
        summary_points = llm_client.call(summary_prompt)
        points = [p.strip("-• \n") for p in summary_points.split("\n") if p.strip()]

        logging.info(f"Generated summary points: {points}")

        logging.info(f"PDF uploaded successfully: {file.filename}")
        return {
            "success": True,
            "pdf_id": pdf_id,
            "num_pages": len(pages),
            "points": points,
            "summary": "\n".join(points),
        }
    except Exception as e:
        logging.error(f"Error processing PDF upload: {str(e)}")
        return {"success": False, "error": str(e)}


@router.post("/ask-pdf")
async def ask_pdf(pdf_id: str = Form(...), question: str = Form(...)):
    pages = pdf_text_cache.get(pdf_id)
    if not pages:
        return {"error": "PDF not found or expired."}

    full_text = "\n".join(pages)
    subtasks = split_into_subtasks(question)
    
    # Use OpenAI client as default for PDF questions
    llm_client = get_llm_client("openai")
    responses = []
    for subtask in subtasks:
        # Create a comprehensive prompt with PDF context
        prompt_with_context = f"""
Based on the following PDF content, please answer the question: {subtask}

PDF Content:
{full_text}

Question: {subtask}
"""
        response = llm_client.call(prompt_with_context)
        responses.append(response)
    
    answer = "\n".join(responses)
    return {"answer": answer}


@router.post("/ask")
async def ask_pdf_simple(request: Request):
    """Simple endpoint that matches frontend expectations"""
    data = await request.json()
    question = data.get("question")
    pdf_text = data.get("pdfText")
    
    if not question or not pdf_text:
        return {"error": "Missing question or pdfText"}
    
    subtasks = split_into_subtasks(question)
    
    # Use OpenAI client as default for PDF questions
    llm_client = get_llm_client("openai")
    responses = []
    for subtask in subtasks:
        # Create a comprehensive prompt with PDF context
        prompt_with_context = f"""
Based on the following PDF content, please answer the question: {subtask}

PDF Content:
{pdf_text}

Question: {subtask}
"""
        response = llm_client.call(prompt_with_context)
        responses.append(response)
    
    answer = "\n".join(responses)
    return {"answer": answer}


@router.get("/summary")
async def get_pdf_summary():
    """Get summary of the most recently uploaded PDF"""
    if not pdf_text_cache:
        return {"error": "No PDF uploaded"}
    
    # Get the most recent PDF
    latest_pdf_id = list(pdf_text_cache.keys())[-1]
    pages = pdf_text_cache[latest_pdf_id]
    full_text = "\n".join(pages)
    
    # Use OpenAI client to generate summary
    llm_client = get_llm_client("openai")
    summary_prompt = f"""
Please provide a concise summary of the following document:

{full_text}

Summary:
"""
    summary = llm_client.call(summary_prompt)
    return {"summary": summary}
