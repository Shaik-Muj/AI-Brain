from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
from document.vector_store import query_vector_store
from models import get_llm_client

router = APIRouter()

# Google Search API (replace with your API key and endpoint)
GOOGLE_API_KEY = "your_google_api_key"
GOOGLE_SEARCH_ENGINE_ID = "your_search_engine_id"

@router.get("/google-search")
async def google_search(query: str):
    try:
        url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={GOOGLE_API_KEY}&cx={GOOGLE_SEARCH_ENGINE_ID}"
        response = requests.get(url)
        response.raise_for_status()
        results = response.json().get("items", [])
        return [item["title"] + ": " + item["link"] for item in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Search failed: {str(e)}")

@router.post("/rag-search")
async def rag_search(query: str):
    try:
        # Assuming a pre-built FAISS vector store exists
        db_path = "vector_dbs/default.faiss"
        result = query_vector_store(db_path, query)
        return [result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Search failed: {str(e)}")

class ChatbotRequest(BaseModel):
    query: str
    conversation: list[dict]  # Expect a list of messages with role and content

@router.post("/chatbot")
async def chatbot(request: ChatbotRequest):
    try:
        print(f"Received chatbot query: {request.query}")
        print(f"Conversation history: {request.conversation}")
        llm_client = get_llm_client("openai")

        # Combine conversation history into a single prompt
        conversation_context = "\n".join(
            [f"{msg['role'].capitalize()}: {msg['content']}" for msg in request.conversation]
        )
        full_prompt = f"{conversation_context}\nUser: {request.query}\nChatbot:"
        response = llm_client.call(full_prompt)

        print(f"Chatbot response: {response}")
        return {"response": response}
    except Exception as e:
        print(f"Error in chatbot endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chatbot failed: {str(e)}")
