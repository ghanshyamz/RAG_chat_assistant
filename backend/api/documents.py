import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException

from domain.models import DocumentMetadata
from domain.interfaces.document_store import DocumentStore
from domain.interfaces.chunker import Chunker
from domain.interfaces.embedding_provider import EmbeddingProvider
from domain.interfaces.vector_store import VectorStore
from core.dependencies import (
    get_document_store,
    get_chunker,
    get_embedding_provider,
    get_vector_store
)
from services.ingestion import process_document

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_store: DocumentStore = Depends(get_document_store),
    chunker: Chunker = Depends(get_chunker),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
    vector_store: VectorStore = Depends(get_vector_store)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Generate document ID and construct file path
    document_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{document_id}_{file.filename}")

    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Create metadata in DB
    document = DocumentMetadata(
        id=document_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        status="uploaded"
    )
    await document_store.save_document(document)

    # Dispatch background task for processing
    background_tasks.add_task(
        process_document,
        document_id=document_id,
        file_path=file_path,
        document_store=document_store,
        chunker=chunker,
        embedding_provider=embedding_provider,
        vector_store=vector_store
    )

    return {"message": "Document uploaded successfully and is being processed", "document_id": document_id}

@router.get("")
async def list_documents(
    document_store: DocumentStore = Depends(get_document_store)
):
    documents = await document_store.list_documents()
    return {"documents": documents}
