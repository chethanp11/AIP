import psycopg2
from neo4j import GraphDatabase
import redis

print("POSTGRES")

conn = psycopg2.connect(
    host="localhost",
    database="aipdb",
    user="aip",
    password="aip123"
)

print("CONNECTED")

conn.close()

print("REDIS")

r=redis.Redis(
    host="localhost",
    port=6379
)

print(r.ping())

print("NEO4J")

driver=GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j","password123")
)

driver.verify_connectivity()

print("CONNECTED")