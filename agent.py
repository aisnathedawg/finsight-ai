from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from live_data import get_company_financials
from dotenv import load_dotenv
import json

load_dotenv()

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

chat_history = []

def route_question(question: str) -> str:
    routing_prompt = f"""You are a router. Given a question, decide if it needs:
- "live" : current price, market cap, EPS, PE ratio, analyst ratings, revenue numbers
- "rag"  : strategy, risks, CEO commentary, business segments, qualitative info
- "both" : needs both live data and document context

Reply with ONLY one word: live, rag, or both.

Question: {question}"""

    response = llm.invoke([HumanMessage(content=routing_prompt)])
    return response.content.strip().lower()

def answer_question(question: str, ticker: str = None):
    route = route_question(question)
    print(f"\n[Router → {route.upper()}]")

    context_parts = []

    if route in ["live", "both"] and ticker and ticker.strip():
        data = get_company_financials(ticker)
        live_context = "\n".join([f"{k}: {v}" for k, v in data.items()])
        context_parts.append(f"LIVE MARKET DATA:\n{live_context}")

    if route in ["rag", "both"]:
        docs = vectorstore.similarity_search(question, k=5)
        rag_context = "\n\n".join([doc.page_content for doc in docs])
        context_parts.append(f"DOCUMENT CONTEXT:\n{rag_context}")

    full_context = "\n\n".join(context_parts)

    messages = [
        SystemMessage(content=f"""You are FinSight AI, an intelligent financial research assistant.
Answer the question using the context provided.
Be specific, cite numbers where available.

Context:
{full_context}""")
    ]

    for h in chat_history[-4:]:
        messages.append(h)

    messages.append(HumanMessage(content=question))
    response = llm.invoke(messages)

    chat_history.append(HumanMessage(content=question))
    chat_history.append(response)

    return response.content

if __name__ == "__main__":
    print("FinSight AI — Intelligent Financial Research Assistant")
    print("Type 'exit' to quit\n")

    while True:
        question = input("You: ").strip()
        if question.lower() == "exit":
            break
        if not question:
            continue

        ticker = input("Ticker (e.g. AAPL, leave blank to skip): ").strip().upper() or None
        answer = answer_question(question, ticker)

        print(f"\n{'='*50}")
        print("ANSWER")
        print('='*50)
        print(answer)
        print()