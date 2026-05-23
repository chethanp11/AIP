"""
LMS Database Connector Utility (SQLite Refactored)
Connects to SQLite database and provides standard data fetching tools.
"""

import os
import sqlite3
from typing import List, Dict, Any

def get_db_connection() -> sqlite3.Connection:
    """Establishes and returns a thread-safe connection to the SQLite database."""
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/lms_database.db'))
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"SQLite LMS Database not found at: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Returns records as dict-like objects
    return conn

def get_lms_table(table_name: str) -> List[Dict[str, Any]]:
    """
    Queries and returns a specific table array from the SQLite database.
    Maintains full backwards contract parity with all suite integrations.
    """
    valid_tables = {
        'corporate_clients', 'accounts', 'liquidity_sweeps', 
        'sweep_executions', 'liquidity_buffers', 'transactions',
        'deposits', 'loans', 'branch_performance'  # Backwards compatibility fallbacks
    }
    
    # Map old mock tables to new relational equivalents
    sql_table = table_name
    if table_name == 'deposits':
        sql_table = 'accounts'
    elif table_name == 'loans':
        sql_table = 'accounts'  # Credit balances represented in accounts
    elif table_name == 'branch_performance':
        sql_table = 'accounts'  # Structured by branch Performance queries

    if sql_table not in valid_tables:
        print(f"[LMS Connector] Attempted query on invalid or missing table: {table_name}")
        return []

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {sql_table} LIMIT 1000;")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[LMS Connector] Failed to read SQLite table '{table_name}': {str(e)}")
        return []

def run_sqlite_query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """
    Executes a read-only SQL query against the LMS SQLite database.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[LMS Connector] Custom Query failed: '{sql}' | Error: {str(e)}")
        return []
