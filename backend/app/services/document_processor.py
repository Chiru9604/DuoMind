import os
import tempfile
from typing import List, Tuple
from PyPDF2 import PdfReader
from docx import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
        )
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            raise ValueError(f"Error reading PDF: {str(e)}")
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise ValueError(f"Error reading DOCX: {str(e)}")
    
    def process_file(self, file_content: bytes, filename: str) -> Tuple[str, List[str]]:
        """Process uploaded file and return text and chunks"""
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name
        
        try:
            # Extract text based on file type
            if filename.lower().endswith('.pdf'):
                text = self.extract_text_from_pdf(tmp_path)
            elif filename.lower().endswith('.docx'):
                text = self.extract_text_from_docx(tmp_path)
            else:
                raise ValueError("Unsupported file type. Only PDF and DOCX are supported.")
            
            # Clean and preprocess text
            text = self._preprocess_text(text)
            
            # Split into chunks with enhanced strategy
            chunks = self._create_enhanced_chunks(text, filename)
            return text, chunks
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_path)
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess extracted text"""
        # Remove excessive whitespace while preserving structure
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Strip whitespace but keep non-empty lines
            cleaned_line = line.strip()
            if cleaned_line:
                cleaned_lines.append(cleaned_line)
            elif cleaned_lines and cleaned_lines[-1]:  # Preserve paragraph breaks
                cleaned_lines.append('')
        
        return '\n'.join(cleaned_lines)
    
    def _create_enhanced_chunks(self, text: str, filename: str) -> List[str]:
        """Create chunks with enhanced context preservation"""
        # First, try to split by natural document structure
        sections = self._split_by_structure(text)
        
        chunks = []
        for i, section in enumerate(sections):
            if len(section) <= settings.chunk_size:
                # Section fits in one chunk
                chunks.append(section)
            else:
                # Section needs to be split further
                section_chunks = self.text_splitter.split_text(section)
                
                # Add context headers to maintain document structure
                for j, chunk in enumerate(section_chunks):
                    if len(sections) > 1:  # Multi-section document
                        enhanced_chunk = f"[Document: {filename} - Section {i+1}, Part {j+1}]\n\n{chunk}"
                    else:  # Single section document
                        enhanced_chunk = f"[Document: {filename} - Part {j+1}]\n\n{chunk}"
                    chunks.append(enhanced_chunk)
        
        return chunks
    
    def _split_by_structure(self, text: str) -> List[str]:
        """Split text by natural document structure (paragraphs, sections)"""
        # Split by double newlines (paragraph breaks)
        paragraphs = text.split('\n\n')
        
        sections = []
        current_section = []
        current_length = 0
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
                
            # If adding this paragraph would exceed chunk size, start new section
            if current_length + len(paragraph) > settings.chunk_size and current_section:
                sections.append('\n\n'.join(current_section))
                current_section = [paragraph]
                current_length = len(paragraph)
            else:
                current_section.append(paragraph)
                current_length += len(paragraph) + 2  # +2 for \n\n
        
        # Add the last section
        if current_section:
            sections.append('\n\n'.join(current_section))
        
        return sections if sections else [text]