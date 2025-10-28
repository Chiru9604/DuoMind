"""
Advanced Hybrid Retriever combining BM25+, DPR, and score fusion.
This module integrates lexical (BM25+) and semantic (DPR) retrieval methods
with sophisticated score fusion techniques for optimal retrieval performance.
"""

import re
import string
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from sklearn.preprocessing import MinMaxScaler
from .bm25_plus import BM25Plus, BM25L
from .dpr_retriever import DPRRetriever

logger = logging.getLogger(__name__)


class ScoreFusion:
    """
    Score fusion utilities for combining different retrieval scores.
    Implements various fusion strategies including weighted sum, rank fusion, and normalization.
    """
    
    @staticmethod
    def min_max_normalize(scores: List[float]) -> List[float]:
        """
        Normalize scores using min-max normalization.
        
        Args:
            scores: List of raw scores
            
        Returns:
            Normalized scores between 0 and 1
        """
        if not scores or len(scores) == 1:
            return scores
        
        min_score = min(scores)
        max_score = max(scores)
        
        if max_score == min_score:
            return [1.0] * len(scores)
        
        return [(score - min_score) / (max_score - min_score) for score in scores]
    
    @staticmethod
    def z_score_normalize(scores: List[float]) -> List[float]:
        """
        Normalize scores using z-score normalization.
        
        Args:
            scores: List of raw scores
            
        Returns:
            Z-score normalized scores
        """
        if not scores:
            return scores
        
        mean_score = np.mean(scores)
        std_score = np.std(scores)
        
        if std_score == 0:
            return [0.0] * len(scores)
        
        return [(score - mean_score) / std_score for score in scores]
    
    @staticmethod
    def weighted_sum_fusion(
        scores1: List[float], 
        scores2: List[float], 
        weight1: float = 0.5, 
        weight2: float = 0.5,
        normalize: bool = True
    ) -> List[float]:
        """
        Combine two sets of scores using weighted sum.
        
        Args:
            scores1: First set of scores
            scores2: Second set of scores
            weight1: Weight for first set
            weight2: Weight for second set
            normalize: Whether to normalize scores before fusion
            
        Returns:
            Combined scores
        """
        if len(scores1) != len(scores2):
            raise ValueError("Score lists must have the same length")
        
        if normalize:
            scores1 = ScoreFusion.min_max_normalize(scores1)
            scores2 = ScoreFusion.min_max_normalize(scores2)
        
        return [weight1 * s1 + weight2 * s2 for s1, s2 in zip(scores1, scores2)]
    
    @staticmethod
    def rank_fusion(
        results1: List[Dict[str, Any]], 
        results2: List[Dict[str, Any]], 
        k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Combine results using Reciprocal Rank Fusion (RRF).
        
        Args:
            results1: First set of ranked results
            results2: Second set of ranked results
            k: RRF parameter (default: 60)
            
        Returns:
            Fused and re-ranked results
        """
        # Create document ID to rank mappings
        doc_ranks1 = {result.get('doc_index', i): i + 1 for i, result in enumerate(results1)}
        doc_ranks2 = {result.get('doc_index', i): i + 1 for i, result in enumerate(results2)}
        
        # Get all unique document IDs
        all_doc_ids = set(doc_ranks1.keys()) | set(doc_ranks2.keys())
        
        # Calculate RRF scores
        rrf_scores = {}
        for doc_id in all_doc_ids:
            rank1 = doc_ranks1.get(doc_id, float('inf'))
            rank2 = doc_ranks2.get(doc_id, float('inf'))
            
            rrf_score = 0
            if rank1 != float('inf'):
                rrf_score += 1 / (k + rank1)
            if rank2 != float('inf'):
                rrf_score += 1 / (k + rank2)
            
            rrf_scores[doc_id] = rrf_score
        
        # Sort by RRF score and create result list
        sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Build final results
        doc_id_to_result = {}
        for result in results1 + results2:
            doc_id = result.get('doc_index')
            if doc_id not in doc_id_to_result:
                doc_id_to_result[doc_id] = result
        
        fused_results = []
        for doc_id, rrf_score in sorted_docs:
            if doc_id in doc_id_to_result:
                result = doc_id_to_result[doc_id].copy()
                result['rrf_score'] = rrf_score
                fused_results.append(result)
        
        return fused_results


class AdvancedHybridRetriever:
    """
    Advanced hybrid retriever combining BM25+, DPR, and score fusion.
    
    This retriever integrates:
    1. BM25+ for improved lexical matching
    2. DPR for semantic understanding
    3. Multiple score fusion strategies
    4. Configurable weighting and normalization
    """
    
    def __init__(
        self,
        use_bm25_variant: str = "bm25_plus",  # "bm25_plus" or "bm25l"
        bm25_weight: float = 0.4,
        dpr_weight: float = 0.6,
        fusion_method: str = "weighted_sum",  # "weighted_sum" or "rank_fusion"
        normalize_scores: bool = True,
        dpr_device: Optional[str] = None
    ):
        """
        Initialize the advanced hybrid retriever.
        
        Args:
            use_bm25_variant: Which BM25 variant to use
            bm25_weight: Weight for BM25+ scores
            dpr_weight: Weight for DPR scores
            fusion_method: Score fusion method
            normalize_scores: Whether to normalize scores
            dpr_device: Device for DPR models
        """
        self.bm25_weight = bm25_weight
        self.dpr_weight = dpr_weight
        self.fusion_method = fusion_method
        self.normalize_scores = normalize_scores
        self.use_bm25_variant = use_bm25_variant
        
        # Initialize retrievers
        self.bm25_retriever = None
        self.dpr_retriever = DPRRetriever(device=dpr_device)
        
        # Document storage
        self.documents = []
        self.document_metadata = []
        
        # Score fusion utility
        self.score_fusion = ScoreFusion()
        
        logger.info(f"Advanced Hybrid Retriever initialized with {use_bm25_variant}, "
                   f"weights: BM25={bm25_weight}, DPR={dpr_weight}, "
                   f"fusion: {fusion_method}")
    
    def _preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text for BM25+ tokenization.
        
        Args:
            text: Input text
            
        Returns:
            List of preprocessed tokens
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))
        
        # Remove extra whitespace and split
        tokens = text.split()
        
        # Remove very short tokens
        tokens = [token for token in tokens if len(token) > 1]
        
        return tokens
    
    def add_documents(self, documents: List[str], metadata: Optional[List[Dict[str, Any]]] = None):
        """
        Add documents to both BM25+ and DPR indices.
        
        Args:
            documents: List of document texts
            metadata: Optional metadata for each document
        """
        if not documents:
            return
        
        logger.info(f"Adding {len(documents)} documents to advanced hybrid retriever")
        
        # Store documents and metadata
        self.documents.extend(documents)
        if metadata is None:
            metadata = [{"doc_id": len(self.document_metadata) + i} for i in range(len(documents))]
        self.document_metadata.extend(metadata)
        
        # Preprocess documents for BM25+
        tokenized_docs = [self._preprocess_text(doc) for doc in documents]
        
        # Initialize or update BM25+ retriever
        all_tokenized_docs = [self._preprocess_text(doc) for doc in self.documents]
        
        if self.use_bm25_variant == "bm25_plus":
            self.bm25_retriever = BM25Plus(all_tokenized_docs)
        elif self.use_bm25_variant == "bm25l":
            self.bm25_retriever = BM25L(all_tokenized_docs)
        else:
            raise ValueError(f"Unknown BM25 variant: {self.use_bm25_variant}")
        
        # Add documents to DPR
        self.dpr_retriever.add_passages(documents, metadata)
        
        logger.info(f"Advanced hybrid retriever now contains {len(self.documents)} documents")
    
    def search(self, query: str, top_k: int = 10, mode: str = "normal") -> List[Dict[str, Any]]:
        """
        Search using the advanced hybrid approach with mode-specific fusion weights.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            mode: Retrieval mode ("normal" or "pro") for weight adjustment
            
        Returns:
            List of search results with fused scores
        """
        if not self.documents:
            logger.warning("No documents in advanced hybrid retriever")
            return []
        
        # Apply mode-specific weights
        # Normal mode: Emphasize lexical grounding (BM25: 0.7, DPR: 0.3)
        # Pro mode: Emphasize conceptual similarity (BM25: 0.3, DPR: 0.7)
        if mode.lower() == "normal":
            current_bm25_weight = 0.7
            current_dpr_weight = 0.3
            logger.debug("Using Normal mode weights: BM25=0.7, DPR=0.3 (lexical grounding)")
        elif mode.lower() == "pro":
            current_bm25_weight = 0.3
            current_dpr_weight = 0.7
            logger.debug("Using Pro mode weights: BM25=0.3, DPR=0.7 (conceptual similarity)")
        else:
            # Fallback to instance weights for unknown modes
            current_bm25_weight = self.bm25_weight
            current_dpr_weight = self.dpr_weight
            logger.debug(f"Using default weights for mode '{mode}': BM25={current_bm25_weight}, DPR={current_dpr_weight}")
        
        # Get BM25+ results
        query_tokens = self._preprocess_text(query)
        bm25_scores = self.bm25_retriever.get_scores(query_tokens)
        
        # Get DPR results
        dpr_results = self.dpr_retriever.search(query, top_k=len(self.documents))
        dpr_scores = [0.0] * len(self.documents)
        
        # Map DPR scores to document indices
        for result in dpr_results:
            doc_idx = result.get('doc_index', -1)
            if 0 <= doc_idx < len(self.documents):
                dpr_scores[doc_idx] = result['score']
        
        # Perform score fusion with mode-specific weights
        if self.fusion_method == "weighted_sum":
            fused_scores = self.score_fusion.weighted_sum_fusion(
                bm25_scores, 
                dpr_scores, 
                current_bm25_weight, 
                current_dpr_weight,
                normalize=self.normalize_scores
            )
            
            # Create results with fused scores
            results = []
            for i, (doc, metadata, fused_score) in enumerate(zip(self.documents, self.document_metadata, fused_scores)):
                results.append({
                    "passage": doc,
                    "score": fused_score,
                    "bm25_score": bm25_scores[i],
                    "dpr_score": dpr_scores[i],
                    "metadata": metadata,
                    "doc_index": i,
                    "fusion_weights": {"bm25": current_bm25_weight, "dpr": current_dpr_weight}
                })
            
            # Sort by fused score
            results.sort(key=lambda x: x['score'], reverse=True)
            
        elif self.fusion_method == "rank_fusion":
            # Create BM25+ results
            bm25_results = []
            for i, (doc, metadata, score) in enumerate(zip(self.documents, self.document_metadata, bm25_scores)):
                bm25_results.append({
                    "passage": doc,
                    "score": score,
                    "metadata": metadata,
                    "doc_index": i
                })
            bm25_results.sort(key=lambda x: x['score'], reverse=True)
            
            # Use rank fusion
            results = self.score_fusion.rank_fusion(bm25_results, dpr_results)
            
            # Add fusion weights info to rank fusion results
            for result in results:
                result["fusion_weights"] = {"bm25": current_bm25_weight, "dpr": current_dpr_weight}
            
        else:
            raise ValueError(f"Unknown fusion method: {self.fusion_method}")
        
        return results[:top_k]
    
    def get_document_count(self) -> int:
        """Get the number of documents in the retriever."""
        return len(self.documents)
    
    def clear_documents(self):
        """Clear all documents from the retriever."""
        self.documents = []
        self.document_metadata = []
        self.bm25_retriever = None
        self.dpr_retriever.clear_index()
        logger.info("Advanced hybrid retriever cleared")
    
    def update_weights(self, bm25_weight: float, dpr_weight: float):
        """
        Update the fusion weights.
        
        Args:
            bm25_weight: New weight for BM25+ scores
            dpr_weight: New weight for DPR scores
        """
        self.bm25_weight = bm25_weight
        self.dpr_weight = dpr_weight
        logger.info(f"Updated weights: BM25+={bm25_weight}, DPR={dpr_weight}")
    
    def get_retriever_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the retriever.
        
        Returns:
            Dictionary with retriever statistics
        """
        return {
            "document_count": len(self.documents),
            "bm25_variant": self.use_bm25_variant,
            "bm25_weight": self.bm25_weight,
            "dpr_weight": self.dpr_weight,
            "fusion_method": self.fusion_method,
            "normalize_scores": self.normalize_scores,
            "dpr_index_size": self.dpr_retriever.get_index_size()
        }