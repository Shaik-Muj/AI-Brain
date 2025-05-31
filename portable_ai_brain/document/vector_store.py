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

def query_vector_store(db_path: str, question: str) -> list:
    try:
        db = FAISS.load_local(db_path, embedding_model)
        retriever = db.as_retriever(search_kwargs={"k": 5})  # Get top 5 relevant documents
        relevant_docs = retriever.get_relevant_documents(question)
        
        # Generate 3-5 follow-up question recommendations based on retrieved content
        prompt = f"""
        Based on this query: "{question}" 
        and the following relevant content:
        {[doc.page_content[:200] for doc in relevant_docs]}
        
        Generate 3-5 follow-up questions that would be helpful for exploring this topic further.
        Return ONLY the questions as a list, separated by '|'.
        """
        
        from langchain.chains import LLMChain
        from langchain.prompts import PromptTemplate
        
        template = PromptTemplate(template=prompt, input_variables=[])
        chain = LLMChain(llm=llm, prompt=template)
        result = chain.run({})
        
        # Split recommendations and clean them up
        recommendations = [rec.strip() for rec in result.split('|') if rec.strip()]
        return recommendations[:5]  # Return at most 5 recommendations
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return ["What else can you tell me about this topic?", 
                "Can you explain this in more detail?",
                "What are the practical applications of this?"]
