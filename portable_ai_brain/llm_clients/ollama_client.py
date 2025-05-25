from llm_clients.base_client import BaseLLMClient
import requests

class OllamaClient(BaseLLMClient):
    def call(self, prompt: str) -> str:
        try:
            response = requests.post("http://localhost:11434/api/generate", json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False
            })
            response.raise_for_status()
            return response.json().get("response", "No response from Ollama")
        except Exception as e:
            return f"Error calling Ollama: {str(e)}"