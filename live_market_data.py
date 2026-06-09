import sqlite3
from live_data import get_company_financials

companies = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "GOOGL",
    "META",
    "TSLA",
    "AMD",
    "NFLX",
    "ORCL"
]

conn = sqlite3.connect("finsight.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS live_market_data (
    ticker TEXT,
    company TEXT,
    sector TEXT,
    current_price REAL,
    market_cap_bn REAL,
    revenue_bn REAL,
    gross_margin_pct REAL,
    net_margin_pct REAL,
    eps REAL,
    pe_ratio REAL,
    recommendation TEXT
)
""")

cursor.execute("DELETE FROM live_market_data")

for ticker in companies:
    data = get_company_financials(ticker)

    if "error" not in data:
        cursor.execute("""
        INSERT INTO live_market_data VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["ticker"],
            data["company"],
            data["sector"],
            data["current_price"],
            data["market_cap_bn"],
            data["revenue_bn"],
            data["gross_margin_pct"],
            data["net_margin_pct"],
            data["eps"],
            data["pe_ratio"],
            data["recommendation"]
        ))

conn.commit()
conn.close()

print("Live market data updated successfully!")