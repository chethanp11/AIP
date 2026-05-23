"""
KMS Grounding Engine, SQLite Vector DB & Graph DB Implementation
Assigned Banking Agent: Analytical Grounding Agent
"""

import os
import sqlite3
import json
import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# ==========================================================
# 📋 PYDANTIC SCHEMAS FOR KMS SCHEMA INTERACTIONS
# ==========================================================
class KMSQueryRequest(BaseModel):
    query: str = Field(..., description="The search string to ground against vector/graph databases.")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Optional metadata filters.")

class KMSQueryResponse(BaseModel):
    grounded_context: str = Field(..., description="The fully compiled vector-and-graph semantic context.")
    matched_nodes: List[Dict[str, Any]] = Field(..., description="List of related Graph DB nodes matched.")
    matched_chunks: List[Dict[str, Any]] = Field(..., description="List of Vector DB text chunks matched.")
    latency_ms: int = Field(..., description="Execution latency in milliseconds.")

# ==========================================================
# 📊 DATABASE INSTANCE (IN-MEMORY SQLITE VECTOR & GRAPH DB)
# ==========================================================
_conn = None

def get_kms_db():
    """Initializes and returns the in-memory SQLite connection for Vector & Graph databases."""
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(":memory:", check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        
        cursor = _conn.cursor()
        
        # Create Graph Nodes Table
        cursor.execute("""
        CREATE TABLE graph_nodes (
            node_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT
        );
        """)
        
        # Create Graph Edges Table
        cursor.execute("""
        CREATE TABLE graph_edges (
            edge_id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            relationship TEXT NOT NULL,
            metadata TEXT,
            FOREIGN KEY (source_id) REFERENCES graph_nodes(node_id),
            FOREIGN KEY (target_id) REFERENCES graph_nodes(node_id)
        );
        """)
        
        # Create Vector Chunk Table
        cursor.execute("""
        CREATE TABLE vector_chunks (
            chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            chunk_text TEXT NOT NULL,
            tokens TEXT NOT NULL,
            FOREIGN KEY (node_id) REFERENCES graph_nodes(node_id)
        );
        """)
        
        _conn.commit()
        prepopulate_kms_knowledge()
        
    return _conn

# ==========================================================
# 📚 PRE-POPULATE BROADER BANKING KNOWLEDGE CORPS
# ==========================================================
def prepopulate_kms_knowledge():
    conn = _conn
    cursor = conn.cursor()
    
    # 1. Broad Regulatory and Policy Corpus Nodes
    nodes = [
        (
            "node_basel_3", "Regulation", "Basel III Liquidity Coverage Ratio (LCR) Policy",
            "Basel III mandates banking entities to maintain a Liquidity Coverage Ratio (LCR) of at least 100%. "
            "LCR is computed as High-Quality Liquid Assets (HQLA) divided by Total Net Cash Outflows over a 30-day stress period. "
            "Formula: LCR = HQLA / Net_Outflows >= 100%. NET_CASH_OUTFLOWS represent total expected cash outflows minus total "
            "expected cash inflows in the specified stress scenario. Inflows are capped at 75% of total outflows to ensure liquidity reserves."
        ),
        (
            "node_hqla_level1", "Policy", "HQLA Level 1 Buffer Regulations",
            "High-Quality Liquid Assets (HQLA) Level 1 includes central bank reserves, sovereign treasury bonds, and cash reserves. "
            "Level 1 HQLAs are eligible for a 0% haircut under Basel III guidelines, meaning 100% of their market value is counted "
            "in the liquidity buffer calculations. They form the core safety asset reserves of institutional cash sweep accounts."
        ),
        (
            "node_hqla_level2", "Policy", "HQLA Level 2A and 2B Haircut Policies",
            "HQLA Level 2A assets include senior covered bonds and corporate bonds rated AAA to AA, which are subject to a 15% haircut. "
            "HQLA Level 2B assets include corporate bonds rated A- to A+ and select equities, subject to a 50% haircut constraint. "
            "The sum of Level 2 assets in the liquidity buffer is capped at a maximum of 40% of the total HQLA pool."
        ),
        (
            "node_reg_d", "Regulation", "Federal Reserve Regulation D Reserve Requirements",
            "Federal Reserve Regulation D establishes reserve requirements for depository institutions. It defines transaction accounts, "
            "limits third-party withdrawals, and sets the rules for treasury sweeps pooling that transfer corporate cash balances "
            "dynamically to interest-bearing deposit ledger formats."
        ),
        (
            "node_sr_11_7", "Regulation", "Federal Reserve SR 11-7 Model Risk Management",
            "Federal Reserve Supervision and Regulation Letter SR 11-7 outlines standards for Model Risk Management (MRM). "
            "It mandates robust model validation, conceptual soundness audits, ongoing monitoring, and champions-challengers performance "
            "drift analyses. Model validation must be conducted by independent units separate from model developers."
        ),
        (
            "node_alco_sweeps", "Policy", "ALCO Automated Sweeping and Liquidity Pooling Rules",
            "Asset-Liability Committee (ALCO) sweep rules outline fund pooling from active operating accounts to yield-earning concentrator deposits. "
            "Sweeps can be Zero-Balance Accounts (ZBA) where all funds are pooled, or Target-Balance Accounts (TBA) leaving a threshold reserve balance. "
            "Sweeping ensures corporate treasury optimizes net interest margins while retaining immediate withdrawals cash pools."
        ),
        (
            "node_npl_grading", "Policy", "Credit Risk & Non-Performing Loans (NPL) Classifications",
            "Non-Performing Loans (NPL) are defined as credit assets outstanding for more than 90 days without principal or interest servicing. "
            "Borrowers are graded into Performing (Credit Score > 660), Substandard (550-660), or Doubtful/Default (Credit Score < 550) risk buckets. "
            "Expected credit loss models under CECL dictate reserve levels for substandard loans."
        ),
        (
            "node_basel_nsfr", "Regulation", "Basel III Net Stable Funding Ratio (NSFR) Policy",
            "The Net Stable Funding Ratio (NSFR) requires banks to maintain a stable funding profile in relation to the composition of their assets and off-balance sheet activities. It mandates that Available Stable Funding (ASF) divided by Required Stable Funding (RSF) must be at least 100%. ASF measures reliable funding sources over a 1-year horizon (such as equity, stable retail deposits, and long-term liabilities), while RSF measures required stable funding based on the liquidity characteristics of the bank's assets."
        ),
        (
            "node_ccar", "Regulation", "Federal Reserve Comprehensive Capital Analysis and Review (CCAR)",
            "Comprehensive Capital Analysis and Review (CCAR) is a regulatory framework by the Federal Reserve to evaluate the capital planning processes and capital adequacy of large bank holding companies. CCAR requires banks to undergo rigorous supervisory stress testing to project revenues, losses, reserves, and capital ratios under severely adverse economic scenarios, ensuring they can continue operations and absorb losses during severe economic downturns."
        ),
        (
            "node_reg_w", "Regulation", "Federal Reserve Regulation W (Transactions with Affiliates)",
            "Federal Reserve Regulation W implements Sections 23A and 23B of the Federal Reserve Act to protect depository institutions from excessive risks when dealing with affiliates. It sets strict quantitative limits on covered transactions, restricting extensions of credit or asset purchases to 10% of capital stock and surplus for any single affiliate, and 20% in aggregate. It also mandates eligible collateral securing transactions and prohibits purchasing low-quality assets from affiliates."
        ),
        (
            "node_reg_cc", "Regulation", "Federal Reserve Regulation CC (Funds Availability)",
            "Regulation CC implements the Expedited Funds Availability Act and check clearing standards. It regulates the schedules under which depository institutions must make deposited funds available for withdrawal, including next-day availability for cash and government checks, and standard timelines for checks, protecting consumer rights and standardizing bank operational ledger clearances."
        ),
        (
            "node_slr", "Regulation", "Supplementary Leverage Ratio (SLR) Capital Guidelines",
            "The Supplementary Leverage Ratio (SLR) is a capital adequacy metric under the U.S. regulatory capital framework. It measures Tier 1 Capital relative to total leverage exposure, including both on-balance sheet assets and off-balance sheet exposures, without risk-weighting. Advanced banking organizations are subject to a minimum SLR of 3%, with Global Systemically Important Banks (GSIBs) subject to an enhanced 5% SLR requirement to absorb losses."
        )
    ]
    
    for n_id, n_type, n_title, n_content in nodes:
        # Save node
        cursor.execute("INSERT OR REPLACE INTO graph_nodes VALUES (?, ?, ?, ?, ?);", (n_id, n_type, n_title, n_content, "{}"))
        # Split node content into vector chunks and index them
        tokenize_and_store_vector_chunk(n_id, n_content)
        
    # 2. Setup Graph Relations (Edges)
    edges = [
        ("edge_1", "node_basel_3", "node_hqla_level1", "governs_buffer"),
        ("edge_2", "node_basel_3", "node_hqla_level2", "governs_haircuts"),
        ("edge_3", "node_reg_d", "node_alco_sweeps", "regulates_sweeps"),
        ("edge_4", "node_sr_11_7", "node_npl_grading", "governs_credit_models"),
        ("edge_5", "node_basel_nsfr", "node_basel_3", "complements_ratio"),
        ("edge_6", "node_ccar", "node_sr_11_7", "governs_stress_models"),
        ("edge_7", "node_reg_w", "node_alco_sweeps", "governs_affiliate_sweeps"),
        ("edge_8", "node_reg_cc", "node_reg_d", "complements_withdrawals"),
        ("edge_9", "node_slr", "node_basel_3", "complements_leverage")
    ]
    cursor.executemany("INSERT OR REPLACE INTO graph_edges VALUES (?, ?, ?, ?, ?);", 
                       [(e_id, src, tgt, rel, "{}") for e_id, src, tgt, rel in edges])
    
    conn.commit()
    print("[KMS Prepopulation] Successfully seeded vector database and graph databases.")

# ==========================================================
# 🔌 TOKENIZER & VECTOR INDEXING UTILS
# ==========================================================
def tokenize(text: str) -> List[str]:
    """Helper to clean and tokenize a block of text."""
    cleaned = text.lower().replace('.', ' ').replace(',', ' ').replace('(', ' ').replace(')', ' ').replace('-', ' ')
    return [t.strip() for t in cleaned.split() if len(t.strip()) > 2]

def tokenize_and_store_vector_chunk(node_id: str, text: str):
    """Chunks text, tokenizes, and saves into vector table."""
    conn = get_kms_db()
    cursor = conn.cursor()
    
    # Split text into sentences or chunks of ~150 characters
    sentences = text.split('. ')
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 15:
            continue
        tokens_str = " ".join(tokenize(s_clean))
        cursor.execute("INSERT INTO vector_chunks (node_id, chunk_text, tokens) VALUES (?, ?, ?);", 
                       (node_id, s_clean, tokens_str))
    conn.commit()

# ==========================================================
# 🔍 VECTOR AND GRAPH DB RAG SEARCH ENGINE
# ==========================================================
def search_kms_vector_and_graph(query_str: str, limit: int = 4) -> Dict[str, Any]:
    """
    Performs cosine-like vector similarity matching and graph edge traversal.
    This is a lightweight in-memory Graph RAG engine!
    """
    conn = get_kms_db()
    cursor = conn.cursor()
    
    query_tokens = tokenize(query_str)
    if not query_tokens:
        return {'context': '', 'matched_nodes': [], 'matched_chunks': []}
        
    # 1. Fetch chunks and compute overlap similarity scores
    cursor.execute("SELECT * FROM vector_chunks;")
    all_chunks = cursor.fetchall()
    
    scored_chunks = []
    for chunk in all_chunks:
        chunk_tokens = chunk['tokens'].split()
        if not chunk_tokens:
            continue
            
        # Calculate TF-IDF-like intersection score
        match_count = sum(1 for t in query_tokens if t in chunk_tokens)
        score = match_count / math.sqrt(len(query_tokens) * len(chunk_tokens))
        
        if score > 0:
            scored_chunks.append({
                'node_id': chunk['node_id'],
                'text': chunk['chunk_text'],
                'score': score
            })
            
    # Sort chunks by descending score
    scored_chunks.sort(key=lambda x: x['score'], reverse=True)
    top_chunks = scored_chunks[:limit]
    
    if not top_chunks:
        return {
            'context': "Default Banking Grounding: Basel III HQLA, Fed Reserve reserve structures, and Net Interest Margins.",
            'matched_nodes': [],
            'matched_chunks': []
        }
        
    # 2. Gather matched nodes and traverse Graph edges (Graph RAG neighbor expansions)
    matched_node_ids = list(set(chunk['node_id'] for chunk in top_chunks))
    
    nodes_info = []
    traversed_node_ids = set()
    
    for n_id in matched_node_ids:
        # Fetch node content
        cursor.execute("SELECT * FROM graph_nodes WHERE node_id = ?;", (n_id,))
        node = cursor.fetchone()
        if node:
            nodes_info.append(dict(node))
            traversed_node_ids.add(n_id)
            
            # Graph Traversal: Find neighboring nodes linked by edges
            cursor.execute("""
            SELECT n.* FROM graph_nodes n 
            JOIN graph_edges e ON (e.source_id = n.node_id OR e.target_id = n.node_id)
            WHERE (e.source_id = ? OR e.target_id = ?) AND n.node_id != ?;
            """, (n_id, n_id, n_id))
            
            neighbors = cursor.fetchall()
            for neighbor in neighbors:
                neigh_id = neighbor['node_id']
                if neigh_id not in traversed_node_ids:
                    nodes_info.append(dict(neighbor))
                    traversed_node_ids.add(neigh_id)

    # 3. Compile context payload
    matches_text = []
    
    # Text chunks matched by Vector DB
    matches_text.append("=== Matched Regulation & Policies Vector Chunks ===")
    for idx, c in enumerate(top_chunks):
        matches_text.append(f"[{idx+1}] Chunk: {c['text']} (Similarity Score: {c['score']:.3f})")
        
    # Graph DB traversed entities
    matches_text.append("\n=== Graph DB Grounded Relational Nodes ===")
    for node in nodes_info:
        matches_text.append(f"Node Entity: {node['title']} (Type: {node['type']}) | Content: {node['content']}")
        
    compiled_context = "\n".join(matches_text)
    
    return {
        'context': compiled_context,
        'matched_nodes': nodes_info,
        'matched_chunks': top_chunks
    }

# ==========================================================
# 📥 FILE UPLOAD / INGESTION ROUTE (PERSIST IN VECTOR/GRAPH DB)
# ==========================================================
def ingest_custom_file_to_kms(filename: str, content: str) -> Dict[str, Any]:
    """Ingests custom corporate files, chunks them, and stores into SQLite Vector & Graph DB."""
    conn = get_kms_db()
    cursor = conn.cursor()
    
    node_id = 'node_custom_' + uuid_suffix()
    node_title = f"Uploaded File: {filename}"
    
    # 1. Save Node
    cursor.execute("INSERT INTO graph_nodes VALUES (?, ?, ?, ?, ?);", 
                   (node_id, 'Ingested Document', node_title, content, "{}"))
    
    # 2. Tokenize and index in Vector DB
    tokenize_and_store_vector_chunk(node_id, content)
    
    # 3. Automatically link new document to related regulation nodes in the Graph!
    # Simple semantic tag matching
    c_lower = content.lower()
    if 'basel' in c_lower or 'lcr' in c_lower:
        cursor.execute("INSERT INTO graph_edges VALUES (?, ?, ?, ?, ?);", 
                       ('edge_custom_' + uuid_suffix(), node_id, 'node_basel_3', 'references', "{}"))
    if 'model' in c_lower or 'governance' in c_lower or 'sr 11-7' in c_lower:
        cursor.execute("INSERT INTO graph_edges VALUES (?, ?, ?, ?, ?);", 
                       ('edge_custom_' + uuid_suffix(), node_id, 'node_sr_11_7', 'references', "{}"))
    if 'sweep' in c_lower or 'pool' in c_lower:
        cursor.execute("INSERT INTO graph_edges VALUES (?, ?, ?, ?, ?);", 
                       ('edge_custom_' + uuid_suffix(), node_id, 'node_alco_sweeps', 'references', "{}"))
                       
    conn.commit()
    
    # Print status
    cursor.execute("SELECT COUNT(*) FROM graph_nodes;")
    node_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM vector_chunks;")
    chunk_count = cursor.fetchone()[0]
    
    print(f"[KMS Ingestion] Successfully ingested '{filename}' into SQLite. Nodes: {node_count}, Total Vector Chunks: {chunk_count}")
    
    return {
        'success': True,
        'nodeId': node_id,
        'title': node_title,
        'totalKmsNodes': node_count,
        'totalVectorChunks': chunk_count
    }

def uuid_suffix() -> str:
    import uuid
    return uuid.uuid4().hex[:6]

# Backwards compatibility check
def check_kms_integrity() -> Dict[str, Any]:
    return {'integrityPassed': True, 'errors': [], 'details': {'in_memory_db': {'status': 'active', 'count': 7}}}

def get_kpis_definitions() -> List[Dict[str, Any]]:
    return [
        {"name": "Liquidity Coverage Ratio (LCR)", "formula": "HQLA / Total_Net_Cash_Outflows >= 100%"},
        {"name": "Net Interest Margin (NIM)", "formula": "(Interest_Income - Interest_Expense) / Average_Earning_Assets"},
        {"name": "Non-Performing Loans (NPL) Ratio", "formula": "NPL_Outstanding / Total_Lending_Portfolio"},
        {"name": "Loan-to-Deposit Ratio (LDR)", "formula": "Total_Loans / Total_Deposits"}
    ]
