import time
import logging
from typing import List, Dict, Any
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from app.models.schemas import ChatMode
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name="llama3-8b-8192",
            temperature=0.1,
            timeout=settings.timeout_seconds
        )
        self.fallback_llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name=settings.fallback_model,
            temperature=0.1,
            timeout=settings.timeout_seconds
        )
    
    def get_normal_prompt(self, context: str, query: str) -> List[Dict[str, str]]:
        """Generate prompt for normal mode with enhanced structured response format"""
        system_prompt = """You are a precise research assistant that provides structured, document-grounded answers following a specific template.

CRITICAL RULES:
- Base answers ONLY on the provided document context
- Never add external knowledge or assumptions
- If information isn't in the documents, clearly state this
- Use active voice and maintain academic tone
- Keep responses factual and evidence-based

🧩 REQUIRED RESPONSE FORMAT:

**1. Summary**
→ Briefly answer the question directly (aim for 2-3 sentences)
→ Avoid filler words like "According to the document"
→ Mention the key insight or finding clearly

**2. Explanation**
→ Expand on the summary using document evidence (write 3-5 short paragraphs)
→ Quote short fragments naturally and integrate them
→ Explain *why or how* — not just *what*
→ Combine multiple relevant sections into one cohesive explanation
→ Keep paragraphs short (2–3 lines each)

**3. Key Technical Details**
→ Mention any numerical or structural details from the documents:
   • Numbers, measurements, dimensions
   • Technical specifications or parameters
   • Mechanisms, processes, or methodologies
→ Use bullet points for clarity

**4. Limitations or Missing Info**
→ If the answer cannot be fully derived from the document, clearly say so
→ Suggest where in the document this might be partially addressed

**5. Closing Summary**
→ End with a one-line synthesis — the "so what?" moment

✅ STYLE RULES:
- Use active voice
- Keep paragraphs short (2–3 lines each)
- Avoid repeating section names excessively
- Never add external information not found in the document
- Always paraphrase instead of copying long quotes
- Maintain academic but readable tone (no fluff)"""

        user_prompt = f"""Context from documents:
{context}

Question: {query}

Please provide a structured answer following the exact template format specified in the system prompt."""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    
    def get_pro_prompt(self, context: str, query: str) -> List[Dict[str, str]]:
        """Generate prompt for pro mode with conversational AI and critical thinking capabilities"""
        system_prompt = """You are DuoMind Pro - an intelligent conversational AI that engages users in deep, thought-provoking discussions based on document context.

🧠 YOUR PERSONALITY & APPROACH:
- Think like a brilliant mentor who challenges assumptions
- Be conversational, sometimes witty, occasionally provocative
- Engage in Socratic dialogue - question to make users think deeper
- Don't just agree - critically analyze and sometimes respectfully disagree
- Point out logical gaps, offer alternatives, suggest "what if" scenarios
- Make users see multiple perspectives they hadn't considered

🎯 CORE MISSION:
- Ground ALL responses in the provided document context (no hallucination)
- Interpret context deeply, don't just summarize
- Analyze user queries logically and respond thoughtfully
- Challenge users' thinking when appropriate
- Generate multi-perspective insights that expand their worldview

🗣️ CONVERSATIONAL BEHAVIOR:
- **Context Awareness**: Every thought must be traceable to the retrieved context
- **Critical Thinking**: Interpret, critique, and analyze - don't just report facts
- **Socratic Dialogue**: Ask probing questions that challenge assumptions
- **Adaptive Tone**: Be conversational, sometimes challenging, always respectful
- **Meta-Cognition**: Reflect on reasoning ("That could work, but consider this...")

🧩 RESPONSE STRUCTURE:

**1. Core Insight**
→ Provide your analytical take on the question (aim for 2-3 sentences)
→ Go beyond surface facts - what's the deeper meaning?
→ Set the tone: agreeable, challenging, or thought-provoking

**2. Document-Grounded Analysis**
→ Build your argument using document evidence (write 3-5 short paragraphs)
→ Quote key fragments naturally and interpret their significance
→ Connect concepts across different sections
→ Explain the "why" and "how" behind the facts
→ Show relationships and implications the user might have missed

**3. Critical Perspectives**
→ This is where you challenge and expand thinking:
   • "But have you considered..."
   • "What if we looked at this differently..."
   • "Your assumption might be flawed because..."
   • "An alternative interpretation could be..."
   • "The implications go deeper than that..."
→ Use conversational language, not bullet points
→ Be respectful but intellectually honest

**4. Technical Synthesis**
→ Connect technical details to broader concepts:
   • How do the numbers/specs relate to real-world impact?
   • What do patterns suggest about underlying mechanisms?
   • How might technical limitations affect practical applications?

**5. Reflective Questions**
→ End with thought-provoking questions that make the user think:
   • "What if..." scenarios
   • "How might this change if..."
   • "What assumptions are we making here?"
   • "Have you considered the implications for..."
→ Make them question their own thinking

**6. Strategic Insight**
→ Synthesize the key takeaway with a forward-looking perspective
→ Focus on "so what?" and broader significance
→ Sometimes challenge the user's original question itself

🎨 CONVERSATION STYLE:
- Use "you" and "we" to create dialogue
- Vary sentence structure - mix short punchy statements with longer explanations
- Be intellectually curious and slightly provocative
- Show your reasoning process: "Here's what I'm thinking..."
- Don't be afraid to respectfully disagree or point out flaws
- Ask questions that make users reconsider their assumptions
- Use phrases like "But wait...", "Here's the thing...", "Consider this..."

⚠️ CRITICAL CONSTRAINTS:
- NEVER add information not derivable from the document context
- Always trace your insights back to specific document evidence
- If you disagree or challenge, explain why based on the context
- Distinguish clearly between documented facts and your interpretations
- Stay within the bounds of what the documents actually support"""

        user_prompt = f"""Context from documents:
{context}

User Query: {query}

Engage with this query as DuoMind Pro. Analyze the context deeply, provide your insights, challenge assumptions where appropriate, and make the user think from multiple perspectives. Remember to stay grounded in the document context while being conversational and thought-provoking."""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=4, max=10))
    def generate_response(self, messages: List, use_fallback: bool = False) -> str:
        """Generate response with retry logic and fallback"""
        try:
            llm = self.fallback_llm if use_fallback else self.llm
            response = llm.invoke(messages)
            return response.content
        except Exception as e:
            if not use_fallback:
                # Try with fallback model
                return self.generate_response(messages, use_fallback=True)
            raise e

    def generate_streaming_response(self, messages: List, use_fallback: bool = False):
        """Generate streaming response with token-by-token output"""
        try:
            llm = self.fallback_llm if use_fallback else self.llm
            
            # Use the stream method for token-by-token generation
            for chunk in llm.stream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    yield chunk.content
                    # Add a small delay to slow down token generation for better readability
                    time.sleep(0.05)  # 50ms delay between tokens
                    
        except Exception as e:
            if not use_fallback:
                # Try with fallback model
                yield from self.generate_streaming_response(messages, use_fallback=True)
            else:
                yield f"Error: {str(e)}"
    
    def query(self, query: str, mode: ChatMode) -> Dict[str, Any]:
        """Process RAG query with specified mode and enhanced context merging"""
        start_time = time.time()
        
        try:
            # Retrieve relevant documents with increased top_k for better coverage
            documents = self.vector_store.similarity_search(query, k=max(settings.top_k_chunks, 5))
            
            if not documents:
                return {
                    "answer": "No relevant documents found. Please upload some documents first.",
                    "mode": mode,
                    "sources": [],
                    "processing_time": time.time() - start_time
                }
            
            # Enhanced context merging: Group related chunks and merge logically
            context_parts = []
            sources = []
            
            # Group documents by similarity and merge related content
            merged_sections = self._merge_related_chunks(documents)
            
            for i, section in enumerate(merged_sections):
                context_parts.append(f"[Document Section {i+1}]\n{section['content']}")
                
                # Collect all sources from merged chunks
                section_sources = []
                for metadata in section['metadata_list']:
                    filename = metadata.get('filename', 'Unknown Document')
                    chunk_id = metadata.get('chunk_id', 0)
                    section_sources.append(f"{filename} (Chunk {chunk_id + 1})")
                
                # Create a consolidated source reference
                if len(section_sources) == 1:
                    sources.append(section_sources[0])
                else:
                    sources.append(f"Multiple sections: {', '.join(section_sources[:3])}")
            
            context = "\n\n".join(context_parts)
            
            # Generate prompt based on mode
            if mode == ChatMode.NORMAL:
                messages = self.get_normal_prompt(context, query)
            else:  # PRO mode
                messages = self.get_pro_prompt(context, query)
            
            # Generate response
            answer = self.generate_response(messages)
            
            return {
                "answer": answer,
                "mode": mode,
                "sources": sources,
                "processing_time": time.time() - start_time
            }
            
        except Exception as e:
            # Check if it's an API key related error
            error_message = str(e)
            if "api_key" in error_message.lower() or "unauthorized" in error_message.lower() or "authentication" in error_message.lower():
                return {
                    "answer": "Error: Invalid or missing Groq API key. Please check your .env file and ensure you have a valid Groq API key set. You can get one from https://console.groq.com/keys",
                    "mode": mode,
                    "sources": [],
                    "processing_time": time.time() - start_time
                }
            
            return {
                "answer": f"Error processing query: {str(e)}",
                "mode": mode,
                "sources": [],
                "processing_time": time.time() - start_time
            }
    
    def _merge_related_chunks(self, documents: List[Dict]) -> List[Dict]:
        """Merge related document chunks for better context coherence"""
        if not documents:
            return []
        
        # For now, implement a simple grouping by filename and proximity
        # This can be enhanced with more sophisticated similarity measures
        
        merged_sections = []
        current_section = {
            'content': documents[0]['content'],
            'metadata_list': [documents[0].get('metadata', {})]
        }
        
        for i in range(1, len(documents)):
            doc = documents[i]
            prev_metadata = current_section['metadata_list'][-1]
            curr_metadata = doc.get('metadata', {})
            
            # Check if chunks are from the same document and potentially related
            same_file = (prev_metadata.get('filename') == curr_metadata.get('filename'))
            chunk_proximity = abs(
                curr_metadata.get('chunk_id', 0) - prev_metadata.get('chunk_id', 0)
            ) <= 2  # Merge if chunks are within 2 positions of each other
            
            if same_file and chunk_proximity and len(current_section['content']) < 2000:
                # Merge with current section
                current_section['content'] += f"\n\n{doc['content']}"
                current_section['metadata_list'].append(curr_metadata)
            else:
                # Start new section
                merged_sections.append(current_section)
                current_section = {
                    'content': doc['content'],
                    'metadata_list': [curr_metadata]
                }
        
        # Add the last section
        merged_sections.append(current_section)
        
        return merged_sections

    def query_streaming(self, query: str, mode: ChatMode):
        """Process RAG query with streaming response"""
        start_time = time.time()
        
        try:
            # Retrieve relevant documents with increased top_k for better coverage
            documents = self.vector_store.similarity_search(query, k=max(settings.top_k_chunks, 5))
            
            if not documents:
                yield {
                    "type": "error",
                    "content": "No relevant documents found. Please upload some documents first.",
                    "mode": mode,
                    "sources": [],
                    "processing_time": time.time() - start_time
                }
                return
            
            # Enhanced context merging: Group related chunks and merge logically
            context_parts = []
            sources = []
            
            # Group documents by similarity and merge related content
            merged_sections = self._merge_related_chunks(documents)
            
            for i, section in enumerate(merged_sections):
                context_parts.append(f"[Document Section {i+1}]\n{section['content']}")
                
                # Collect all sources from merged chunks
                section_sources = []
                for metadata in section['metadata_list']:
                    filename = metadata.get('filename', 'Unknown Document')
                    chunk_id = metadata.get('chunk_id', 0)
                    section_sources.append(f"{filename} (Chunk {chunk_id + 1})")
                
                # Create a consolidated source reference
                if len(section_sources) == 1:
                    sources.append(section_sources[0])
                else:
                    sources.append(f"Multiple sections: {', '.join(section_sources[:3])}")
            
            context = "\n\n".join(context_parts)
            
            # Generate prompt based on mode
            if mode == ChatMode.NORMAL:
                messages = self.get_normal_prompt(context, query)
            else:  # PRO mode
                messages = self.get_pro_prompt(context, query)
            
            # Send metadata first
            yield {
                "type": "metadata",
                "mode": mode,
                "sources": sources,
                "processing_time": time.time() - start_time
            }
            
            # Stream the response
            for chunk in self.generate_streaming_response(messages):
                yield {
                    "type": "token",
                    "content": chunk
                }
            
            # Send completion signal
            yield {
                "type": "done",
                "processing_time": time.time() - start_time
            }
            
        except Exception as e:
            # Check if it's an API key related error
            error_message = str(e)
            if "api_key" in error_message.lower() or "unauthorized" in error_message.lower() or "authentication" in error_message.lower():
                yield {
                    "type": "error",
                    "content": "Error: Invalid or missing Groq API key. Please check your .env file and ensure you have a valid Groq API key set. You can get one from https://console.groq.com/keys",
                    "mode": mode,
                    "sources": [],
                    "processing_time": time.time() - start_time
                }
            else:
                yield {
                    "type": "error",
                    "content": f"Error processing query: {str(e)}",
                    "mode": mode,
                    "sources": [],
                    "processing_time": time.time() - start_time
                }