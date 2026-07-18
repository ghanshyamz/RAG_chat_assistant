from typing import List, Optional
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from domain.interfaces import DocumentStore
from domain.models import DocumentMetadata, Chunk
from infrastructure.orm_models import ORMDocument, ORMDocumentChunk
from infrastructure.database import AsyncSessionLocal

class SQLiteDocumentStore(DocumentStore):
    async def save_document(self, document: DocumentMetadata) -> DocumentMetadata:
        async with AsyncSessionLocal() as session:
            db_doc = ORMDocument(
                id=document.id,
                filename=document.filename,
                content_type=document.content_type,
                created_at=document.created_at,
                status=document.status
            )
            session.add(db_doc)
            await session.commit()
            return document

    async def get_document(self, document_id: str) -> Optional[DocumentMetadata]:
        async with AsyncSessionLocal() as session:
            stmt = select(ORMDocument).where(ORMDocument.id == document_id)
            result = await session.execute(stmt)
            db_doc = result.scalar_one_or_none()
            
            if db_doc:
                return DocumentMetadata(
                    id=db_doc.id,
                    filename=db_doc.filename,
                    content_type=db_doc.content_type,
                    created_at=db_doc.created_at,
                    status=db_doc.status
                )
            return None

    async def list_documents(self) -> List[DocumentMetadata]:
        async with AsyncSessionLocal() as session:
            stmt = select(ORMDocument)
            result = await session.execute(stmt)
            db_docs = result.scalars().all()
            
            return [
                DocumentMetadata(
                    id=db_doc.id,
                    filename=db_doc.filename,
                    content_type=db_doc.content_type,
                    created_at=db_doc.created_at,
                    status=db_doc.status
                )
                for db_doc in db_docs
            ]

    async def delete_document(self, document_id: str) -> bool:
        async with AsyncSessionLocal() as session:
            stmt = delete(ORMDocument).where(ORMDocument.id == document_id)
            result = await session.execute(stmt)
            await session.commit()
            return result.rowcount > 0

    async def update_document_status(self, document_id: str, status: str) -> bool:
        async with AsyncSessionLocal() as session:
            stmt = update(ORMDocument).where(ORMDocument.id == document_id).values(status=status)
            result = await session.execute(stmt)
            await session.commit()
            return result.rowcount > 0

    async def save_chunks(self, chunks: List[Chunk]) -> None:
        async with AsyncSessionLocal() as session:
            db_chunks = [
                ORMDocumentChunk(
                    id=chunk.id,
                    document_id=chunk.document_id,
                    text=chunk.text,
                    chunk_index=chunk.chunk_index,
                    metadata_=chunk.metadata
                )
                for chunk in chunks
            ]
            session.add_all(db_chunks)
            await session.commit()

    async def get_chunks_for_document(self, document_id: str) -> List[Chunk]:
        async with AsyncSessionLocal() as session:
            stmt = select(ORMDocumentChunk).where(ORMDocumentChunk.document_id == document_id).order_by(ORMDocumentChunk.chunk_index)
            result = await session.execute(stmt)
            db_chunks = result.scalars().all()
            
            return [
                Chunk(
                    id=db_chunk.id,
                    document_id=db_chunk.document_id,
                    text=db_chunk.text,
                    chunk_index=db_chunk.chunk_index,
                    metadata=db_chunk.metadata_
                )
                for db_chunk in db_chunks
            ]
