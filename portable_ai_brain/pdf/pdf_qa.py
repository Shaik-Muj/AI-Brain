# pdf/pdf_qa.py

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.chat_models import AzureChatOpenAI
import os

def build_pdf_qa_chain(text: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.create_documents([text])

    embeddings = OpenAIEmbeddings(
        openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        openai_api_base=os.getenv("AZURE_OPENAI_ENDPOINT"),
        openai_api_type="azure",
        openai_api_version="2023-05-15",
        deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    )

    vectordb = FAISS.from_documents(chunks, embeddings)
    retriever = vectordb.as_retriever()

    llm = AzureChatOpenAI(
        temperature=0,
        openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        openai_api_base=os.getenv("AZURE_OPENAI_ENDPOINT"),
        openai_api_type="azure",
        openai_api_version="2023-05-15",
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    )

    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
