from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.vector_store import VectorStore
from datetime import datetime

router = APIRouter()
vector_store = VectorStore()

@router.get("/documents/info")
async def get_documents_info():
    """Get information about stored documents"""
    try:
        # Get all documents with metadata
        collection = vector_store.collection
        results = collection.get(include=['metadatas', 'documents'])
        
        if not results['metadatas']:
            return {
                "total_chunks": 0,
                "documents": [],
                "message": "No documents found"
            }
        
        # Group chunks by document
        documents_info = {}
        
        for i, metadata in enumerate(results['metadatas']):
            filename = metadata.get('filename', 'Unknown')
            upload_time = metadata.get('upload_timestamp', 'Unknown')
            
            if filename not in documents_info:
                documents_info[filename] = {
                    "filename": filename,
                    "upload_timestamp": upload_time,
                    "total_chunks": metadata.get('total_chunks', 0),
                    "chunk_count": 0,
                    "document_type": metadata.get('document_type', 'unknown')
                }
            
            documents_info[filename]["chunk_count"] += 1
        
        return {
            "total_chunks": len(results['metadatas']),
            "documents": list(documents_info.values()),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving document info: {str(e)}")

@router.delete("/documents/{filename}")
async def delete_specific_document(filename: str):
    """Delete a specific document by filename"""
    try:
        collection = vector_store.collection
        
        # Get all documents
        results = collection.get(include=['metadatas'])
        
        if not results['metadatas']:
            raise HTTPException(status_code=404, detail="No documents found")
        
        # Find IDs of chunks belonging to the specified document
        ids_to_delete = []
        for i, metadata in enumerate(results['metadatas']):
            if metadata.get('filename') == filename:
                ids_to_delete.append(results['ids'][i])
        
        if not ids_to_delete:
            raise HTTPException(status_code=404, detail=f"Document '{filename}' not found")
        
        # Delete the chunks
        collection.delete(ids=ids_to_delete)
        
        return {
            "message": f"Document '{filename}' deleted successfully",
            "chunks_deleted": len(ids_to_delete)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")