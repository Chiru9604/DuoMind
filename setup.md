# DuoMind Setup Instructions

## Prerequisites
- Python 3.10+
- Node.js 16+
- Groq API Key (get from https://console.groq.com/)

## Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment:
   - Edit `.env` file
   - Replace `your_groq_api_key_here` with your actual Groq API key

6. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

Backend will be available at: http://localhost:8000

## Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

Frontend will be available at: http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Upload PDF or DOCX files using the paperclip icon or drag & drop
3. Switch between Normal and Pro modes using the toggle
4. Ask questions about your uploaded documents
5. Enjoy dual-mode responses!

## Features

- **Normal Mode**: Factual, grounded answers from documents
- **Pro Mode**: Creative reasoning and insights beyond the text
- **File Upload**: Support for PDF and DOCX files
- **Persistent Chat**: Messages saved in browser storage
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Comprehensive error messages and fallbacks

## Troubleshooting

- Ensure both backend and frontend are running
- Check that your Groq API key is valid
- Verify file formats are PDF or DOCX
- Check browser console for any errors