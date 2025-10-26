import time
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.models.schemas import (
    RAGRequest, RAGResponse, UploadResponse, 
    HealthResponse, ErrorResponse
)
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStore
from app.services.rag_service import RAGService

router = APIRouter()

# Service instances
document_processor = DocumentProcessor()
vector_store = VectorStore()
rag_service = RAGService()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload and process PDF/DOCX files"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.docx')):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF and DOCX files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        # Process document
        text, chunks = document_processor.process_file(content, file.filename)
        
        # Clear previous documents to ensure only the current document is used
        vector_store.clear_collection()
        
        # Store in vector database with enhanced metadata
        upload_timestamp = datetime.now().isoformat()
        chunks_created = vector_store.add_documents(
            texts=chunks,
            metadatas=[{
                "filename": file.filename, 
                "chunk_id": i,
                "upload_timestamp": upload_timestamp,
                "document_type": "user_uploaded",
                "total_chunks": len(chunks)
            } for i in range(len(chunks))]
        )
        
        return UploadResponse(
            message="File uploaded and processed successfully",
            filename=file.filename,
            chunks_created=chunks_created
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/rag", response_model=RAGResponse)
async def rag_query(request: RAGRequest):
    """Process RAG query with specified mode"""
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Process query
        result = rag_service.query(request.query, request.mode)
        
        return RAGResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now().isoformat()
    )

@router.delete("/documents")
async def clear_documents():
    """Clear all uploaded documents"""
    try:
        vector_store.clear_collection()
        return {"message": "All documents cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing documents: {str(e)}")

@router.get("/documents/count")
async def get_document_count():
    """Get count of stored document chunks"""
    try:
        count = vector_store.collection.count()
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document count: {str(e)}")