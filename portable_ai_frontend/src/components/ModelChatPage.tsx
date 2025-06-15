import React, { useState } from 'react';
import type { ChatMessage } from '../types/chat';
import { apiService } from '../services/api';

interface ModelChatPageProps {
  initialQuery: string;
  onBack: () => void;
}

const ModelChatPage: React.FC<ModelChatPageProps> = ({ initialQuery, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Available models
  const models = [
    { id: 'gpt-3.5', name: 'GPT-3.5' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'claude', name: 'Claude' },
    { id: 'gemini', name: 'Gemini' }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.chatWithModel(newMessages, selectedModel);
      const assistantMessage: ChatMessage = {
        role: 'assistant', 
        content: response.response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Chat error:', err);
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

      <div className="bg-teal-500 p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="p-2 rounded-md w-full border border-gray-300"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-teal-600 rounded-lg p-4 h-96 overflow-y-auto mb-4 text-white">
          {messages.map((message, index) => (
            <div key={index} className={`mb-3 ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-center p-2">
              <span className="inline-block animate-pulse">Processing...</span>
            </div>
          )}
          {error && (
            <div className="text-center p-2 text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="THIS IS THE QUERY THAT I TYPED"
            className="flex-grow p-3 rounded-l-lg border-none"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelChatPage;
