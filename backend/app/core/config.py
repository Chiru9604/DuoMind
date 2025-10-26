import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    host: str = "0.0.0.0"
    port: int = 8000
    chroma_persist_directory: str = "./data/chroma"
    embeddings_model: str = "groq"
    chunk_size: int = 500
    chunk_overlap: int = 100
    top_k_chunks: int = 5
    fallback_model: str = "llama-3.3-70b-versatile"
    timeout_seconds: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()