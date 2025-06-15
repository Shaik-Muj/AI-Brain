const API_BASE_URL = 'http://localhost:8000/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  model: string;
}

export interface PDFUploadResponse {
  message: string;
  file_id: string;
}

export interface ImageAnalysisResponse {
  caption: string;
  confidence: number;
}

export interface YouTubeSummaryResponse {
  summary: string;
  title: string;
  duration: string;
  transcript?: string;
}

class APIService {
  // Chat with AI models
  async chatWithModel(messages: ChatMessage[], model: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chat response');
    }

    return response.json();
  }

  // Upload and process PDF
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }

    return response.json();
  }
  
  // Chat with PDF
  async chatWithPDF(fileId: string, question: string): Promise<ChatResponse> {
    try {
      // Add timeout to the fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`http://localhost:8000/pdf/ask-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdf_id: fileId, 
          question: question
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if successful
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error in chatWithPDF API call:", error);
      // Return a valid ChatResponse with error information
      return { 
        response: error?.name === 'AbortError' 
          ? "Request timed out. Please try again."
          : `Error: ${error?.message || "Failed to get response from server"}`,
        model: "error-handler"
      };
    }
  }

  // Analyze image (FIX: use correct backend endpoint and field name)
  async analyzeImage(file: File): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file); // Must be 'file' to match FastAPI

    const response = await fetch('http://localhost:8000/multimodal/analyze-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    return response.json();
  }
  
  // Summarize YouTube video (now with LLM summarization)
  async summarizeYouTube(url: string): Promise<YouTubeSummaryResponse> {
    const formData = new FormData();
    formData.append('video_url', url);
    
    try {
      // Set a longer timeout for the fetch request (default browser timeout may be too short)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
      
      const response = await fetch('http://localhost:8000/multimodal/extract-from-video-summarize', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Return summary and transcript with metadata
      return { 
        summary: data.summary, 
        transcript: data.transcript, 
        title: data.title || '', 
        duration: data.duration || '' 
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The video may be too long to process.');
      }
      throw error;
    }
  }
}

export const apiService = new APIService();
