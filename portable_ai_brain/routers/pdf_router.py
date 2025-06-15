from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import FileResponse
from pdf.pdf_utils import extract_text_from_pdf, save_uploaded_pdf
from utils.context_injector import inject_context
from utils.task_planner import split_into_subtasks
from models import get_llm_client
from memory import LongTermMemory
from document.vector_store import query_vector_store
import uuid
import logging
import os

logging.basicConfig(level=logging.INFO)

router = APIRouter()

# Store the text globally per session (in real apps, use session/context mgmt)
pdf_text_cache = {}

# Memory to store chat history
chat_memory = {}

# Initialize long-term memory
long_term_memory = LongTermMemory()


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        pdf_id = uuid.uuid4().hex
        file_path = save_uploaded_pdf(file, pdf_id)
        pages = extract_text_from_pdf(file_path)
        if not pages:
            logging.error(f"No text extracted from the uploaded PDF: {file.filename}")
            return {"success": False, "error": "No extractable text found in the uploaded PDF."}

        logging.info(f"Extracted text from PDF {file.filename}: {sum(len(page) for page in pages)} characters across {len(pages)} pages")

        pdf_text_cache[pdf_id] = pages
        full_text = "\\n".join(pages)

        # Use LLM to generate summary points
        llm_client = get_llm_client("openai")
        summary_prompt = (
            "Read the following document and extract the most important points as concise bullet points. "
            "Additionally, include related points that are not explicitly mentioned in the document but are relevant to the topic:\n\n"
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
            "fullText": full_text
        }
    except Exception as e:
        logging.error(f"Error processing PDF upload: {str(e)}")
        return {"success": False, "error": str(e)}


@router.post("/ask-pdf")
async def ask_pdf(request: Request):
    data = await request.json()
    pdf_id = data.get("pdf_id")
    question = data.get("question")
    
    if not pdf_id or not question:
        return {"error": "Missing pdf_id or question"}
        
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
async def ask_pdf_conversational(request: Request):
    """Conversational endpoint for PDF-based questions."""
    data = await request.json()
    question = data.get("question")
    pdf_text = data.get("pdfText")
    selected_context = data.get("selectedContext", "")
    user_id = data.get("userId", "default_user")

    if not question or not pdf_text:
        return {"error": "Missing question or pdfText"}

    # Retrieve long-term memory for the user
    history = long_term_memory.get_interactions(user_id)

    # Construct a context-aware prompt
    context = "\n".join([f"Q: {q} A: {a}" for q, a in history])
    prompt_with_context = f"""
Based on the following PDF content, conversation history, and selected context, please answer the question:

PDF Content:
{pdf_text}

Conversation History:
{context}

Selected Context:
{selected_context}

Question: {question}
"""

    # Use OpenAI client as default for PDF questions
    llm_client = get_llm_client("openai")
    response = llm_client.call(prompt_with_context)

    # Update long-term memory
    long_term_memory.add_interaction(user_id, question, response)

    return {"answer": response}


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


@router.post("/recommendations")
async def get_recommendations(request: Request):
    """Get dynamic recommendations based on the provided query text and context."""
    try:        # Properly parse the incoming JSON request
        data = await request.json()
        query = data.get("query", "")
        context = data.get("context", "")
        suggestion_types = data.get("types", ["follow_up", "related", "deeper", "examples"])
        random_seed = data.get("random_seed", None)
        
        if not query:
            return {"recommendations": []}
        
        # Debug log
        print(f"Processing recommendation request for query: {query[:100]}...")
        print(f"Suggestion types requested: {suggestion_types}")
          # Use LLM to generate dynamic, contextual recommendations
        try:
            llm_client = get_llm_client("openai")
            
            # Get PDF content if a PDF ID is provided
            pdf_content = ""
            pdf_id = data.get("pdf_id", "")
            if pdf_id and pdf_id in pdf_text_cache:
                # Get first 1000 chars of the PDF for context
                pdf_content = "\n".join(pdf_text_cache[pdf_id])[:1500]
                print(f"Including PDF content for context with ID: {pdf_id}")
            
            # Create an enhanced prompt for generating recommendations            # Add randomness to the prompt if a seed is provided
            random_instruction = ""
            if random_seed:
                random_instruction = f"Use variation seed {random_seed} to ensure diverse recommendations."
                
            recommendation_prompt = f"""
Based on the following content and user query, generate 5 highly relevant follow-up questions that would help the user extract more value from the document. {random_instruction}

Document Content: {pdf_content if pdf_content else "(No specific document context available)"}

Content/Context from Conversation: {context[:800] if context else "(No conversation context available)"}

User's Last Query: {query}

Generate diverse recommendations covering these categories:
- Detailed questions about specific concepts mentioned in the document
- Questions that connect document content with practical applications
- Questions that seek clarification on technical aspects or terminology
- Questions that explore implications or consequences of the document's content
- Questions that compare concepts from the document with related fields or approaches

Requirements:
- Make questions highly specific to the actual document content
- Ensure questions are clearly connected to information in the document
- Each question should be concise (10-15 words maximum)
- Focus on helping the user extract maximum value from the document
- Questions should be formulated to elicit detailed, informative responses

Generate exactly 5 recommendations, one per line, without numbering or bullet points:
"""
            
            recommendations_text = llm_client.call(recommendation_prompt)
            
            # Parse the LLM response into a list
            recommendations = []
            for line in recommendations_text.split('\n'):
                line = line.strip()
                # Remove numbering, bullets, and clean up
                line = line.lstrip('0123456789.-• ')
                if line and len(line) > 10:  # Only include substantial recommendations
                    recommendations.append(line)
            
            # Ensure we have at least some recommendations
            if len(recommendations) < 3:
                recommendations.extend([
                    "What are the key practical applications of this concept?",
                    "How does this compare to similar approaches?",
                    "Can you provide specific examples from real-world scenarios?",
                    "What are the main benefits and limitations?",
                    "How would you implement this in practice?"
                ])
            
            # Limit to 5 recommendations
            recommendations = recommendations[:5]
            
        except Exception as e:
            print(f"LLM recommendation generation error: {e}")
              # Get PDF content if available
            pdf_id = data.get("pdf_id", "")
            if pdf_id and pdf_id in pdf_text_cache:
                # Get a small sample of phrases from the PDF to make contextual suggestions
                pdf_text = "\n".join(pdf_text_cache[pdf_id])
                # Extract some keywords for better suggestions
                important_phrases = []
                
                # Look for capitalized phrases which are often key terms
                import re
                capitalized_phrases = re.findall(r'([A-Z][a-z]+ [A-Za-z ]{1,20})', pdf_text)
                important_phrases.extend(capitalized_phrases[:5])
                
                # Enhanced PDF-specific recommendations
                recommendations = [
                    f"What are the key findings about {important_phrases[0] if important_phrases else 'this topic'} in the document?",
                    "How does this document compare to current research in the field?",
                    "What are the practical applications of the concepts presented?",
                    "Can you extract the methodology used in this research?",
                    "What are the limitations or gaps mentioned in this document?"
                ]
            elif "PDF" in query or "document" in query.lower():
                recommendations = [
                    "What are the main conclusions in this document?",
                    "Can you summarize the key findings?", 
                    "What evidence supports these claims?",
                    "How does this relate to current industry practices?",
                    "What are the practical implications of these findings?"
                ]
            elif any(word in query.lower() for word in ["explain", "what", "how"]):
                recommendations = [
                    "Can you provide specific examples from the document?",
                    "What are the step-by-step procedures described?",
                    "How would you apply these concepts in a real scenario?",
                    "What are common misconceptions about this topic?",
                    "What tools or methodologies are mentioned in the document?"
                ]
            else:
                recommendations = [
                    "What are the most surprising insights from this document?", 
                    "How do these concepts relate to current industry trends?",
                    "What practical applications are suggested in the document?",
                    "How does this research compare to previous studies?",
                    "What future research directions are mentioned?"
                ]
        
        print(f"Returning {len(recommendations)} recommendations")
        return {"recommendations": recommendations}
        
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        return {"recommendations": [
            "What are the main takeaways from this discussion?", 
            "Can you explain the key concepts in simpler terms?",
            "What real-world applications does this have?",
            "How does this connect to other related topics?",
            "What would be the next logical step to explore?"
        ]}


@router.get("/get-pdf/{pdf_id}")
async def get_pdf_file(pdf_id: str):
    try:
        # Enhanced request logging with clear demarcation
        logging.info(f"========== PDF REQUEST STARTED ==========")
        logging.info(f"PDF file requested with ID: {pdf_id}")
        
        # Input validation
        if not pdf_id or not isinstance(pdf_id, str) or len(pdf_id) < 5:
            logging.error(f"Invalid PDF ID format: {pdf_id}")
            raise HTTPException(status_code=400, detail=f"Invalid PDF ID format: {pdf_id}")
        
        # Debug check for pdf_text_cache
        if pdf_text_cache:
            if pdf_id not in pdf_text_cache:
                logging.warning(f"PDF ID {pdf_id} not found in pdf_text_cache")
                # List available IDs for debugging (but limit the output)
                cache_ids = list(pdf_text_cache.keys())[:5]
                cache_count = len(pdf_text_cache)
                logging.info(f"First 5 available PDF IDs in cache (total: {cache_count}): {cache_ids}")
                logging.info(f"Attempting to find file even though ID is not in cache...")
            else:
                logging.info(f"PDF ID {pdf_id} found in pdf_text_cache")
        else:
            logging.warning("pdf_text_cache is empty or not initialized")

        # Search for the file in the temp_pdfs directory
        temp_dir = "temp_pdfs"
        
        # Make sure the directory exists
        if not os.path.isdir(temp_dir):
            os.makedirs(temp_dir, exist_ok=True)
            logging.info(f"Created missing temp_pdfs directory")
            
        files = os.listdir(temp_dir)
        logging.info(f"Found {len(files)} files in {temp_dir} directory")
        
        # Find the file with more robust matching approaches
        pdf_file_path = None
        exact_matches = []
        prefix_matches = []
        substring_matches = []
        
        for file in files:
            # Track different matching strategies for logging
            if file.startswith(f"{pdf_id}_"):
                prefix_matches.append(file)
            elif pdf_id in file:
                substring_matches.append(file)
                
        # Log match attempts
        logging.info(f"Match results for ID {pdf_id}:")
        logging.info(f"  Prefix matches: {len(prefix_matches)}")
        logging.info(f"  Substring matches: {len(substring_matches)}")
        
        # Choose the best match (prefer prefix matches)
        if prefix_matches:
            pdf_file_path = os.path.join(temp_dir, prefix_matches[0])
            logging.info(f"Using prefix match: {prefix_matches[0]}")
        elif substring_matches:
            pdf_file_path = os.path.join(temp_dir, substring_matches[0])
            logging.info(f"Using substring match: {substring_matches[0]}")
        
        if not pdf_file_path:
            # Better error messaging with helpful debugging info
            logging.error(f"PDF file with ID {pdf_id} not found in {temp_dir}")
            sample_files = [f for f in files[:5] if f.endswith('.pdf')]
            error_detail = {
                "error": f"PDF file with ID {pdf_id} not found",
                "directory": temp_dir,
                "file_count": len(files),
                "sample_files": sample_files,
                "tip": "Check if the file was uploaded correctly and the ID is correct."
            }
            raise HTTPException(status_code=404, detail=error_detail)
        
        # Verify file exists and is readable
        if not os.path.exists(pdf_file_path):
            logging.error(f"File path exists in matching logic but file not found: {pdf_file_path}")
            raise HTTPException(status_code=404, detail=f"PDF file exists in index but not on disk: {pdf_file_path}")
        
        # Add logging to help with debugging
        file_size = os.path.getsize(pdf_file_path)
        logging.info(f"Serving PDF file: {pdf_file_path} ({file_size} bytes)")
        logging.info(f"========== PDF REQUEST COMPLETED ==========")
        
        # Create a response with the PDF file and add CORS headers
        response = FileResponse(
            path=pdf_file_path, 
            media_type="application/pdf",
            headers={
                # Use inline instead of attachment to view in browser
                "Content-Disposition": f"inline; filename={os.path.basename(pdf_file_path)}",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD",
                "Access-Control-Allow-Headers": "Content-Type, Content-Disposition, Content-Length",
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, Content-Type"
            }
        )
        
        return response
    except HTTPException:
        # Re-raise HTTP exceptions (404, etc.) without wrapping them
        logging.error(f"========== PDF REQUEST FAILED WITH HTTP ERROR ==========")
        raise
    except Exception as e:
        # Catch other exceptions and wrap them in a 500 error
        logging.error(f"Error in get_pdf_file: {str(e)}")
        logging.error(f"========== PDF REQUEST FAILED WITH SERVER ERROR ==========")
        raise HTTPException(status_code=500, detail=f"Error retrieving PDF: {str(e)}")
