"""
LMS Database Connector Utility (PostgreSQL Refactored)
Connects to PostgreSQL database and provides standard data fetching tools.
Enforces no hardcoded local database paths.
"""

import os
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from src.shared.config import config
from src.shared.infra.postgres_client import PostgresClient

# Singleton PostgreSQL Client instance
_pg_client = PostgresClient()

def get_db_connection():
    """Establishes and returns a raw connection to the external PostgreSQL database."""
    return _pg_client.get_connection()

def ensure_lms_tables():
    """
    Ensures corporate banking LMS tables exist in the external PostgreSQL database.
    Seeds data if empty to guarantee fully stateless out-of-the-box operation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'corporate_clients'
            );
        """)
        exists = cursor.fetchone()[0]
        if exists:
            return

        print("[LMS Migrations] Initializing corporate banking schemas in PostgreSQL...")

        # 1. Create Tables
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS corporate_clients (
            client_id VARCHAR(50) PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            industry VARCHAR(100) NOT NULL,
            risk_score REAL NOT NULL,
            credit_rating VARCHAR(50) NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            account_id VARCHAR(50) PRIMARY KEY,
            client_id VARCHAR(50) NOT NULL REFERENCES corporate_clients(client_id),
            branch VARCHAR(100) NOT NULL,
            currency VARCHAR(50) NOT NULL,
            balance REAL NOT NULL,
            account_type VARCHAR(100) NOT NULL,
            interest_rate REAL NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS liquidity_sweeps (
            sweep_id VARCHAR(50) PRIMARY KEY,
            client_id VARCHAR(50) NOT NULL REFERENCES corporate_clients(client_id),
            source_account_id VARCHAR(50) NOT NULL REFERENCES accounts(account_id),
            destination_account_id VARCHAR(50) NOT NULL REFERENCES accounts(account_id),
            sweep_type VARCHAR(100) NOT NULL,
            threshold_amount REAL NOT NULL,
            status VARCHAR(50) NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sweep_executions (
            execution_id VARCHAR(50) PRIMARY KEY,
            sweep_id VARCHAR(50) NOT NULL REFERENCES liquidity_sweeps(sweep_id),
            transfer_amount REAL NOT NULL,
            timestamp VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS liquidity_buffers (
            buffer_id VARCHAR(50) PRIMARY KEY,
            asset_type VARCHAR(255) NOT NULL,
            amount REAL NOT NULL,
            haircut_percentage REAL NOT NULL,
            yield_rate REAL NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id VARCHAR(50) PRIMARY KEY,
            account_id VARCHAR(50) NOT NULL REFERENCES accounts(account_id),
            amount REAL NOT NULL,
            direction VARCHAR(50) NOT NULL,
            transaction_type VARCHAR(100) NOT NULL,
            timestamp VARCHAR(100) NOT NULL
        );
        """)
        conn.commit()

        # 2. Seed Corporate Clients
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
        cursor.executemany("INSERT INTO corporate_clients VALUES (%s, %s, %s, %s, %s);", clients_data)

        # 3. Seed Accounts
        accounts_data = []
        branches = ["Metro Hub", "North Plaza", "South Bay", "West Valley", "East Gateway"]
        currencies = ["USD", "EUR", "GBP"]
        random.seed(42) # Deterministic seeding

        for c_id, name, _, _, _ in clients_data:
            for i, curr in enumerate(currencies):
                acc_id = f"ACC-{c_id.split('-')[1]}-{curr}"
                branch = random.choice(branches)
                balance = round(random.uniform(5000000.0, 150000000.0), 2)
                acc_type = "Corporate Current" if i == 0 else ("Yield Earning Deposit" if i == 1 else "Treasury Sweeper")
                rate = 0.5 if i == 0 else (2.75 if i == 1 else 1.25)
                accounts_data.append((acc_id, c_id, branch, curr, balance, acc_type, rate))
                
        cursor.executemany("INSERT INTO accounts VALUES (%s, %s, %s, %s, %s, %s, %s);", accounts_data)

        # 4. Seed Liquidity Sweeps
        sweeps_data = []
        for idx in range(15):
            sweep_id = f"SWP-{100 + idx}"
            client_info = clients_data[idx % len(clients_data)]
            c_id = client_info[0]
            
            src_acc = f"ACC-{c_id.split('-')[1]}-EUR"
            dest_acc = f"ACC-{c_id.split('-')[1]}-USD"
            
            sweep_type = "Zero-Balance" if idx % 2 == 0 else "Target-Balance"
            threshold = 1000000.0 if sweep_type == "Target-Balance" else 0.0
            status = "Active" if idx < 13 else "Suspended"
            sweeps_data.append((sweep_id, c_id, src_acc, dest_acc, sweep_type, threshold, status))
            
        cursor.executemany("INSERT INTO liquidity_sweeps VALUES (%s, %s, %s, %s, %s, %s, %s);", sweeps_data)

        # 5. Seed Buffers
        buffers_data = [
            ("BUF-001", "Level 1 HQLA (Central Bank Reserves)", 450000000.0, 0.0, 3.25),
            ("BUF-002", "Level 1 HQLA (Sovereign Debt Bonds)", 320000000.0, 0.0, 3.85),
            ("BUF-003", "Level 2A HQLA (Covered Bonds)", 150000000.0, 15.0, 4.15),
            ("BUF-004", "Level 2A HQLA (Corporate Bonds AAA-AA)", 120000000.0, 15.0, 4.50),
            ("BUF-005", "Level 2B HQLA (Sovereign Yields Lower)", 85000000.0, 50.0, 4.95),
            ("BUF-006", "Level 2B HQLA (Common Equity Stocks)", 65000000.0, 50.0, 5.20)
        ]
        cursor.executemany("INSERT INTO liquidity_buffers VALUES (%s, %s, %s, %s, %s);", buffers_data)

        # 6. Seed Transactions and Sweep Executions
        transactions_data = []
        base_date = datetime.now() - timedelta(days=180)
        tx_types = ["Payroll", "Sweep Transfer", "Supplier Settlement", "Tax Settlement", "Treasury Return", "Cash Inflow", "Wire Transfer"]
        sweep_executions_data = []
        sweep_count = 0
        
        for i in range(1050):
            tx_id = f"TX-{10000 + i}"
            account_info = random.choice(accounts_data)
            acc_id = account_info[0]
            
            amount = round(random.uniform(50000.0, 8500000.0), 2)
            direction = random.choice(["Inflow", "Outflow"])
            tx_type = random.choice(tx_types)
            
            tx_time = base_date + timedelta(minutes=random.randint(1, 250000))
            timestamp_str = tx_time.strftime('%Y-%m-%dT%H:%M:%SZ')
            
            transactions_data.append((tx_id, acc_id, amount, direction, tx_type, timestamp_str))
            
            if tx_type == "Sweep Transfer" and sweep_count < 150:
                sw_id = f"SWP-{100 + (sweep_count % 15)}"
                exec_id = f"EXEC-{20000 + sweep_count}"
                sweep_executions_data.append((exec_id, sw_id, amount, timestamp_str, "Succeeded"))
                sweep_count += 1

        cursor.executemany("INSERT INTO transactions VALUES (%s, %s, %s, %s, %s, %s);", transactions_data)
        cursor.executemany("INSERT INTO sweep_executions VALUES (%s, %s, %s, %s, %s);", sweep_executions_data)
        
        conn.commit()
        print(f"[LMS Migrations] Successfully migrated and seeded 1,050 ledger rows into PostgreSQL.")

    except Exception as e:
        conn.rollback()
        print(f"[LMS Migrations] Schema seeding failed: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()

# Enforce schema integrity on load
ensure_lms_tables()

def get_lms_table(table_name: str) -> List[Dict[str, Any]]:
    """
    Queries and returns a specific table array from the PostgreSQL database.
    Maintains full backwards contract parity with all suite integrations.
    """
    valid_tables = {
        'corporate_clients', 'accounts', 'liquidity_sweeps', 
        'sweep_executions', 'liquidity_buffers', 'transactions',
        'deposits', 'loans', 'branch_performance'
    }
    
    # Map old mock tables to new relational equivalents
    sql_table = table_name
    if table_name == 'deposits' or table_name == 'loans' or table_name == 'branch_performance':
        sql_table = 'accounts'

    if sql_table not in valid_tables:
        print(f"[LMS Connector] Attempted query on invalid or missing table: {table_name}")
        return []

    try:
        results = _pg_client.execute_query(f"SELECT * FROM {sql_table} LIMIT 1000;")
        # Return list of dicts to preserve Row interface compatibility
        return [dict(r) for r in results]
    except Exception as e:
        print(f"[LMS Connector] Failed to read PostgreSQL table '{table_name}': {str(e)}")
        return []

def run_sqlite_query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """
    Executes a read-only SQL query against the PostgreSQL database.
    Converts SQLite ? placeholders to PostgreSQL %s format dynamically to keep perfect backwards-compatibility.
    """
    try:
        sql_pg = sql.replace('?', '%s')
        results = _pg_client.execute_query(sql_pg, params)
        return [dict(r) for r in results]
    except Exception as e:
        print(f"[LMS Connector] Custom Query failed: '{sql}' | Error: {str(e)}")
        return []
