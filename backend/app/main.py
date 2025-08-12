from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config

from app.db.database import engine
from app.models import user  # Import models to create tables
from app.routers import auth, mobile_auth, chat  # Add chat import

# Create database tables
user.Base.metadata.create_all(bind=engine)

# Create FastAPI instance
app = FastAPI(
    title="SmartKrishi API",
    description="AI-powered farming assistant API",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API version prefix
API_V1_STR = config("API_V1_STR", default="/api/v1")

# Include routers
app.include_router(auth.router, prefix=f"{API_V1_STR}/auth", tags=["authentication"])
app.include_router(mobile_auth.router, prefix=f"{API_V1_STR}/auth", tags=["mobile-authentication"])
app.include_router(chat.router, prefix=f"{API_V1_STR}/chat", tags=["chat"])  # Add chat router

@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Welcome to SmartKrishi API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
