# DuoMind - Advanced Dual-Mode RAG Chat Application

DuoMind is a sophisticated document intelligence platform that revolutionizes how you interact with your documents. Built with cutting-edge AI technology, it offers dual conversation modes and advanced retrieval capabilities for comprehensive document analysis.

## 🌟 Key Features

### 🧠 Dual Intelligence Modes
- **Normal Mode**: Factual, grounded responses directly from document content
- **Pro Mode**: Creative analysis, insights, and perspective-driven reasoning that extends beyond the text

### 🔍 Advanced Retrieval System
- **Hybrid Retrieval**: Combines semantic vector search with BM25+ keyword matching
- **Dynamic Fusion Weights**: Mode-specific optimization for retrieval accuracy
- **Multi-Document Support**: Query across multiple uploaded documents simultaneously
- **Intelligent Chunking**: Smart text segmentation for optimal context retrieval

### 📄 Document Processing
- **Multi-Format Support**: PDF and DOCX file processing
- **Intelligent Text Extraction**: Advanced parsing with metadata preservation
- **Document Management**: Upload, view, and manage your document library
- **Active Document Selection**: Choose which documents to include in conversations

### 💬 Conversational AI
- **Context-Aware Responses**: Maintains conversation history and context
- **Streaming Responses**: Real-time response generation for better UX
- **Session Management**: Persistent chat sessions with full history
- **Source Attribution**: Responses include relevant document excerpts

### 🎨 User Experience
- **Modern UI/UX**: Clean, responsive interface with mode-specific themes
- **Real-time Updates**: Live document processing status and chat updates
- **Mobile Responsive**: Optimized for all device sizes
- **Accessibility**: Built with accessibility best practices

## 🚀 Tech Stack

### Backend Architecture
- **FastAPI** - High-performance async web framework with automatic API documentation
- **LangChain** - Advanced framework for LLM application development
- **Groq LLM API** - Ultra-fast language model inference with optimized hardware
- **ChromaDB** - High-performance vector database for semantic search
- **Advanced Retrieval Components**:
  - **Hybrid Retriever**: Custom implementation combining multiple search strategies
  - **BM25+ Algorithm**: Enhanced keyword-based retrieval with improved scoring
  - **DPR (Dense Passage Retrieval)**: Neural retrieval for semantic understanding
  - **Dynamic Fusion**: Intelligent weight adjustment based on query characteristics
- **Document Processing**: PyPDF2, python-docx for multi-format text extraction
- **Vector Embeddings**: Sentence-transformers for high-quality text representations

### Frontend Architecture
- **React 18** - Modern component-based UI library with concurrent features
- **TypeScript** - Type-safe development with enhanced IDE support
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **State Management**:
  - **Zustand** - Lightweight, scalable state management
  - **React Query** - Server state management and caching
- **Real-time Communication**: Axios with streaming support for live responses
- **Component Architecture**: Modular, reusable components with proper separation of concerns

### Infrastructure & DevOps
- **Environment Management**: Python virtual environments, Node.js package management
- **API Design**: RESTful endpoints with OpenAPI/Swagger documentation
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance Optimization**: Code splitting, lazy loading, and efficient re-renders

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.8+** - Backend runtime environment
- **Node.js 16+** - Frontend development environment
- **Groq API Key** - Required for LLM inference ([Get one here](https://console.groq.com/))

### Quick Start Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Chiru9604/DuoMind.git
   cd DuoMind
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Configure environment variables
   cp .env.example .env
   # Edit .env and add your GROQ_API_KEY
   
   # Start the backend server
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start the development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

### Environment Configuration

Create a `.env` file in the backend directory with the following variables:
```env
GROQ_API_KEY=your_groq_api_key_here
CHROMA_PERSIST_DIRECTORY=./data/chroma_db
UPLOAD_DIRECTORY=./data/uploads
```

## 📁 Project Architecture

```
DuoMind/
├── backend/                    # FastAPI Backend Application
│   ├── app/
│   │   ├── api/               # API Route Handlers
│   │   │   ├── chat.py        # Chat endpoints and streaming
│   │   │   ├── document_management.py  # Document upload/management
│   │   │   ├── retrieval_info.py       # Retrieval system info
│   │   │   └── routes.py      # Main API router
│   │   ├── core/              # Core Configuration
│   │   │   ├── config.py      # Application settings
│   │   │   └── database.py    # Database connections
│   │   ├── models/            # Data Models & Schemas
│   │   │   └── schemas.py     # Pydantic models
│   │   └── services/          # Business Logic Layer
│   │       ├── advanced_hybrid_retriever.py  # Advanced RAG system
│   │       ├── bm25_plus.py   # Enhanced BM25 implementation
│   │       ├── dpr_retriever.py           # Dense passage retrieval
│   │       ├── hybrid_retriever.py        # Multi-strategy retrieval
│   │       ├── neural_qa.py   # Neural question answering
│   │       ├── rag_service.py # Main RAG orchestration
│   │       └── vector_store.py            # Vector database management
│   ├── data/                  # Data Storage
│   │   ├── chroma_db/         # Vector database files
│   │   └── uploads/           # Uploaded documents
│   ├── main.py                # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/                  # React Frontend Application
│   ├── src/
│   │   ├── components/        # React Components
│   │   │   ├── ActiveDocumentChips.tsx    # Document selection UI
│   │   │   ├── ChatApp.tsx    # Main chat interface
│   │   │   ├── ChatInput.tsx  # Message input component
│   │   │   ├── ChatMessage.tsx            # Message display
│   │   │   ├── DocumentSelector.tsx       # Document management
│   │   │   ├── LandingPage.tsx            # Welcome screen
│   │   │   ├── ModeToggle.tsx # Mode switching component
│   │   │   └── SessionSidebar.tsx         # Chat history sidebar
│   │   ├── store/             # State Management
│   │   │   ├── useChatStore.ts            # Chat state management
│   │   │   └── useSessionStore.ts         # Session management
│   │   ├── api/               # API Client Layer
│   │   │   └── client.ts      # HTTP client configuration
│   │   ├── types/             # TypeScript Definitions
│   │   │   └── index.ts       # Type definitions
│   │   ├── index.css          # Global styles
│   │   └── main.tsx           # React application entry point
│   ├── public/                # Static Assets
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.js     # Tailwind CSS configuration
└── README.md                  # Project documentation
```

## 🎯 How DuoMind Works

### 1. Document Processing Pipeline
- **Upload**: Drag and drop PDF/DOCX files through the intuitive interface
- **Extraction**: Advanced text extraction with metadata preservation
- **Chunking**: Intelligent text segmentation for optimal retrieval
- **Vectorization**: High-quality embeddings using sentence-transformers
- **Indexing**: Efficient storage in ChromaDB vector database

### 2. Dual-Mode Intelligence
- **Normal Mode**: 
  - Focuses on factual accuracy and direct document content
  - Uses conservative retrieval weights for precise answers
  - Ideal for research, fact-checking, and document analysis
- **Pro Mode**: 
  - Enables creative analysis and inferential reasoning
  - Uses enhanced retrieval weights for comprehensive context
  - Perfect for brainstorming, strategic analysis, and insights generation

### 3. Advanced Retrieval System
- **Hybrid Search**: Combines semantic similarity with keyword matching
- **Dynamic Fusion**: Automatically adjusts retrieval strategies based on query type
- **Multi-Document Querying**: Search across your entire document library
- **Context Optimization**: Smart context window management for relevant responses

### 4. Conversational Experience
- **Streaming Responses**: Real-time answer generation for immediate feedback
- **Session Persistence**: Conversations saved and accessible across sessions
- **Source Attribution**: Every response includes relevant document excerpts
- **Context Awareness**: Maintains conversation history for coherent dialogue

## 🔧 API Documentation

### Core Endpoints

#### Document Management
- `POST /api/upload` - Upload and process documents
- `GET /api/documents` - List all uploaded documents
- `DELETE /api/documents/{doc_id}` - Remove a document

#### Chat Interface
- `POST /api/chat` - Send a message and get response
- `POST /api/chat/stream` - Stream chat responses in real-time
- `GET /api/sessions` - Retrieve chat sessions
- `POST /api/sessions` - Create new chat session

#### System Information
- `GET /api/health` - Health check endpoint
- `GET /api/retrieval-info` - Get retrieval system configuration

### Request/Response Examples

**Upload Document:**
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"
```

**Chat Query:**
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key findings?",
    "mode": "normal",
    "session_id": "session_123",
    "active_documents": ["doc_1", "doc_2"]
  }'
```

## 🤝 Contributing

We welcome contributions to DuoMind! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- **Backend**: Follow PEP 8 Python style guidelines
- **Frontend**: Use TypeScript strict mode and ESLint configuration
- **Testing**: Write unit tests for new features
- **Documentation**: Update README and inline documentation

## 🙏 Acknowledgments

- **Groq** for providing high-performance LLM inference
- **LangChain** for the comprehensive LLM framework
- **ChromaDB** for efficient vector storage and retrieval
- **React** and **FastAPI** communities for excellent documentation and support

