from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    content_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "uploaded" # e.g., uploaded, processing, indexed, error
    
class Chunk(BaseModel):
    id: str
    document_id: str
    text: str
    chunk_index: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
class Query(BaseModel):
    text: str
    top_k: int = 5
    
class Message(BaseModel):
    role: str # 'user', 'assistant', 'system'
    content: str
