from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import answer_question, route_question
from live_data import get_company_financials

app = FastAPI(title="FinSight AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    ticker: str = ""

@app.get("/")
def root():
    return {"message": "FinSight AI is running"}

@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    return get_company_financials(ticker)

@app.post("/ask")
def ask(req: QuestionRequest):
    ticker = req.ticker.strip() if req.ticker else None
    route = route_question(req.question)
    answer = answer_question(req.question, ticker)
    return {
        "question": req.question,
        "ticker": ticker,
        "route": route,
        "answer": answer
    }