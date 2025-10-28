from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class ChatMode(str, Enum):
    NORMAL = "normal"
    PRO = "pro"

class DocumentInfo(BaseModel):
    id: str
    filename: str
    upload_timestamp: str
    total_chunks: int
    is_active: bool = True

class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_created: int
    document_id: str

class DocumentsListResponse(BaseModel):
    documents: List[DocumentInfo]
    total_documents: int

class RAGRequest(BaseModel):
    query: str
    mode: ChatMode = ChatMode.NORMAL
    active_document_ids: Optional[List[str]] = None

class RAGResponse(BaseModel):
    answer: str
    mode: ChatMode
    sources: List[str] = []
    processing_time: float

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None