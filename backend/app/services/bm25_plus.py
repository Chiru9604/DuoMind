"""
BM25+ Implementation for improved lexical search.
BM25+ is an enhanced version of BM25 that addresses the issue of over-penalization
of long documents and provides better performance on various datasets.
"""

import math
from typing import List, Dict, Any
import numpy as np
from collections import Counter


class BM25Plus:
    """
    BM25+ algorithm implementation.
    
    BM25+ improves upon standard BM25 by:
    1. Adding a small constant (delta) to prevent zero scores
    2. Better handling of term frequency normalization
    3. Improved performance on long documents
    """
    
    def __init__(self, corpus: List[List[str]], k1: float = 1.2, b: float = 0.75, delta: float = 1.0):
        """
        Initialize BM25+ with a corpus of tokenized documents.
        
        Args:
            corpus: List of tokenized documents (list of token lists)
            k1: Controls term frequency saturation (default: 1.2)
            b: Controls length normalization (default: 0.75)
            delta: Small constant added to prevent zero scores (default: 1.0)
        """
        self.k1 = k1
        self.b = b
        self.delta = delta
        self.corpus = corpus
        self.corpus_size = len(corpus)
        self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size if corpus else 0
        
        # Build document frequency and inverse document frequency
        self.doc_freqs = []
        self.idf = {}
        self.doc_len = []
        
        # Calculate document frequencies
        nd = {}  # Number of documents containing each term
        for doc in corpus:
            self.doc_len.append(len(doc))
            frequencies = Counter(doc)
            self.doc_freqs.append(frequencies)
            
            for word in frequencies.keys():
                nd[word] = nd.get(word, 0) + 1
        
        # Calculate IDF for each term
        for word, freq in nd.items():
            # BM25+ uses log((N - df + 0.5) / (df + 0.5)) for IDF
            self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5))
    
    def get_scores(self, query: List[str]) -> List[float]:
        """
        Calculate BM25+ scores for all documents given a query.
        
        Args:
            query: List of query terms
            
        Returns:
            List of BM25+ scores for each document
        """
        scores = []
        
        for i, doc in enumerate(self.corpus):
            score = 0.0
            doc_freqs = self.doc_freqs[i]
            doc_len = self.doc_len[i]
            
            for term in query:
                if term in doc_freqs:
                    # Term frequency in document
                    tf = doc_freqs[term]
                    
                    # IDF score for the term
                    idf_score = self.idf.get(term, 0)
                    
                    # BM25+ formula with delta addition
                    numerator = tf * (self.k1 + 1)
                    denominator = tf + self.k1 * (1 - self.b + self.b * (doc_len / self.avgdl))
                    
                    # BM25+ adds delta to prevent zero scores
                    term_score = idf_score * (numerator / denominator + self.delta)
                    score += term_score
            
            scores.append(score)
        
        return scores
    
    def get_top_n(self, query: List[str], n: int = 10) -> List[Dict[str, Any]]:
        """
        Get top N documents for a query with their scores.
        
        Args:
            query: List of query terms
            n: Number of top documents to return
            
        Returns:
            List of dictionaries with document index and score
        """
        scores = self.get_scores(query)
        
        # Create list of (index, score) pairs
        scored_docs = [(i, score) for i, score in enumerate(scores)]
        
        # Sort by score in descending order
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        # Return top n results
        return [
            {"doc_index": idx, "score": score}
            for idx, score in scored_docs[:n]
        ]
    
    def update_corpus(self, new_corpus: List[List[str]]):
        """
        Update the corpus and recalculate all statistics.
        
        Args:
            new_corpus: New corpus of tokenized documents
        """
        self.__init__(new_corpus, self.k1, self.b, self.delta)


class BM25L:
    """
    BM25L algorithm implementation.
    
    BM25L is another variant that uses a different length normalization approach,
    particularly effective for longer documents.
    """
    
    def __init__(self, corpus: List[List[str]], k1: float = 1.2, b: float = 0.75, delta: float = 0.5):
        """
        Initialize BM25L with a corpus of tokenized documents.
        
        Args:
            corpus: List of tokenized documents (list of token lists)
            k1: Controls term frequency saturation (default: 1.2)
            b: Controls length normalization (default: 0.75)
            delta: Length normalization parameter (default: 0.5)
        """
        self.k1 = k1
        self.b = b
        self.delta = delta
        self.corpus = corpus
        self.corpus_size = len(corpus)
        self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size if corpus else 0
        
        # Build document frequency and inverse document frequency
        self.doc_freqs = []
        self.idf = {}
        self.doc_len = []
        
        # Calculate document frequencies
        nd = {}  # Number of documents containing each term
        for doc in corpus:
            self.doc_len.append(len(doc))
            frequencies = Counter(doc)
            self.doc_freqs.append(frequencies)
            
            for word in frequencies.keys():
                nd[word] = nd.get(word, 0) + 1
        
        # Calculate IDF for each term
        for word, freq in nd.items():
            self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5))
    
    def get_scores(self, query: List[str]) -> List[float]:
        """
        Calculate BM25L scores for all documents given a query.
        
        Args:
            query: List of query terms
            
        Returns:
            List of BM25L scores for each document
        """
        scores = []
        
        for i, doc in enumerate(self.corpus):
            score = 0.0
            doc_freqs = self.doc_freqs[i]
            doc_len = self.doc_len[i]
            
            for term in query:
                if term in doc_freqs:
                    # Term frequency in document
                    tf = doc_freqs[term]
                    
                    # IDF score for the term
                    idf_score = self.idf.get(term, 0)
                    
                    # BM25L formula with different length normalization
                    ctd = tf / (1 - self.b + self.b * (doc_len / self.avgdl))
                    numerator = (self.k1 + 1) * ctd
                    denominator = self.k1 + ctd
                    
                    # Add delta for length normalization
                    term_score = idf_score * (numerator / denominator) + self.delta
                    score += term_score
            
            scores.append(score)
        
        return scores
    
    def get_top_n(self, query: List[str], n: int = 10) -> List[Dict[str, Any]]:
        """
        Get top N documents for a query with their scores.
        
        Args:
            query: List of query terms
            n: Number of top documents to return
            
        Returns:
            List of dictionaries with document index and score
        """
        scores = self.get_scores(query)
        
        # Create list of (index, score) pairs
        scored_docs = [(i, score) for i, score in enumerate(scores)]
        
        # Sort by score in descending order
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        # Return top n results
        return [
            {"doc_index": idx, "score": score}
            for idx, score in scored_docs[:n]
        ]
    
    def update_corpus(self, new_corpus: List[List[str]]):
        """
        Update the corpus and recalculate all statistics.
        
        Args:
            new_corpus: New corpus of tokenized documents
        """
        self.__init__(new_corpus, self.k1, self.b, self.delta)