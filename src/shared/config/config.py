"""
Centralized Configuration Module for AIM Intelligence Platform (AIP)
Loads env variables from the root .env file and standardizes all database and path mappings.
"""

import os
from dotenv import load_dotenv

# Find the workspace root .env file
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
env_path = os.path.join(base_dir, '.env')

if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

# PostgreSQL Credentials
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", 5433))
POSTGRES_DB = os.getenv("POSTGRES_DB", "analyticsdb")
POSTGRES_USER = os.getenv("POSTGRES_USER", "analytics")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "analytics123")

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Neo4j Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

# External Storage & Logging Mappings
REPORT_PATH = os.getenv("REPORT_PATH", os.path.join(os.path.dirname(base_dir), "AIP-Infra", "storage", "reports"))
ARTIFACT_PATH = os.getenv("ARTIFACT_PATH", os.path.join(os.path.dirname(base_dir), "AIP-Infra", "storage", "artifacts"))
ARCHIVE_PATH = os.getenv("ARCHIVE_PATH", os.path.join(os.path.dirname(base_dir), "AIP-Infra", "storage", "archives"))
LOG_PATH = os.getenv("LOG_PATH", os.path.join(os.path.dirname(base_dir), "AIP-Infra", "logs"))

# Ensure external paths exist
for path in [REPORT_PATH, ARTIFACT_PATH, ARCHIVE_PATH, LOG_PATH]:
    if path:
        os.makedirs(path, exist_ok=True)
