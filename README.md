# DuoMind - Dual-Mode RAG Chat Application

![DuoMind Landing Page](screenshots/landing-page.svg)

A powerful chat application that allows users to interact with their documents in two distinct modes. DuoMind transforms how you engage with your PDFs and DOCX files through intelligent conversation.

## 🌟 Features

- **📄 Document Processing**: Upload and process PDF/DOCX files with intelligent text extraction
- **🧠 Dual Chat Modes**: 
  - **Normal Mode**: Factual, grounded answers directly from your documents
  - **Pro Mode**: Creative, perspective-driven reasoning that goes beyond the text
- **💬 Context-Aware Chat**: Intelligent responses powered by RAG (Retrieval-Augmented Generation)
- **🎨 Beautiful UI**: Clean, responsive interface with mode-specific themes
- **💾 Persistent History**: Your conversations are saved and persist across sessions
- **🔄 Seamless Mode Switching**: Toggle between modes without losing context
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **LangChain** - Framework for developing applications with LLMs
- **Groq LLM API** - High-performance language model inference
- **ChromaDB** - Vector database for document embeddings
- **PyPDF2 / python-docx** - Document processing libraries

### Frontend
- **React** - Modern JavaScript library for building user interfaces
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Axios** - HTTP client for API communication

## 🛠️ Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Groq API Key ([Get one here](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chiru9604/DuoMind.git
   cd DuoMind
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # Add your GROQ_API_KEY
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` and start chatting with your documents!

## 📁 Project Structure

```
DuoMind/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── data/               # Document storage
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/          # State management
│   │   ├── api/            # API client
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
└── screenshots/            # UI screenshots
```

## 🎯 How It Works

1. **Upload Documents**: Drag and drop your PDF or DOCX files
2. **Choose Your Mode**: 
   - Select **Normal** for factual, document-based answers
   - Select **Pro** for creative analysis and insights
3. **Start Chatting**: Ask questions about your documents
4. **Get Intelligent Responses**: Powered by advanced RAG technology
