"""
API endpoints for retrieval system information and configuration.
Provides insights into the advanced hybrid retriever performance and configuration.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from app.services.vector_store import VectorStore
from app.services.rag_service import RAGService

router = APIRouter()

# Service instances with advanced retriever
vector_store = VectorStore(use_advanced_retriever=True)
rag_service = RAGService(use_advanced_retriever=True)

class TestQuery(BaseModel):
    query: str

@router.get("/retrieval/info")
async def get_retrieval_info():
    """Get information about the current retrieval system configuration"""
    try:
        retriever_info = vector_store.get_retriever_info()
        
        return {
            "status": "active",
            "retrieval_system": retriever_info,
            "features": {
                "bm25_plus": True,
                "dense_passage_retrieval": True,
                "neural_qa": True,
                "score_fusion": True,
                "hybrid_search": True
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving system info: {str(e)}")

@router.get("/retrieval/stats")
async def get_retrieval_stats():
    """Get detailed statistics about the retrieval system performance"""
    try:
        retriever_info = vector_store.get_retriever_info()
        
        if retriever_info["retriever_type"] == "advanced_hybrid":
            stats = retriever_info["retriever_stats"]
            neural_qa_info = retriever_info.get("neural_qa_info", {})
            
            return {
                "retriever_type": "advanced_hybrid",
                "document_count": stats["document_count"],
                "bm25_variant": stats["bm25_variant"],
                "fusion_method": stats["fusion_method"],
                "weights": {
                    "bm25": stats["bm25_weight"],
                    "dpr": stats["dpr_weight"]
                },
                "neural_qa": {
                    "model": neural_qa_info.get("model_name", "N/A"),
                    "confidence_threshold": neural_qa_info.get("confidence_threshold", "N/A"),
                    "top_k_answers": neural_qa_info.get("top_k_answers", "N/A")
                },
                "dpr_index_size": stats["dpr_index_size"],
                "normalize_scores": stats["normalize_scores"]
            }
        else:
            return {
                "retriever_type": "original_hybrid",
                "document_count": retriever_info["document_count"],
                "neural_qa": False
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")

@router.post("/retrieval/test")
async def test_retrieval_system(request: TestQuery):
    """Test the retrieval system with a sample query"""
    try:
        query = request.query
        
        # Test both standard and neural QA search
        standard_results = vector_store.similarity_search(query, k=3)
        
        if vector_store.use_advanced_retriever and vector_store.neural_qa:
            qa_results = vector_store.similarity_search_with_qa(query, k=3)
            # Extract retrieval results from the QA response
            qa_retrieval_results = qa_results.get("retrieval_results", []) if qa_results else []
        else:
            qa_results = None
            qa_retrieval_results = []
        
        return {
            "test_query": query,
            "standard_search": {
                "result_count": len(standard_results),
                "results": [
                    {
                        "content": result.get("content", "")[:200] + "..." if len(result.get("content", "")) > 200 else result.get("content", ""),
                        "metadata": result.get("metadata", {}),
                        "score": result.get("fused_score", result.get("distance", 0))
                    }
                    for result in standard_results[:2]
                ] if standard_results else []
            },
            "neural_qa_search": {
                "result_count": len(qa_retrieval_results),
                "results": [
                    {
                        "content": result.get("content", "")[:200] + "..." if len(result.get("content", "")) > 200 else result.get("content", ""),
                        "metadata": result.get("metadata", {}),
                        "score": result.get("fused_score", result.get("distance", 0))
                    }
                    for result in qa_retrieval_results[:2]
                ] if qa_retrieval_results else [],
                "qa_answers": qa_results.get("qa_results", [])[:2] if qa_results else []
            } if vector_store.use_advanced_retriever and vector_store.neural_qa else None,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing retrieval: {str(e)}")