from llm_clients.base_client import BaseLLMClient
import requests

class GemmaClient(BaseLLMClient):
    def call(self, prompt: str) -> str:
        try:
            response = requests.post("http://localhost:11434/api/generate", json={
                "model": "gemma",
                "prompt": prompt,
                "stream": False
            })
            response.raise_for_status()
            return response.json().get("response", "No response from Gemma")
        except Exception as e:
            return f"Error calling Gemma: {str(e)}"