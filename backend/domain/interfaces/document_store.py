from abc import ABC, abstractmethod
from typing import List, Optional
from domain.models import DocumentMetadata, Chunk

class DocumentStore(ABC):
    @abstractmethod
    async def save_document(self, document: DocumentMetadata) -> DocumentMetadata:
        pass

    @abstractmethod
    async def get_document(self, document_id: str) -> Optional[DocumentMetadata]:
        pass

    @abstractmethod
    async def list_documents(self) -> List[DocumentMetadata]:
        pass

    @abstractmethod
    async def delete_document(self, document_id: str) -> bool:
        pass
    
    @abstractmethod
    async def update_document_status(self, document_id: str, status: str) -> bool:
        pass

    @abstractmethod
    async def save_chunks(self, chunks: List[Chunk]) -> None:
        pass

    @abstractmethod
    async def get_chunks_for_document(self, document_id: str) -> List[Chunk]:
        pass
