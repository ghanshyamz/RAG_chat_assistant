import os
import asyncio
import traceback
import logging
from typing import Optional

from domain.interfaces.document_store import DocumentStore
from domain.interfaces.chunker import Chunker
from domain.interfaces.embedding_provider import EmbeddingProvider
from domain.interfaces.vector_store import VectorStore
from services.parsers import get_parser_for_file

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def process_document(
    document_id: str,
    file_path: str,
    document_store: DocumentStore,
    chunker: Chunker,
    embedding_provider: EmbeddingProvider,
    vector_store: VectorStore
) -> None:
    """
    Background task to orchestrate document ingestion:
    parse -> chunk -> embed -> index
    """
    try:
        logger.info(f"[{document_id}] Starting ingestion process for {file_path}")
        
        # 1. Update status to processing
        await document_store.update_document_status(document_id, "processing")
        logger.info(f"[{document_id}] Status updated to 'processing'")
        
        # 2. Parse the document
        logger.info(f"[{document_id}] Parsing document...")
        parser = get_parser_for_file(file_path)
        raw_text = parser.parse(file_path)
        
        if not raw_text.strip():
            raise ValueError(f"No text could be extracted from {file_path}")
            
        logger.info(f"[{document_id}] Successfully parsed document. Extracted {len(raw_text)} characters.")

        # 3. Chunk the text
        logger.info(f"[{document_id}] Chunking document text...")
        chunks = await chunker.chunk_document(document_id, raw_text)
        if not chunks:
            raise ValueError("Document yielded 0 chunks.")
            
        logger.info(f"[{document_id}] Created {len(chunks)} chunks.")

        # 4. Generate Embeddings
        texts_to_embed = [chunk.text for chunk in chunks]
        logger.info(f"[{document_id}] Generating embeddings for {len(chunks)} chunks...")
        embeddings = await embedding_provider.embed_batch(texts_to_embed)
        
        if len(embeddings) != len(chunks):
            raise RuntimeError(f"Expected {len(chunks)} embeddings, got {len(embeddings)}")
            
        logger.info(f"[{document_id}] Successfully generated {len(embeddings)} embeddings.")

        # 5. Store in VectorStore
        logger.info(f"[{document_id}] Storing chunks in vector store...")
        await vector_store.upsert_chunks(chunks, embeddings)

        # 6. Save metadata to DocumentStore
        logger.info(f"[{document_id}] Saving chunk metadata to document store...")
        await document_store.save_chunks(chunks)

        # 7. Update status to indexed
        await document_store.update_document_status(document_id, "indexed")
        logger.info(f"[{document_id}] Ingestion complete! Status updated to 'indexed'")

    except Exception as e:
        logger.error(f"[{document_id}] Error processing document: {e}")
        traceback.print_exc()
        await document_store.update_document_status(document_id, "error")
