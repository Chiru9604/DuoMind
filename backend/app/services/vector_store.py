import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain.embeddings.base import Embeddings
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.services.hybrid_retriever import HybridRetriever
from app.services.advanced_hybrid_retriever import AdvancedHybridRetriever
from app.services.neural_qa import NeuralQALayer
import uuid
import numpy as np
import logging

logger = logging.getLogger(__name__)

class SemanticEmbeddings(Embeddings):
    """Semantic embeddings using sentence-transformers"""
    def __init__(self):
        # Use a high-quality multilingual embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        # This model produces 384-dimensional embeddings
        
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of documents"""
        embeddings = self.model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()
    
    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query"""
        embedding = self.model.encode([text], convert_to_tensor=False)
        return embedding[0].tolist()

class VectorStore:
    def __init__(self, use_advanced_retriever: bool = True):
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self._initialize_collection()
        self.embeddings = SemanticEmbeddings()
        
        # Choose retriever type
        self.use_advanced_retriever = use_advanced_retriever
        
        if use_advanced_retriever:
            # Initialize advanced hybrid retriever with BM25+, DPR, and score fusion
            self.advanced_retriever = AdvancedHybridRetriever(
                use_bm25_variant="bm25_plus",
                bm25_weight=0.4,
                dpr_weight=0.6,
                fusion_method="weighted_sum",
                normalize_scores=True
            )
            # Initialize neural QA layer
            self.neural_qa = NeuralQALayer(
                model_name="deepset/roberta-base-squad2",
                confidence_threshold=0.1,
                top_k_answers=3
            )
            logger.info("Initialized with advanced hybrid retriever and neural QA")
        else:
            # Fallback to original hybrid retriever
            self.hybrid_retriever = HybridRetriever(alpha=0.6)
            self.neural_qa = None
            logger.info("Initialized with original hybrid retriever")
    
    def _initialize_collection(self):
        """Initialize or reinitialize the collection"""
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
    
    def _ensure_collection_exists(self):
        """Ensure the collection exists and is accessible"""
        try:
            # Try to access the collection
            self.collection.count()
        except Exception:
            # If there's any issue, reinitialize the collection
            self._initialize_collection()
    
    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]] = None, document_id: str = None) -> int:
        """Add document chunks to vector store"""
        if not texts:
            return 0
        
        # Ensure collection exists
        self._ensure_collection_exists()
        
        # Generate embeddings
        embeddings = self.embeddings.embed_documents(texts)
        
        # Generate IDs
        ids = [str(uuid.uuid4()) for _ in texts]
        
        # Ensure document_id is included in metadata
        if metadatas:
            for metadata in metadatas:
                if document_id:
                    metadata['document_id'] = document_id
        else:
            metadatas = [{"source": "uploaded_document", "document_id": document_id} for _ in texts]
        
        # Add to collection
        self.collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        # Add to appropriate retriever
        if self.use_advanced_retriever:
            self.advanced_retriever.add_documents(texts, metadatas)
        else:
            self.hybrid_retriever.add_documents(texts, metadatas)
        
        return len(texts)
    
    def similarity_search(self, query: str, k: int = None, document_ids: List[str] = None, mode: str = "normal") -> List[Dict[str, Any]]:
        """Search for similar documents using hybrid reranking (BM25+ + DPR + semantic) with mode-specific weights"""
        if k is None:
            k = settings.top_k_chunks
        
        # Ensure collection exists
        self._ensure_collection_exists()
        
        if self.use_advanced_retriever:
            # Use advanced hybrid retriever with BM25+, DPR, and score fusion
            if self.advanced_retriever.get_document_count() > 0:
                results = self.advanced_retriever.search(query, top_k=k, mode=mode)
                
                # Format results to match expected structure
                formatted_results = []
                for result in results:
                    formatted_results.append({
                        'content': result['passage'],
                        'metadata': result.get('metadata', {}),
                        'distance': 1.0 - result['score'],  # Convert score to distance
                        'bm25_score': result.get('bm25_score', 0.0),
                        'dpr_score': result.get('dpr_score', 0.0),
                        'fused_score': result['score'],
                        'fusion_weights': result.get('fusion_weights', {})
                    })
                
                return formatted_results
            else:
                return self._fallback_semantic_search(query, k, document_ids)
        else:
            # Use original hybrid retriever
            if self.hybrid_retriever.documents:
                results = self.hybrid_retriever.search(query, k=k, document_ids=document_ids)
                return results
            else:
                return self._fallback_semantic_search(query, k, document_ids)
    
    def similarity_search_with_qa(self, query: str, k: int = None, document_ids: List[str] = None, mode: str = "normal") -> Dict[str, Any]:
        """
        Enhanced search with neural QA layer for answer extraction with mode-specific weights.
        Returns both retrieval results and extracted answer spans.
        """
        if not self.use_advanced_retriever or self.neural_qa is None:
            # Fallback to regular search if advanced features not available
            search_results = self.similarity_search(query, k, document_ids, mode)
            return {
                "retrieval_results": search_results,
                "qa_results": None,
                "enhanced_context": None
            }
        
        # Get retrieval results with mode-specific weights
        search_results = self.similarity_search(query, k, document_ids, mode)
        
        if not search_results:
            return {
                "retrieval_results": [],
                "qa_results": None,
                "enhanced_context": None
            }
        
        # Extract passages and scores for QA
        passages = [result['content'] for result in search_results]
        passage_scores = [result.get('fused_score', 0.0) for result in search_results]
        
        # Extract answer spans using neural QA
        answer_spans = self.neural_qa.extract_answer_spans(query, passages, passage_scores)
        
        # Synthesize QA context for LLM
        qa_context = self.neural_qa.synthesize_qa_context(query, answer_spans)
        
        return {
            "retrieval_results": search_results,
            "qa_results": answer_spans,
            "enhanced_context": qa_context
        }
    
    def _fallback_semantic_search(self, query: str, k: int, document_ids: List[str] = None) -> List[Dict[str, Any]]:
        """Fallback to original semantic search if hybrid retriever is empty"""
        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)
        
        # Prepare where clause for filtering by document IDs
        where_clause = None
        if document_ids:
            where_clause = {"document_id": {"$in": document_ids}}
        
        # Search
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=where_clause
        )
        
        # Format results
        documents = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                documents.append({
                    'content': doc,
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                    'distance': results['distances'][0][i] if results['distances'] else 0.0
                })
        
        return documents
    
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents with their metadata"""
        self._ensure_collection_exists()
        
        results = self.collection.get(include=['metadatas'])
        
        # Group by document_id to get unique documents
        documents_map = {}
        
        if results['metadatas']:
            for metadata in results['metadatas']:
                doc_id = metadata.get('document_id')
                if doc_id and doc_id not in documents_map:
                    documents_map[doc_id] = {
                        'id': doc_id,
                        'filename': metadata.get('filename', 'Unknown'),
                        'upload_timestamp': metadata.get('upload_timestamp', ''),
                        'total_chunks': metadata.get('total_chunks', 0),
                        'document_type': metadata.get('document_type', 'unknown')
                    }
        
        return list(documents_map.values())
    
    def clear_collection(self):
        """Clear all documents from the collection"""
        try:
            self.client.delete_collection("documents")
        except Exception:
            # Collection might not exist, which is fine
            pass
        # Always reinitialize the collection
        self._initialize_collection()
        
        # Clear appropriate retriever
        if self.use_advanced_retriever:
            self.advanced_retriever.clear_documents()
        else:
            self.hybrid_retriever.clear_documents()
    
    def get_retriever_info(self) -> Dict[str, Any]:
        """Get information about the current retriever configuration"""
        if self.use_advanced_retriever:
            return {
                "retriever_type": "advanced_hybrid",
                "retriever_stats": self.advanced_retriever.get_retriever_stats(),
                "neural_qa_info": self.neural_qa.get_model_info() if self.neural_qa else None
            }
        else:
            return {
                "retriever_type": "original_hybrid",
                "document_count": len(self.hybrid_retriever.documents) if hasattr(self.hybrid_retriever, 'documents') else 0
            }