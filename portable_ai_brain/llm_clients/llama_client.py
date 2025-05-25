from llm_clients.base_client import BaseLLMClient
import requests

class LLaMaClient(BaseLLMClient):
    def call(self, prompt: str) -> str:
        try:
            response = requests.post("http://localhost:11434/api/generate", json={
                "model": "llama2",
                "prompt": prompt,
                "stream": False
            })
            response.raise_for_status()
            return response.json().get("response", "No response from LLaMa")
        except Exception as e:
            return f"Error calling LLaMa: {str(e)}"