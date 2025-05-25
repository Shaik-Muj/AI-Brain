# summarization/pdf_summarizer.py


from langchain.chat_models import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os

def summarize_pdf_text(text: str):
    llm = AzureChatOpenAI(
        temperature=0.3,
        openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        openai_api_base=os.getenv("AZURE_OPENAI_ENDPOINT"),
        openai_api_type="azure",
        openai_api_version="2023-05-15",
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    )

    prompt = PromptTemplate(
        input_variables=["document"],
        template="""
        You are a helpful assistant. Summarize the following document in a concise, informative way with clear bullet points:

        {document}
        """
    )

    chain = LLMChain(llm=llm, prompt=prompt)
    return chain.run({"document": text})
