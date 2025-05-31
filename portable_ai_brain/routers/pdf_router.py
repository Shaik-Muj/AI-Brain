from fastapi import APIRouter, UploadFile, File, Form, Request
from pdf.pdf_utils import extract_text_from_pdf, save_uploaded_pdf
from utils.context_injector import inject_context
from utils.task_planner import split_into_subtasks
from models import get_llm_client
from memory import LongTermMemory
from document.vector_store import query_vector_store
import uuid
import logging

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
        file_path = save_uploaded_pdf(file)
        pages = extract_text_from_pdf(file_path)
        if not pages:
            logging.error(f"No text extracted from the uploaded PDF: {file.filename}")
            return {"success": False, "error": "No extractable text found in the uploaded PDF."}

        logging.info(f"Extracted text from PDF {file.filename}: {sum(len(page) for page in pages)} characters across {len(pages)} pages")

        pdf_id = uuid.uuid4().hex
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
    try:
        # Properly parse the incoming JSON request
        data = await request.json()
        query = data.get("query", "")
        context = data.get("context", "")
        suggestion_types = data.get("types", ["follow_up", "related", "deeper", "examples"])
        
        if not query:
            return {"recommendations": []}
        
        # Debug log
        print(f"Processing recommendation request for query: {query[:100]}...")
        print(f"Suggestion types requested: {suggestion_types}")
        
        # Use LLM to generate dynamic, contextual recommendations
        try:
            llm_client = get_llm_client("openai")
            
            # Create a smart prompt for generating recommendations
            recommendation_prompt = f"""
Based on the following content and user query, generate 4-6 smart follow-up questions that would help the user explore the topic deeper. 

Content/Context: {context[:1000] if context else query}
User's Last Query/Answer: {query}

Generate diverse recommendations covering these types:
- Follow-up questions to dive deeper
- Related concepts to explore  
- Practical examples and applications
- Comparisons with other topics

Requirements:
- Make questions specific and actionable
- Avoid generic questions like "tell me more"
- Each question should be 8-15 words
- Focus on practical value for learning
- Ensure questions are relevant to the specific content

Generate exactly 5 recommendations, one per line:
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
            
            # Enhanced fallback recommendations based on context
            if "PDF" in query or "document" in query.lower():
                recommendations = [
                    "What are the main conclusions in this document?",
                    "Can you summarize the key findings?", 
                    "What evidence supports these claims?",
                    "How does this relate to current industry practices?",
                    "What are the practical implications of these findings?"
                ]
            elif any(word in query.lower() for word in ["explain", "what", "how"]):
                recommendations = [
                    "Can you provide specific examples of this concept?",
                    "What are the step-by-step procedures involved?",
                    "How would you apply this in a real scenario?",
                    "What are common misconceptions about this topic?",
                    "What tools or resources are needed for implementation?"
                ]
            else:
                recommendations = [
                    "What else can you tell me about this topic?", 
                    "Can you explain this in more detail?",
                    "What are the practical applications of this?",
                    "How does this relate to other concepts?",
                    "Can you give a specific example of this?"
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
