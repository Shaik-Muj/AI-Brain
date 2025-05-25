import os
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain.chains.question_answering import load_qa_chain
from dotenv import load_dotenv

# Load from .env
load_dotenv()

# Set up embedding model
embedding_model = AzureOpenAIEmbeddings(
    model="text-embedding-ada-002",
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_deployment=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"),
    chunk_size=1000
)

# Set up chat model
llm = AzureChatOpenAI(
    model="gpt-35-turbo",
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_deployment=os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"),
    temperature=0,
)

def create_or_load_vector_store(chunks: list, db_path: str):
    docs = [Document(page_content=chunk) for chunk in chunks]
    db = FAISS.from_documents(docs, embedding_model)
    db.save_local(db_path)

def query_vector_store(db_path: str, question: str) -> str:
    db = FAISS.load_local(db_path, embedding_model)
    retriever = db.as_retriever()
    relevant_docs = retriever.get_relevant_documents(question)

    chain = load_qa_chain(llm, chain_type="stuff")
    result = chain.run(input_documents=relevant_docs, question=question)
    return result
