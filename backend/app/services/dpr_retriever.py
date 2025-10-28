"""
Dense Passage Retrieval (DPR) Implementation using Facebook DPR encoders.
DPR uses separate encoders for questions and contexts to create dense vector representations
for improved semantic matching in retrieval tasks.
"""

import torch
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from transformers import DPRQuestionEncoder, DPRContextEncoder, DPRQuestionEncoderTokenizer, DPRContextEncoderTokenizer
import logging
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class DPRRetriever:
    """
    Dense Passage Retrieval implementation using Facebook's pre-trained DPR models.
    
    This class handles:
    1. Loading pre-trained question and context encoders
    2. Encoding questions and passages into dense vectors
    3. Computing cosine similarity for retrieval
    4. Maintaining an index of encoded passages
    """
    
    def __init__(
        self,
        question_encoder_model: str = "facebook/dpr-question_encoder-single-nq-base",
        context_encoder_model: str = "facebook/dpr-ctx_encoder-single-nq-base",
        device: Optional[str] = None
    ):
        """
        Initialize DPR retriever with pre-trained encoders.
        
        Args:
            question_encoder_model: HuggingFace model name for question encoder
            context_encoder_model: HuggingFace model name for context encoder
            device: Device to run models on ('cpu', 'cuda', or None for auto-detect)
        """
        # Set device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        logger.info(f"Initializing DPR on device: {self.device}")
        
        try:
            # Load question encoder and tokenizer
            self.question_tokenizer = DPRQuestionEncoderTokenizer.from_pretrained(question_encoder_model)
            self.question_encoder = DPRQuestionEncoder.from_pretrained(question_encoder_model)
            self.question_encoder.to(self.device)
            self.question_encoder.eval()
            
            # Load context encoder and tokenizer
            self.context_tokenizer = DPRContextEncoderTokenizer.from_pretrained(context_encoder_model)
            self.context_encoder = DPRContextEncoder.from_pretrained(context_encoder_model)
            self.context_encoder.to(self.device)
            self.context_encoder.eval()
            
            logger.info("DPR encoders loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading DPR models: {e}")
            raise
        
        # Storage for encoded passages
        self.passage_embeddings = None
        self.passages = []
        self.passage_metadata = []
    
    def encode_question(self, question: str) -> np.ndarray:
        """
        Encode a question into a dense vector.
        
        Args:
            question: Input question string
            
        Returns:
            Dense vector representation of the question
        """
        with torch.no_grad():
            # Tokenize question
            inputs = self.question_tokenizer(
                question,
                return_tensors="pt",
                max_length=256,
                truncation=True,
                padding=True
            ).to(self.device)
            
            # Encode question
            outputs = self.question_encoder(**inputs)
            
            # Get pooled output (CLS token representation)
            question_embedding = outputs.pooler_output.cpu().numpy()
            
            return question_embedding
    
    def encode_passages(self, passages: List[str]) -> np.ndarray:
        """
        Encode a list of passages into dense vectors.
        
        Args:
            passages: List of passage strings
            
        Returns:
            Matrix of dense vector representations (num_passages x embedding_dim)
        """
        embeddings = []
        
        # Process passages in batches to manage memory
        batch_size = 8
        
        with torch.no_grad():
            for i in range(0, len(passages), batch_size):
                batch_passages = passages[i:i + batch_size]
                
                # Tokenize batch
                inputs = self.context_tokenizer(
                    batch_passages,
                    return_tensors="pt",
                    max_length=256,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                # Encode batch
                outputs = self.context_encoder(**inputs)
                
                # Get pooled outputs
                batch_embeddings = outputs.pooler_output.cpu().numpy()
                embeddings.append(batch_embeddings)
        
        # Concatenate all embeddings
        if embeddings:
            return np.vstack(embeddings)
        else:
            return np.array([])
    
    def add_passages(self, passages: List[str], metadata: Optional[List[Dict[str, Any]]] = None):
        """
        Add passages to the retriever index.
        
        Args:
            passages: List of passage texts
            metadata: Optional metadata for each passage
        """
        if not passages:
            return
        
        logger.info(f"Encoding {len(passages)} passages for DPR index")
        
        # Encode new passages
        new_embeddings = self.encode_passages(passages)
        
        # Update storage
        if self.passage_embeddings is None:
            self.passage_embeddings = new_embeddings
        else:
            self.passage_embeddings = np.vstack([self.passage_embeddings, new_embeddings])
        
        self.passages.extend(passages)
        
        # Handle metadata
        if metadata is None:
            metadata = [{"index": len(self.passage_metadata) + i} for i in range(len(passages))]
        self.passage_metadata.extend(metadata)
        
        logger.info(f"DPR index now contains {len(self.passages)} passages")
    
    def search(self, question: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Search for relevant passages using DPR.
        
        Args:
            question: Query question
            top_k: Number of top results to return
            
        Returns:
            List of dictionaries containing passage info and scores
        """
        if self.passage_embeddings is None or len(self.passages) == 0:
            logger.warning("No passages in DPR index")
            return []
        
        # Encode question
        question_embedding = self.encode_question(question)
        
        # Compute cosine similarities
        similarities = cosine_similarity(question_embedding, self.passage_embeddings)[0]
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        # Prepare results
        results = []
        for idx in top_indices:
            results.append({
                "passage": self.passages[idx],
                "score": float(similarities[idx]),
                "metadata": self.passage_metadata[idx],
                "doc_index": idx
            })
        
        return results
    
    def get_passage_embedding(self, passage_idx: int) -> Optional[np.ndarray]:
        """
        Get the embedding for a specific passage by index.
        
        Args:
            passage_idx: Index of the passage
            
        Returns:
            Embedding vector or None if index is invalid
        """
        if (self.passage_embeddings is None or 
            passage_idx < 0 or 
            passage_idx >= len(self.passages)):
            return None
        
        return self.passage_embeddings[passage_idx]
    
    def clear_index(self):
        """Clear all passages and embeddings from the index."""
        self.passage_embeddings = None
        self.passages = []
        self.passage_metadata = []
        logger.info("DPR index cleared")
    
    def get_index_size(self) -> int:
        """Get the number of passages in the index."""
        return len(self.passages)
    
    def save_index(self, filepath: str):
        """
        Save the DPR index to disk.
        
        Args:
            filepath: Path to save the index
        """
        index_data = {
            "passage_embeddings": self.passage_embeddings,
            "passages": self.passages,
            "passage_metadata": self.passage_metadata
        }
        
        np.savez_compressed(filepath, **index_data)
        logger.info(f"DPR index saved to {filepath}")
    
    def load_index(self, filepath: str):
        """
        Load a DPR index from disk.
        
        Args:
            filepath: Path to load the index from
        """
        try:
            index_data = np.load(filepath, allow_pickle=True)
            
            self.passage_embeddings = index_data["passage_embeddings"]
            self.passages = index_data["passages"].tolist()
            self.passage_metadata = index_data["passage_metadata"].tolist()
            
            logger.info(f"DPR index loaded from {filepath} with {len(self.passages)} passages")
            
        except Exception as e:
            logger.error(f"Error loading DPR index: {e}")
            raise


def compute_dpr_similarity(question_embedding: np.ndarray, passage_embeddings: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between question and passage embeddings.
    
    Args:
        question_embedding: Question embedding vector
        passage_embeddings: Matrix of passage embeddings
        
    Returns:
        Array of similarity scores
    """
    return cosine_similarity(question_embedding.reshape(1, -1), passage_embeddings)[0]