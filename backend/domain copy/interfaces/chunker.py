from abc import ABC, abstractmethod
from typing import List
from domain.models import Chunk

class Chunker(ABC):
    @abstractmethod
    async def chunk_document(self, document_id: str, text: str) -> List[Chunk]:
        """Splits a document text into smaller chunks."""
        pass
