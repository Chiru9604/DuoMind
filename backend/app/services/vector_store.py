import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any
from langchain_groq import ChatGroq
from langchain.embeddings.base import Embeddings
from sentence_transformers import SentenceTransformer
from app.core.config import settings
import uuid
import numpy as np

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
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self._initialize_collection()
        self.embeddings = SemanticEmbeddings()
    
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
    
    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]] = None) -> int:
        """Add document chunks to vector store"""
        if not texts:
            return 0
        
        # Ensure collection exists
        self._ensure_collection_exists()
        
        # Generate embeddings
        embeddings = self.embeddings.embed_documents(texts)
        
        # Generate IDs
        ids = [str(uuid.uuid4()) for _ in texts]
        
        # Add to collection
        self.collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas or [{"source": "uploaded_document"} for _ in texts],
            ids=ids
        )
        
        return len(texts)
    
    def similarity_search(self, query: str, k: int = None) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        if k is None:
            k = settings.top_k_chunks
        
        # Ensure collection exists
        self._ensure_collection_exists()
        
        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)
        
        # Search
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k
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
    
    def clear_collection(self):
        """Clear all documents from the collection"""
        try:
            self.client.delete_collection("documents")
        except Exception:
            # Collection might not exist, which is fine
            pass
        # Always reinitialize the collection
        self._initialize_collection()