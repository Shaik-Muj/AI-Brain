import json
from llm_clients.openai_client import OpenAIClient
from llm_clients.ollama_client import OllamaClient
from llm_clients.llama_client import LLaMaClient
from llm_clients.gemma_client import GemmaClient
from utils.context_injector import inject_context

MODEL_CLIENTS = {
    "openai": OpenAIClient(),
    "ollama": OllamaClient(),
    "llama": LLaMaClient(),
    "gemma": GemmaClient()
}

async def route_prompt(data):
    user_prompt = data.get("prompt")
    model = data.get("model", "openai")

    with open("context/user_context.json") as f:
        context = json.load(f)

    full_prompt = inject_context(user_prompt, context)
    client = MODEL_CLIENTS.get(model)

    if not client:
        return {"error": f"Model '{model}' not supported"}

    return {"response": client.call(full_prompt)}
