export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[]; // Add this property
}

export interface ChatResponse {
  message: string;
  json?: any; // Add this property
}
