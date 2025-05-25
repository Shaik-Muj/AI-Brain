from llm_clients.openai_client import OpenAIClient
from llm_clients.ollama_client import OllamaClient
from llm_clients.gemma_client import GemmaClient
from llm_clients.llama_client import LLaMaClient

MODEL_CLIENTS = {
    "openai": OpenAIClient(),
    "ollama": OllamaClient(),
    "gemma": GemmaClient(),
    "llama": LLaMaClient(),
}

def get_llm_client(model_name: str):
    """
    Get the LLM client corresponding to the given model name.

    Args:
        model_name (str): The name of the model (e.g., 'openai', 'ollama').

    Returns:
        BaseLLMClient: An instance of the corresponding LLM client.

    Raises:
        ValueError: If the model name is not supported.
    """
    try:
        return MODEL_CLIENTS[model_name]
    except KeyError:
        raise ValueError(f"Unsupported model '{model_name}'. Available models: {list(MODEL_CLIENTS.keys())}")
