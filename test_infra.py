"""
AIP Platform Infrastructure Connectivity Verification Tests (Refactored)
Validates postgres, redis, and neo4j connectivity utilizing the central configuration and client abstractions.
"""

import os
import sys
import psycopg2
from neo4j import GraphDatabase
import redis

# Ensure workspace root and src/ are in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.join(os.path.abspath(os.path.dirname(__file__)), "src"))

from src.shared.infra.postgres_client import PostgresClient
from src.shared.infra.redis_client import RedisClient
from src.shared.infra.neo4j_client import Neo4jClient

print("POSTGRES")
pg = PostgresClient()
conn = pg.get_connection()
print("CONNECTED")
conn.close()

print("REDIS")
r = RedisClient()
print(r.ping())

print("NEO4J")
n4j = Neo4jClient()
n4j.verify_connectivity()
print("CONNECTED")
n4j.close()

print("BUSINESS DB")

conn=psycopg2.connect(
    host="localhost",
    database="analyticsdb",
    user="analytics",
    password="analytics123",
    port=5433
)

print("CONNECTED")

conn.close()