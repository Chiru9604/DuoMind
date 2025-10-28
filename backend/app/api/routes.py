import time
import json
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, StreamingResponse
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
vector_store = VectorStore(use_advanced_retriever=True)  # Enable advanced hybrid retriever with DPR and neural QA
rag_service = RAGService(use_advanced_retriever=True)  # Enable advanced retrieval and neural QA

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
        
        # Generate unique document ID
        import uuid
        document_id = str(uuid.uuid4())
        
        # Store in vector database with enhanced metadata including document_id
        upload_timestamp = datetime.now().isoformat()
        chunks_created = vector_store.add_documents(
            texts=chunks,
            metadatas=[{
                "filename": file.filename, 
                "chunk_id": i,
                "upload_timestamp": upload_timestamp,
                "document_type": "user_uploaded",
                "total_chunks": len(chunks),
                "document_id": document_id
            } for i in range(len(chunks))],
            document_id=document_id
        )
        
        return UploadResponse(
            message="File uploaded and processed successfully",
            filename=file.filename,
            chunks_created=chunks_created,
            document_id=document_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/rag/stream")
async def rag_query_stream(request: RAGRequest):
    """Process RAG query with streaming response using Server-Sent Events"""
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        def generate_stream():
            try:
                for chunk in rag_service.query_streaming(request.query, request.mode):
                    # Format as Server-Sent Events
                    data = json.dumps(chunk)
                    yield f"data: {data}\n\n"
                    
                # Send final event to close the stream
                yield f"data: {json.dumps({'type': 'close'})}\n\n"
                
            except Exception as e:
                # Send error event
                error_data = {
                    "type": "error",
                    "content": f"Stream error: {str(e)}"
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/plain; charset=utf-8"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing streaming query: {str(e)}")

@router.post("/rag", response_model=RAGResponse)
async def rag_query(request: RAGRequest):
    """Process RAG query with specified mode"""
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Process query with active document IDs
        result = rag_service.query(request.query, request.mode, request.active_document_ids)
        
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