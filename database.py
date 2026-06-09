import sqlite3

def create_database():
    conn = sqlite3.connect("finsight.db")
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS financials")

    cursor.execute("""
        CREATE TABLE financials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT,
            year INTEGER,
            revenue_bn REAL,
            gross_margin_pct REAL,
            net_income_bn REAL,
            rd_expense_bn REAL,
            eps REAL
        )
    """)

    data = [
        ("Apple", 2025, 416.16, 46.9, 93.74, 34.55, 6.42),
        ("Apple", 2024, 391.04, 46.2, 93.74, 31.37, 6.11),
        ("Apple", 2023, 383.29, 44.1, 97.00, 29.92, 6.13),
        ("NVIDIA", 2025, 130.50, 75.0, 72.88, 10.02, 2.94),
        ("NVIDIA", 2024, 60.90, 72.7, 29.76, 8.68, 1.30),
        ("NVIDIA", 2023, 26.97, 56.9, 4.37, 7.34, 0.17),
        ("Microsoft", 2025, 261.80, 69.4, 88.13, 29.51, 11.80),
        ("Microsoft", 2024, 245.10, 69.8, 88.13, 29.51, 11.45),
        ("Microsoft", 2023, 211.90, 68.9, 72.36, 27.20, 9.72),
    ]

    cursor.executemany("""
        INSERT INTO financials 
        (company, year, revenue_bn, gross_margin_pct, net_income_bn, rd_expense_bn, eps)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, data)

    conn.commit()
    conn.close()
    print("✅ Database created with Apple, NVIDIA, and Microsoft!")

if __name__ == "__main__":
    create_database()