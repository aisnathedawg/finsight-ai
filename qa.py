from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from dotenv import load_dotenv

load_dotenv()
# Config
PERSIST_DIR = "chroma_db"

# Load embeddings and vector database
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)

# Initialize LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

chat_history = []

print("FinSight AI — Financial Research Assistant")
print("Type 'exit' to quit\n")

while True:
    question = input("You: ").strip()
    if question.lower() == "exit":
        break
    if not question:
        continue

    # Ask for company filter
    company_filter = input("Company to filter by (leave blank for all): ").strip()
    filter_dict = {"company": company_filter} if company_filter else None

    # Retrieve relevant chunks
    docs = vectorstore.similarity_search(question, k=5, filter=filter_dict)
    context = "\n\n".join([doc.page_content for doc in docs])

    messages = [
        SystemMessage(content=f"""You are a financial analyst assistant. 
Answer questions using ONLY the context provided. 
If the answer isn't in the context, say so.

Context:
{context}""")
    ]

    for h in chat_history[-4:]:
        messages.append(h)

    messages.append(HumanMessage(content=question))

    response = llm.invoke(messages)
    answer = response.content

    chat_history.append(HumanMessage(content=question))
    chat_history.append(response)

    print("\n" + "="*50)
    print("ANSWER")
    print("="*50)
    print(answer)

    print("\n" + "="*50)
    print("SOURCE CHUNKS USED")
    print("-"*50)
    for i, doc in enumerate(docs, start=1):
        print(
            f"\nChunk {i}: "
            f"{doc.metadata.get('company')} | "
            f"{doc.metadata.get('year')} | "
            f"{doc.metadata.get('filing_type')}"
        )