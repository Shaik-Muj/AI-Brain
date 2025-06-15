# AI-Brain Technical Documentation

## Tech Stack Overview

### Frontend Technologies
- **Framework**: React (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PDF Processing**: react-pdf v4.8.69
- **Routing**: React Router v6
- **State Management**: React Hooks (useState, useEffect, useRef)
- **API Communication**: Fetch API
- **UUID Generation**: uuid v4

### Backend Technologies
- **Framework**: FastAPI (Python)
- **PDF Processing**: 
  - PyMuPDF (fitz) for text extraction
  - pytesseract for OCR capabilities
  - PIL (Python Imaging Library) for image processing
- **Vector Storage**: LangChain with Azure OpenAI Embeddings
- **LLM Integration**:
  - OpenAI API
  - Ollama
  - Gemma
  - LLaMa
- **Memory Management**: Custom implementation (memory.py)

## Core Features & Implementation

### 1. PDF Viewer Component
- **Component**: `SimplePDFViewer.tsx`
- **Features**:
  - Configurable PDF.js worker (CDN-based)
  - Text selection and extraction
  - Error handling and retry mechanisms
  - Page navigation
  - Zoom controls
  - Loading states
- **Performance Optimizations**:
  - Memoized PDF options
  - Cached worker configuration
  - Lazy loading of pages
  - Cache-busting for PDF URLs

### 2. PDF Chat Interface
- **Component**: `PDFChatRedesigned.tsx`
- **Features**:
  - Real-time chat with context awareness
  - Automatic text selection to chat
  - Smart suggestions
  - Error boundaries
  - Responsive design
- **Integration**:
  - Direct connection to backend LLM
  - Vector store for context retrieval
  - Memory management for conversation history

### 3. Backend PDF Processing
- **Module**: `pdf_router.py`
- **Features**:
  - PDF upload handling
  - Text extraction
  - OCR for scanned documents
  - Vector embeddings generation
  - Smart chunking and context management

### 4. LLM Integration
- **Architecture**: Multi-model support
- **Providers**:
  - OpenAI
  - Ollama
  - Gemma
  - LLaMa
- **Features**:
  - Model fallback
  - Context-aware responses
  - Stream processing
  - Error handling

### 5. Vector Store Implementation
- **Technology**: LangChain with Azure OpenAI
- **Features**:
  - Document embeddings
  - Semantic search
  - Context retrieval
  - Query optimization

## API Endpoints

### PDF Operations
```python
POST /pdf/upload
GET /pdf/get-pdf/{pdf_id}
POST /pdf/chat
GET /pdf/summary/{pdf_id}
```

### Chat Operations
```python
POST /chat/message
GET /chat/suggestions
POST /chat/context
```

## Performance Metrics

1. PDF Processing
- Initial load time: < 2 seconds
- Page rendering: < 500ms
- Text extraction: < 100ms

2. Chat Response
- First response: < 3 seconds
- Follow-up responses: < 1 second
- Context retrieval: < 500ms

3. Memory Usage
- Frontend: < 100MB
- Backend worker: < 200MB per instance
- Vector store: Scales with document size

## Environment Configuration

### Frontend
```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEBUG_LOGS=true
```

### Backend
```python
PDF_STORAGE_PATH=./temp_pdfs
VECTOR_DB_PATH=./vector_dbs
MODEL_CACHE_PATH=./model_cache
LOG_LEVEL=INFO
```

## Testing and Quality Assurance

1. Frontend Tests
- Unit tests for components
- Integration tests for PDF viewing
- End-to-end tests for chat flow

2. Backend Tests
- API endpoint tests
- PDF processing validation
- LLM integration tests

## Deployment Considerations

1. Frontend
- Static file hosting
- CDN for PDF.js worker
- Environment configuration
- Build optimization

2. Backend
- FastAPI deployment
- PDF storage management
- Vector store scaling
- Model caching

## Security Measures

1. PDF Processing
- File type validation
- Size limits
- Malware scanning
- Secure storage

2. API Security
- CORS configuration
- Rate limiting
- Input validation
- Error handling

## Monitoring and Logging

1. Frontend
- Console logging
- Error tracking
- Performance monitoring
- User interaction tracking

2. Backend
- Request logging
- Error tracking
- Performance metrics
- Resource utilization

## Future Improvements

1. Performance
- Worker threading for PDF processing
- Caching layer for frequent requests
- Optimized vector search
- Response streaming

2. Features
- Batch PDF processing
- Advanced OCR capabilities
- Multi-language support
- Document comparison

3. Integration
- Additional LLM providers
- External storage providers
- Authentication systems
- Analytics integration
