"""
Neural Question Answering Layer for extractive answer span extraction.
This module uses pre-trained extractive QA models to identify key answer spans
from retrieved passages before sending to the LLM for final synthesis.
"""

import torch
import logging
from typing import List, Dict, Any, Optional, Tuple
from transformers import AutoTokenizer, AutoModelForQuestionAnswering, pipeline
import numpy as np

logger = logging.getLogger(__name__)


class NeuralQALayer:
    """
    Neural Question Answering layer using pre-trained extractive QA models.
    
    This layer:
    1. Takes retrieved passages and a question
    2. Uses extractive QA to find answer spans in each passage
    3. Ranks and filters answer spans by confidence
    4. Provides structured answer information for LLM synthesis
    """
    
    def __init__(
        self,
        model_name: str = "deepset/roberta-base-squad2",
        device: Optional[str] = None,
        confidence_threshold: float = 0.1,
        max_answer_length: int = 512,
        top_k_answers: int = 3
    ):
        """
        Initialize the Neural QA layer.
        
        Args:
            model_name: HuggingFace model name for extractive QA
            device: Device to run the model on
            confidence_threshold: Minimum confidence for answer spans
            max_answer_length: Maximum length of extracted answers
            top_k_answers: Maximum number of answer spans to return
        """
        # Set device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.max_answer_length = max_answer_length
        self.top_k_answers = top_k_answers
        
        logger.info(f"Initializing Neural QA layer with {model_name} on {self.device}")
        
        try:
            # Initialize the QA pipeline
            self.qa_pipeline = pipeline(
                "question-answering",
                model=model_name,
                tokenizer=model_name,
                device=0 if self.device.type == "cuda" else -1,
                return_all_scores=True
            )
            
            # Also load tokenizer and model separately for more control
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForQuestionAnswering.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("Neural QA layer initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Neural QA layer: {e}")
            raise
    
    def extract_answer_spans(
        self, 
        question: str, 
        passages: List[str],
        passage_scores: Optional[List[float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract answer spans from passages using extractive QA.
        
        Args:
            question: The input question
            passages: List of retrieved passages
            passage_scores: Optional retrieval scores for passages
            
        Returns:
            List of answer spans with metadata
        """
        if not passages:
            return []
        
        answer_spans = []
        
        for i, passage in enumerate(passages):
            try:
                # Use the QA pipeline for answer extraction
                qa_input = {
                    "question": question,
                    "context": passage
                }
                
                # Get answer with confidence score
                result = self.qa_pipeline(qa_input)
                
                # Extract answer information
                answer_text = result["answer"]
                confidence = result["score"]
                start_pos = result["start"]
                end_pos = result["end"]
                
                # Filter by confidence threshold
                if confidence >= self.confidence_threshold and answer_text.strip():
                    # Calculate retrieval-weighted confidence if passage scores available
                    retrieval_score = passage_scores[i] if passage_scores and i < len(passage_scores) else 1.0
                    combined_score = confidence * (1 + retrieval_score)  # Boost by retrieval score
                    
                    answer_span = {
                        "answer_text": answer_text.strip(),
                        "confidence": confidence,
                        "retrieval_score": retrieval_score,
                        "combined_score": combined_score,
                        "start_position": start_pos,
                        "end_position": end_pos,
                        "passage_index": i,
                        "passage_text": passage,
                        "context_window": self._get_context_window(passage, start_pos, end_pos)
                    }
                    
                    answer_spans.append(answer_span)
                    
            except Exception as e:
                logger.warning(f"Error extracting answer from passage {i}: {e}")
                continue
        
        # Sort by combined score and return top-k
        answer_spans.sort(key=lambda x: x["combined_score"], reverse=True)
        return answer_spans[:self.top_k_answers]
    
    def extract_multiple_spans_per_passage(
        self, 
        question: str, 
        passage: str,
        max_spans: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Extract multiple answer spans from a single passage.
        
        Args:
            question: The input question
            passage: The passage text
            max_spans: Maximum number of spans to extract
            
        Returns:
            List of answer spans from the passage
        """
        try:
            # Tokenize the input
            inputs = self.tokenizer(
                question,
                passage,
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                start_logits = outputs.start_logits
                end_logits = outputs.end_logits
            
            # Get top-k start and end positions
            start_probs = torch.softmax(start_logits, dim=-1)
            end_probs = torch.softmax(end_logits, dim=-1)
            
            # Find valid answer spans
            spans = []
            start_indices = torch.argsort(start_probs[0], descending=True)[:20]
            end_indices = torch.argsort(end_probs[0], descending=True)[:20]
            
            for start_idx in start_indices:
                for end_idx in end_indices:
                    if (start_idx < end_idx and 
                        end_idx - start_idx <= self.max_answer_length and
                        start_idx >= len(self.tokenizer.encode(question, add_special_tokens=True)) - 1):
                        
                        # Calculate span confidence
                        span_confidence = (start_probs[0][start_idx] * end_probs[0][end_idx]).item()
                        
                        if span_confidence >= self.confidence_threshold:
                            # Decode the answer span
                            answer_tokens = inputs["input_ids"][0][start_idx:end_idx+1]
                            answer_text = self.tokenizer.decode(answer_tokens, skip_special_tokens=True)
                            
                            if answer_text.strip():
                                spans.append({
                                    "answer_text": answer_text.strip(),
                                    "confidence": span_confidence,
                                    "start_token": start_idx.item(),
                                    "end_token": end_idx.item()
                                })
            
            # Remove duplicates and sort by confidence
            unique_spans = []
            seen_answers = set()
            
            for span in sorted(spans, key=lambda x: x["confidence"], reverse=True):
                answer_lower = span["answer_text"].lower()
                if answer_lower not in seen_answers:
                    seen_answers.add(answer_lower)
                    unique_spans.append(span)
                    
                    if len(unique_spans) >= max_spans:
                        break
            
            return unique_spans
            
        except Exception as e:
            logger.error(f"Error extracting multiple spans: {e}")
            return []
    
    def _get_context_window(self, passage: str, start_pos: int, end_pos: int, window_size: int = 100) -> str:
        """
        Get context window around the answer span.
        
        Args:
            passage: The full passage text
            start_pos: Start position of answer
            end_pos: End position of answer
            window_size: Size of context window on each side
            
        Returns:
            Context window text
        """
        # Expand window around the answer
        context_start = max(0, start_pos - window_size)
        context_end = min(len(passage), end_pos + window_size)
        
        # Find word boundaries
        while context_start > 0 and passage[context_start] != ' ':
            context_start -= 1
        while context_end < len(passage) and passage[context_end] != ' ':
            context_end += 1
        
        context = passage[context_start:context_end].strip()
        
        # Add ellipsis if truncated
        if context_start > 0:
            context = "..." + context
        if context_end < len(passage):
            context = context + "..."
        
        return context
    
    def synthesize_qa_context(
        self, 
        question: str, 
        answer_spans: List[Dict[str, Any]],
        include_passages: bool = True
    ) -> Dict[str, Any]:
        """
        Synthesize QA context for LLM generation.
        
        Args:
            question: The original question
            answer_spans: List of extracted answer spans
            include_passages: Whether to include full passages
            
        Returns:
            Structured context for LLM
        """
        if not answer_spans:
            return {
                "question": question,
                "extracted_answers": [],
                "context_summary": "No relevant answer spans found.",
                "confidence_scores": []
            }
        
        # Prepare extracted answers
        extracted_answers = []
        confidence_scores = []
        
        for i, span in enumerate(answer_spans):
            answer_info = {
                "rank": i + 1,
                "answer": span["answer_text"],
                "confidence": span["confidence"],
                "context": span.get("context_window", ""),
                "source_passage": span.get("passage_index", -1)
            }
            
            if include_passages:
                answer_info["full_passage"] = span.get("passage_text", "")
            
            extracted_answers.append(answer_info)
            confidence_scores.append(span["confidence"])
        
        # Create context summary
        top_answer = answer_spans[0]["answer_text"]
        avg_confidence = np.mean(confidence_scores)
        
        context_summary = (
            f"Found {len(answer_spans)} potential answer(s). "
            f"Top answer: '{top_answer}' (confidence: {answer_spans[0]['confidence']:.3f}). "
            f"Average confidence: {avg_confidence:.3f}."
        )
        
        return {
            "question": question,
            "extracted_answers": extracted_answers,
            "context_summary": context_summary,
            "confidence_scores": confidence_scores,
            "top_answer": top_answer,
            "answer_count": len(answer_spans)
        }
    
    def update_confidence_threshold(self, new_threshold: float):
        """Update the confidence threshold for answer extraction."""
        self.confidence_threshold = new_threshold
        logger.info(f"Updated confidence threshold to {new_threshold}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded QA model."""
        return {
            "model_name": self.model_name,
            "device": str(self.device),
            "confidence_threshold": self.confidence_threshold,
            "max_answer_length": self.max_answer_length,
            "top_k_answers": self.top_k_answers
        }