import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "database/smartsurge.db")

def get_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            rows INTEGER,
            columns INTEGER,
            upload_time TEXT,
            quality_score REAL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_id INTEGER,
            stage TEXT,
            status TEXT,
            logs TEXT,
            created_at TEXT,
            FOREIGN KEY (dataset_id) REFERENCES datasets(id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS experiments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            model_type TEXT,
            mae REAL,
            rmse REAL,
            r2 REAL,
            training_time REAL,
            hyperparameters TEXT,
            feature_list TEXT,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_registry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_id INTEGER,
            version TEXT,
            status TEXT,
            model_path TEXT,
            promoted_at TEXT,
            notes TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_version TEXT,
            input_features TEXT,
            predicted_surge REAL,
            demand_level TEXT,
            timestamp TEXT
        )
    """)


    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drift_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feature_name TEXT,
            ks_statistic REAL,
            p_value REAL,
            drift_severity TEXT,
            checked_at TEXT
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully")