import hashlib
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter

from domain.interfaces.chunker import Chunker
from domain.models import Chunk

class RecursiveTextChunker(Chunker):
    """
    Implementation of Chunker using LangChain's RecursiveCharacterTextSplitter.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    async def chunk_document(self, document_id: str, text: str) -> List[Chunk]:
        """Splits a document text into smaller chunks."""
        # Split text into strings
        texts = self.splitter.split_text(text)
        
        chunks = []
        for i, chunk_text in enumerate(texts):
            # Create a stable ID using SHA256 of the document_id + chunk_index + text
            hash_input = f"{document_id}_{i}_{chunk_text}".encode("utf-8")
            chunk_id = hashlib.sha256(hash_input).hexdigest()
            
            chunk = Chunk(
                id=chunk_id,
                document_id=document_id,
                text=chunk_text,
                chunk_index=i,
                metadata={}
            )
            chunks.append(chunk)
            
        return chunks
