import React, { useState } from 'react';

interface PDFChatPageProps {
  onBack: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  json: string;
  suggestions: string[];
}

const PDFChatPage: React.FC<PDFChatPageProps> = ({ onBack }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPdfFile(file);
      
      // Handle file upload and chat initialization logic here
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call the API to get the assistant's response
      const response: ChatResponse = await fetchChatResponse(inputValue);
      
      // Handle the response and update the chat messages
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.json };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-600 p-8">
      <button 
        onClick={onBack}
        className="mb-4 flex items-center text-white hover:underline"
      >
        ← Back to Home
      </button>

      <div className="flex justify-center">
        <div className="w-full max-w-4xl bg-teal-500 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-center text-white mb-6">PDF Chat</h2>
          
          <div className="flex items-center justify-center">
            <div className="bg-teal-400 p-10 rounded-lg w-full max-w-md text-center">
              <p className="text-white mb-4">
                {isLoading ? 'Processing...' : 'Upload a PDF file to start chatting'}
              </p>
              
              <input 
                type="file" 
                accept=".pdf" 
                id="pdf-upload" 
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              
              <label 
                htmlFor="pdf-upload" 
                className={`px-4 py-2 rounded cursor-pointer ${
                  isLoading 
                    ? 'bg-gray-300 text-gray-500' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isLoading ? 'Processing...' : 'Browse'}
              </label>
            </div>
          </div>
          
          {/* Chat messages display */}
          <div className="mt-6 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          
          {/* User input and send button */}
          <div className="mt-4 flex">
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 p-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              className="px-4 py-2 rounded-r-lg bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-300"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFChatPage;
