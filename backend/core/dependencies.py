from domain.interfaces.document_store import DocumentStore
from domain.interfaces.chunker import Chunker
from domain.interfaces.embedding_provider import EmbeddingProvider
from domain.interfaces.vector_store import VectorStore

from infrastructure.sqlite_document_store import SQLiteDocumentStore
from services.chunker import RecursiveTextChunker
from services.embedding import GeminiEmbeddingProvider
from infrastructure.chroma_vector_store import ChromaVectorStore

# Singleton instances (for now, in a local MVP)
_document_store = SQLiteDocumentStore()
_chunker = RecursiveTextChunker()
_embedding_provider = GeminiEmbeddingProvider()
_vector_store = ChromaVectorStore()

def get_document_store() -> DocumentStore:
    return _document_store

def get_chunker() -> Chunker:
    return _chunker

def get_embedding_provider() -> EmbeddingProvider:
    return _embedding_provider

def get_vector_store() -> VectorStore:
    return _vector_store
