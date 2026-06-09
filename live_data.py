import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

def get_company_financials(ticker: str) -> dict:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        # Get revenue from income statement if info returns 0
        revenue = info.get("totalRevenue", 0)
        if not revenue or revenue == 0:
            try:
                financials = stock.financials
                if not financials.empty:
                    revenue = financials.loc["Total Revenue"].iloc[0]
            except:
                revenue = 0

        data = {
            "ticker": ticker.upper(),
            "company": info.get("longName", "N/A"),
            "sector": info.get("sector", "N/A"),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice", "N/A"),
            "market_cap_bn": round(info.get("marketCap", 0) / 1e9, 2),
            "revenue_bn": round(revenue / 1e9, 2) if revenue else "N/A",
            "gross_margin_pct": round(info.get("grossMargins", 0) * 100, 2),
            "net_margin_pct": round(info.get("netMargins", 0) * 100, 2),
            "eps": info.get("trailingEps", "N/A"),
            "pe_ratio": info.get("trailingPE", "N/A"),
            "52w_high": info.get("fiftyTwoWeekHigh", "N/A"),
            "52w_low": info.get("fiftyTwoWeekLow", "N/A"),
            "analyst_target": info.get("targetMeanPrice", "N/A"),
            "recommendation": info.get("recommendationKey", "N/A"),
        }

        return data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    result = get_company_financials("AAPL")
    for k, v in result.items():
        print(f"{k}: {v}")