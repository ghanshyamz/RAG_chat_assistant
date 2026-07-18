from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.database import init_db
from api.documents import router as documents_router

# Ensure models are imported before creating tables
import infrastructure.orm_models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the SQLite database tables
    await init_db()
    yield
    # Shutdown logic goes here if needed

app = FastAPI(
    title="RAG Chat Assistant API",
    description="Backend for the LangGraph-based RAG Chat Assistant",
    version="0.1.0",
    lifespan=lifespan
)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(documents_router)

@app.get("/")
def root():
    return {"message": "Welcome to the RAG Chat Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
