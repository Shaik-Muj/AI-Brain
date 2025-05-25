import requests

API_URL = "http://localhost:8000/prompt"

def test_prompt(prompt: str, model: str):
    response = requests.post(API_URL, json={
        "prompt": prompt,
        "model": model
    })
    print(f"\n--- {model.upper()} RESPONSE ---")
    print(response.json()["response"])

if __name__ == "__main__":
    prompt = "What are the benefits of using retrieval-augmented generation in LLM systems?"

    for model in ["openai", "ollama", "llama", "gemma"]:
        test_prompt(prompt, model)
