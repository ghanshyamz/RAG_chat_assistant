import os
from typing import List
import chromadb
from chromadb.config import Settings

from domain.interfaces.vector_store import VectorStore
from domain.models import Chunk

class ChromaVectorStore(VectorStore):
    """
    Implementation of VectorStore using ChromaDB (PersistentClient).
    """
    def __init__(self, persist_directory: str = "chroma_db", collection_name: str = "documents"):
        # Ensure path is relative to backend or absolute
        if not os.path.isabs(persist_directory):
            # Resolve relative to the current working directory, which should be backend during runtime
            # or we can construct it based on this file's path
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            persist_directory = os.path.join(base_dir, persist_directory)
            
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"} # Use cosine similarity
        )

    async def upsert_chunks(self, chunks: List[Chunk], embeddings: List[List[float]]) -> None:
        if not chunks:
            return
            
        ids = [chunk.id for chunk in chunks]
        documents = [chunk.text for chunk in chunks]
        metadatas = []
        for chunk in chunks:
            # We must store document_id to allow deleting by document_id later
            metadata = chunk.metadata.copy() if chunk.metadata else {}
            metadata["document_id"] = chunk.document_id
            metadata["chunk_index"] = chunk.chunk_index
            metadatas.append(metadata)

        # Chroma's add/upsert is synchronous, but we are in an async function
        # For local MVP, running it directly is acceptable. 
        # In a real async heavy app, we'd run this in a ThreadPoolExecutor.
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    async def similarity_search(self, query_embedding: List[float], top_k: int = 5) -> List[Chunk]:
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        chunks = []
        # chromadb returns a dict of lists of lists for multiple queries.
        # We only queried one embedding, so we take the first element (index 0) of each list.
        if results and results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                chunk_id = results['ids'][0][i]
                text = results['documents'][0][i]
                metadata = results['metadatas'][0][i]
                
                chunk = Chunk(
                    id=chunk_id,
                    document_id=metadata.get("document_id", ""),
                    text=text,
                    chunk_index=metadata.get("chunk_index", 0),
                    metadata=metadata
                )
                chunks.append(chunk)
                
        return chunks

    async def delete_document_chunks(self, document_id: str) -> bool:
        try:
            self.collection.delete(
                where={"document_id": document_id}
            )
            return True
        except Exception as e:
            print(f"Error deleting chunks for document {document_id}: {e}")
            return False
