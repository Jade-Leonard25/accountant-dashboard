import os
from typing import Generator, Any
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session

# Store DB next to the executable / app data dir
DB_PATH = os.environ.get("ACCOUNTING_DB", "accounting.db")

# check_same_thread=False is REQUIRED for FastAPI because Uvicorn 
# serves requests in separate threads.
engine: Engine = create_engine(
    f"sqlite:///{DB_PATH}", 
    connect_args={"check_same_thread": False}
)

# --- SQLite specific tweaks ---
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    # 1. Enable Foreign Keys (SQLite ignores them by default!)
    cursor.execute("PRAGMA foreign_keys=ON")
    # 2. Enable WAL mode for better concurrent read/writes (prevents UI lockups)
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

SessionLocal: sessionmaker[Session] = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, Any, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
