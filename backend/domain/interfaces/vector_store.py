from abc import ABC, abstractmethod
from typing import List
from domain.models import Chunk, Query

class VectorStore(ABC):
    @abstractmethod
    async def upsert_chunks(self, chunks: List[Chunk], embeddings: List[List[float]]) -> None:
        pass

    @abstractmethod
    async def similarity_search(self, query_embedding: List[float], top_k: int = 5) -> List[Chunk]:
        pass

    @abstractmethod
    async def delete_document_chunks(self, document_id: str) -> bool:
        pass
