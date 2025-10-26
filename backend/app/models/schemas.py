from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class ChatMode(str, Enum):
    NORMAL = "normal"
    PRO = "pro"

class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_created: int

class RAGRequest(BaseModel):
    query: str
    mode: ChatMode = ChatMode.NORMAL

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