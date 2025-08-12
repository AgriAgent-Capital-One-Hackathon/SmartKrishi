import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config

# Get database URL from environment variables with fallback
DATABASE_URL = config(
    'DATABASE_URL',
    default='postgresql://smartkrishi_user:smartkrishi_password@localhost:5432/smartkrishi_db'
)

# Create engine with connection pooling for production
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    pool_size=5,         # Connection pool size
    max_overflow=10,     # Maximum overflow connections
    echo=False           # Set to True for development debugging
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
