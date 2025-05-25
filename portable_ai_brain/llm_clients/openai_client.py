from openai import AzureOpenAI
import os
from dotenv import load_dotenv
from llm_clients.base_client import BaseLLMClient

# Load environment variables from .env file
load_dotenv()

AZURE_DEPLOYMENT_NAME = "gpt-35-turbo"  # Replace with your actual deployment name

def get_client():
    """Create and return an Azure OpenAI client."""
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    if not api_key:
        raise ValueError("AZURE_OPENAI_API_KEY environment variable is not set")

    return AzureOpenAI(
        api_key=api_key,
        api_version="2023-07-01-preview",
        azure_endpoint="https://my-portable-brain.openai.azure.com"
    )

class OpenAIClient(BaseLLMClient):
    def call(self, prompt: str) -> str:
        try:
            client = get_client()
            response = client.chat.completions.create(
                model=AZURE_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that responds using the user's personal context."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error calling OpenAI API: {str(e)}"