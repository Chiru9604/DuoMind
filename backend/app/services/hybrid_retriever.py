from typing import List, Dict, Any, Tuple
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
import re


class HybridRetriever:
    """
    Hybrid retriever that combines BM25 (lexical) and semantic search for improved relevance.
    Uses a weighted combination of BM25 and semantic similarity scores.
    """
    
    def __init__(self, alpha: float = 0.5):
        """
        Initialize the hybrid retriever.
        
        Args:
            alpha: Weight for BM25 scores (1-alpha for semantic scores). 
                   0.5 means equal weighting.
        """
        self.alpha = alpha
        self.bm25 = None
        self.documents = []
        self.document_metadata = []
        self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.document_embeddings = []
        
    def _preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text for BM25 by tokenizing and cleaning.
        
        Args:
            text: Input text to preprocess
            
        Returns:
            List of tokens
        """
        # Convert to lowercase and remove special characters
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        # Split into tokens and filter out empty strings
        tokens = [token for token in text.split() if token.strip()]
        return tokens
    
    def add_documents(self, documents: List[str], metadatas: List[Dict[str, Any]] = None):
        """
        Add documents to the hybrid retriever.
        
        Args:
            documents: List of document texts
            metadatas: List of metadata dictionaries for each document
        """
        if not documents:
            return
            
        # Store documents and metadata
        self.documents.extend(documents)
        if metadatas:
            self.document_metadata.extend(metadatas)
        else:
            self.document_metadata.extend([{} for _ in documents])
        
        # Preprocess documents for BM25
        tokenized_docs = [self._preprocess_text(doc) for doc in documents]
        
        # Initialize or update BM25
        if self.bm25 is None:
            all_tokenized = [self._preprocess_text(doc) for doc in self.documents]
            self.bm25 = BM25Okapi(all_tokenized)
        else:
            # Rebuild BM25 with all documents
            all_tokenized = [self._preprocess_text(doc) for doc in self.documents]
            self.bm25 = BM25Okapi(all_tokenized)
        
        # Generate embeddings for new documents
        new_embeddings = self.embeddings_model.encode(documents, convert_to_tensor=False)
        if len(self.document_embeddings) == 0:
            self.document_embeddings = new_embeddings
        else:
            self.document_embeddings = np.vstack([self.document_embeddings, new_embeddings])
    
    def clear_documents(self):
        """Clear all stored documents and reset the retriever."""
        self.documents = []
        self.document_metadata = []
        self.bm25 = None
        self.document_embeddings = []
    
    def _normalize_scores(self, scores: List[float]) -> List[float]:
        """
        Normalize scores to [0, 1] range using min-max normalization.
        
        Args:
            scores: List of scores to normalize
            
        Returns:
            Normalized scores
        """
        if not scores or len(scores) == 1:
            return scores
            
        min_score = min(scores)
        max_score = max(scores)
        
        if max_score == min_score:
            return [1.0] * len(scores)
            
        return [(score - min_score) / (max_score - min_score) for score in scores]
    
    def search(self, query: str, k: int = 10, document_ids: List[str] = None) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining BM25 and semantic similarity.
        
        Args:
            query: Search query
            k: Number of results to return
            document_ids: Optional list of document IDs to filter by
            
        Returns:
            List of documents with hybrid scores, sorted by relevance
        """
        if not self.documents or self.bm25 is None:
            return []
        
        # Filter documents by document_ids if provided
        valid_indices = []
        if document_ids:
            for i, metadata in enumerate(self.document_metadata):
                if metadata.get('document_id') in document_ids:
                    valid_indices.append(i)
        else:
            valid_indices = list(range(len(self.documents)))
        
        if not valid_indices:
            return []
        
        # Get BM25 scores
        tokenized_query = self._preprocess_text(query)
        bm25_scores = self.bm25.get_scores(tokenized_query)
        
        # Get semantic similarity scores
        query_embedding = self.embeddings_model.encode([query], convert_to_tensor=False)[0]
        
        # Calculate cosine similarity with all document embeddings
        if len(self.document_embeddings.shape) == 1:
            # Single document case
            semantic_scores = [np.dot(query_embedding, self.document_embeddings) / 
                             (np.linalg.norm(query_embedding) * np.linalg.norm(self.document_embeddings))]
        else:
            # Multiple documents case
            semantic_scores = []
            for doc_embedding in self.document_embeddings:
                similarity = np.dot(query_embedding, doc_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
                )
                semantic_scores.append(similarity)
        
        # Filter scores for valid indices
        filtered_bm25_scores = [bm25_scores[i] for i in valid_indices]
        filtered_semantic_scores = [semantic_scores[i] for i in valid_indices]
        
        # Normalize scores
        normalized_bm25 = self._normalize_scores(filtered_bm25_scores)
        normalized_semantic = self._normalize_scores(filtered_semantic_scores)
        
        # Combine scores using weighted average
        hybrid_scores = []
        for i in range(len(valid_indices)):
            hybrid_score = (self.alpha * normalized_bm25[i] + 
                          (1 - self.alpha) * normalized_semantic[i])
            hybrid_scores.append(hybrid_score)
        
        # Create results with scores
        results = []
        for i, idx in enumerate(valid_indices):
            results.append({
                'content': self.documents[idx],
                'metadata': self.document_metadata[idx],
                'hybrid_score': hybrid_scores[i],
                'bm25_score': normalized_bm25[i],
                'semantic_score': normalized_semantic[i],
                'distance': 1 - normalized_semantic[i]  # Convert similarity to distance for compatibility
            })
        
        # Sort by hybrid score (descending)
        results.sort(key=lambda x: x['hybrid_score'], reverse=True)
        
        # Return top k results
        return results[:k]