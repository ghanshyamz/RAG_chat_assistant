from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from infrastructure.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ORMDocument(Base):
    __tablename__ = 'documents'

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="uploaded")

    chunks = relationship("ORMDocumentChunk", back_populates="document", cascade="all, delete-orphan")

class ORMDocumentChunk(Base):
    __tablename__ = 'document_chunks'

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)
    text = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    metadata_ = Column(JSON, default=dict)

    document = relationship("ORMDocument", back_populates="chunks")
