"""
Generative Script to Build corporate banking SQLite database for AIP.
Generates at least 1,000 rows representing real Corporate Liquidity Management data.
"""

import sqlite3
import random
import os
from datetime import datetime, timedelta

def build_database():
    db_path = os.path.abspath('data/lms_database.db')
    print(f"[SQLite DB Builder] Creating database at: {db_path}")

    # Remove existing database to ensure a clean build
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Create Tables
    cursor.execute("""
    CREATE TABLE corporate_clients (
        client_id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        industry TEXT NOT NULL,
        risk_score REAL NOT NULL,
        credit_rating TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE accounts (
        account_id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        branch TEXT NOT NULL,
        currency TEXT NOT NULL,
        balance REAL NOT NULL,
        account_type TEXT NOT NULL,
        interest_rate REAL NOT NULL,
        FOREIGN KEY (client_id) REFERENCES corporate_clients(client_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE liquidity_sweeps (
        sweep_id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        source_account_id TEXT NOT NULL,
        destination_account_id TEXT NOT NULL,
        sweep_type TEXT NOT NULL,
        threshold_amount REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (client_id) REFERENCES corporate_clients(client_id),
        FOREIGN KEY (source_account_id) REFERENCES accounts(account_id),
        FOREIGN KEY (destination_account_id) REFERENCES accounts(account_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE sweep_executions (
        execution_id TEXT PRIMARY KEY,
        sweep_id TEXT NOT NULL,
        transfer_amount REAL NOT NULL,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (sweep_id) REFERENCES liquidity_sweeps(sweep_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE liquidity_buffers (
        buffer_id TEXT PRIMARY KEY,
        asset_type TEXT NOT NULL,
        amount REAL NOT NULL,
        haircut_percentage REAL NOT NULL,
        yield_rate REAL NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE transactions (
        transaction_id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        amount REAL NOT NULL,
        direction TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(account_id)
    );
    """)

    # 2. Populate Corporate Clients (10 clients)
    clients_data = [
        ("CL-101", "GlobalCorp Logistics", "Logistics & Shipping", 2.3, "AA-"),
        ("CL-102", "Nova Retail Group", "Retail", 3.8, "A+"),
        ("CL-103", "Apex Pharmaceuticals", "Healthcare", 1.8, "AAA"),
        ("CL-104", "Vortex Energy Solutions", "Energy & Utilities", 4.2, "BBB+"),
        ("CL-105", "Summit Heavy Industries", "Manufacturing", 3.1, "A-"),
        ("CL-106", "Horizon Web Systems", "Technology", 2.0, "AA"),
        ("CL-107", "Quantum Venture Labs", "Financial Services", 2.9, "AA-"),
        ("CL-108", "Matrix Media Corp", "Entertainment", 3.5, "A"),
        ("CL-109", "Pioneer Agriculture Co", "Agriculture", 3.9, "A-"),
        ("CL-110", "Stellar AgriFoods", "Food & Beverage", 2.5, "AA-")
    ]
    cursor.executemany("INSERT INTO corporate_clients VALUES (?, ?, ?, ?, ?);", clients_data)

    # 3. Populate Accounts (3 accounts per client = 30 accounts)
    accounts_data = []
    branches = ["Metro Hub", "North Plaza", "South Bay", "West Valley", "East Gateway"]
    currencies = ["USD", "EUR", "GBP"]
    
    for c_id, name, _, _, _ in clients_data:
        # Generate 3 treasury accounts for each corporate client
        for i, curr in enumerate(currencies):
            acc_id = f"ACC-{c_id.split('-')[1]}-{curr}"
            branch = random.choice(branches)
            balance = round(random.uniform(5000000.0, 150000000.0), 2)
            acc_type = "Corporate Current" if i == 0 else ("Yield Earning Deposit" if i == 1 else "Treasury Sweeper")
            rate = 0.5 if i == 0 else (2.75 if i == 1 else 1.25)
            accounts_data.append((acc_id, c_id, branch, curr, balance, acc_type, rate))
            
    cursor.executemany("INSERT INTO accounts VALUES (?, ?, ?, ?, ?, ?, ?);", accounts_data)

    # 4. Populate Liquidity Sweep Instructions (15 setups)
    sweeps_data = []
    for idx in range(15):
        sweep_id = f"SWP-{100 + idx}"
        client_info = clients_data[idx % len(clients_data)]
        c_id = client_info[0]
        
        # Source account: Yield Earning / Sweeper, Destination: Corporate Current (Concentrator)
        src_acc = f"ACC-{c_id.split('-')[1]}-EUR"
        dest_acc = f"ACC-{c_id.split('-')[1]}-USD"
        
        sweep_type = "Zero-Balance" if idx % 2 == 0 else "Target-Balance"
        threshold = 1000000.0 if sweep_type == "Target-Balance" else 0.0
        status = "Active" if idx < 13 else "Suspended"
        sweeps_data.append((sweep_id, c_id, src_acc, dest_acc, sweep_type, threshold, status))
        
    cursor.executemany("INSERT INTO liquidity_sweeps VALUES (?, ?, ?, ?, ?, ?, ?);", sweeps_data)

    # 5. Populate Liquidity Buffers (HQLA categories)
    buffers_data = [
        ("BUF-001", "Level 1 HQLA (Central Bank Reserves)", 450000000.0, 0.0, 3.25),
        ("BUF-002", "Level 1 HQLA (Sovereign Debt Bonds)", 320000000.0, 0.0, 3.85),
        ("BUF-003", "Level 2A HQLA (Covered Bonds)", 150000000.0, 15.0, 4.15),
        ("BUF-004", "Level 2A HQLA (Corporate Bonds AAA-AA)", 120000000.0, 15.0, 4.50),
        ("BUF-005", "Level 2B HQLA (Sovereign Yields Lower)", 85000000.0, 50.0, 4.95),
        ("BUF-006", "Level 2B HQLA (Common Equity Stocks)", 65000000.0, 50.0, 5.20)
    ]
    cursor.executemany("INSERT INTO liquidity_buffers VALUES (?, ?, ?, ?, ?);", buffers_data)

    # 6. Populate transactions (at least 1,000 transaction rows)
    transactions_data = []
    base_date = datetime.now() - timedelta(days=180)
    tx_types = ["Payroll", "Sweep Transfer", "Supplier Settlement", "Tax Settlement", "Treasury Return", "Cash Inflow", "Wire Transfer"]
    
    # Pre-populate sweep executions list to log historic executions
    sweep_executions_data = []
    sweep_count = 0
    
    for i in range(1050):
        tx_id = f"TX-{10000 + i}"
        account_info = random.choice(accounts_data)
        acc_id = account_info[0]
        
        amount = round(random.uniform(50000.0, 8500000.0), 2)
        direction = random.choice(["Inflow", "Outflow"])
        tx_type = random.choice(tx_types)
        
        # Stagger dates backward
        tx_time = base_date + timedelta(minutes=random.randint(1, 250000))
        timestamp_str = tx_time.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        transactions_data.append((tx_id, acc_id, amount, direction, tx_type, timestamp_str))
        
        # If transaction type is Sweep Transfer, log it to sweep executions
        if tx_type == "Sweep Transfer" and sweep_count < 150:
            sw_id = f"SWP-{100 + (sweep_count % 15)}"
            exec_id = f"EXEC-{20000 + sweep_count}"
            sweep_executions_data.append((exec_id, sw_id, amount, timestamp_str, "Succeeded"))
            sweep_count += 1

    cursor.executemany("INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?);", transactions_data)
    cursor.executemany("INSERT INTO sweep_executions VALUES (?, ?, ?, ?, ?);", sweep_executions_data)

    conn.commit()
    
    # 7. Print stats to verify minimum 1,000 rows
    cursor.execute("SELECT COUNT(*) FROM transactions;")
    tx_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM corporate_clients;")
    client_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM accounts;")
    account_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM sweep_executions;")
    exec_count = cursor.fetchone()[0]

    print(f"[SQLite DB Builder] Build completed successfully.")
    print(f" - Clients Table: {client_count} rows")
    print(f" - Accounts Table: {account_count} rows")
    print(f" - Transactions Table: {tx_count} rows (Minimum 1,000 requirement satisfied!)")
    print(f" - Sweep Executions Table: {exec_count} rows")
    
    conn.close()

if __name__ == "__main__":
    build_database()
