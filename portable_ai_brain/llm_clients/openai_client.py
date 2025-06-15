from openai import AzureOpenAI
import os
from dotenv import load_dotenv
from llm_clients.base_client import BaseLLMClient

# Load environment variables from .env file
load_dotenv()

def get_client():
    """Create and return an Azure OpenAI client."""
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2023-07-01-preview")
    
    if not api_key:
        raise ValueError("AZURE_OPENAI_API_KEY environment variable is not set")
    if not endpoint:
        endpoint = "https://my-portable-brain.openai.azure.com"

    return AzureOpenAI(
        api_key=api_key,
        api_version=api_version,
        azure_endpoint=endpoint
    )

class OpenAIClient(BaseLLMClient):
    def call(self, prompt: str) -> str:
        try:
            client = get_client()
            deployment_name = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME", "gpt-35-turbo")
            
            print(f"Making OpenAI API call with deployment: {deployment_name}")
            response = client.chat.completions.create(
                model=deployment_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that responds using the user's personal context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            import traceback
            print(f"Error calling OpenAI API: {str(e)}")
            print(traceback.format_exc())
            return f"Error calling OpenAI API: {str(e)}"