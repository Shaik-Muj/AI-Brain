import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[]; // Optional: to store suggestions for an assistant message
}

interface PDFChatRedesignedProps {
  pdfText: string;
}

const PDFChatRedesigned: React.FC<PDFChatRedesignedProps> = ({ pdfText }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState("");
  // const [showSuggestions, setShowSuggestions] = useState(true); // Removed
  const [loading, setLoading] = useState(false);
  const [numSuggestions, setNumSuggestions] = useState(3);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // No longer need separate dynamicSuggestions state, will attach to message

  // Generate user ID
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const fetchSuggestions = async (queryText: string, contextText: string): Promise<string[]> => {
    try {
      const response = await fetch("http://localhost:8000/pdf/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          context: contextText,
          // types: ["follow_up", "related"] // Optional: specify suggestion types if needed
        }),
      });
      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return []; // Return empty array on error
    }
  };

  // Send message to backend
  const sendMessage = async (messageContent?: string) => {
    console.log("sendMessage called. Current pdfText prop value:", pdfText); // Log pdfText

    if (!pdfText || !pdfText.trim()) {
      const errorMsg: Message = {
        role: "assistant",
        content: "Error: PDF text is missing. Please ensure a PDF is loaded and processed correctly.",
      };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
      return;
    }

    const currentInput = messageContent || input;
    if (!currentInput.trim()) return;
    
    const userMessage: Message = { role: "user", content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    if (!messageContent) setInput(""); // Clear input only if it's not from a suggestion click
    
    try {
      const response = await fetch("http://localhost:8000/pdf/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          pdfText,
          userId,
        }),
      });
      
      const data = await response.json();

      let assistantResponseContent: string;
      if (data.error) {
        assistantResponseContent = `Error: ${data.error}`;
      } else {
        assistantResponseContent = data.answer || "I couldn\'t find an answer to that.";
      }
      
      // Fetch suggestions: if assistant couldn't find an answer or there was an error, base suggestions on user's query.
      let suggestionQuery = assistantResponseContent;
      if (data.error || assistantResponseContent === "I couldn\'t find an answer to that.") {
        suggestionQuery = currentInput; // Use user's last query for suggestions
      }
      const fetchedSuggestions = await fetchSuggestions(suggestionQuery, pdfText);
      
      const aiMessage: Message = {
        role: "assistant",
        content: assistantResponseContent,
        suggestions: fetchedSuggestions 
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = { 
        role: "assistant", 
        content: "Sorry, there was an error processing your request." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // setInput(""); // Moved up to clear input earlier for user-typed messages
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    // setInput(suggestion); // No longer setting input, directly sending
    sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat header */}
      <div className="p-3 border-b bg-blue-600 text-white rounded-t-lg">
        <h2 className="text-lg font-semibold">PDF Assistant</h2>
        {/* Slider for number of recommendations */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="numSuggestions" style={{ fontSize: 13 }}>Suggestions:</label>
          <input
            id="numSuggestions"
            type="range"
            min={1}
            max={5}
            value={numSuggestions}
            onChange={e => setNumSuggestions(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span style={{ fontSize: 13 }}>{numSuggestions}</span>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.role === "assistant" ? (
              <div style={{
                marginBottom: 12,
                background: '#f8fafc',
                borderRadius: 8,
                boxShadow: '0 1px 2px #0001',
                padding: 0
              }}>
                {/* Assistant response */}
                <div className="p-3 rounded-t-lg bg-gray-100 text-gray-800 mr-8" style={{ fontSize: 15, minHeight: 60 }}>
                  {msg.content}
                </div>
                {/* Related/Recommendations section always at the bottom of assistant messages */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    background: '#f1f5f9',
                    padding: '12px 16px',
                    borderRadius: '0 0 8px 8px',
                    marginTop: 0
                  }}>
                    <div style={{ fontWeight: 600, color: '#2563eb', marginBottom: 6, fontSize: 14 }}>
                      Related
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.suggestions.slice(0, numSuggestions).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 5,
                            padding: '7px 10px',
                            fontSize: 13,
                            color: '#1e293b',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#e0e7ef'}
                          onMouseOut={e => e.currentTarget.style.background = '#fff'}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-2 p-2 rounded-lg bg-blue-100 text-blue-800 ml-8" style={{ fontSize: 14 }}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
        {loading && (
          <div className="p-3 bg-gray-50 rounded-lg animate-pulse" style={{ fontSize: 13 }}>
            Processing...
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the PDF..."
            className="flex-1 p-2 border rounded"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(); // Call without argument to use current input
              }
            }}
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => sendMessage()} // Call without argument
            disabled={!input.trim() || loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" // Changed to w-full
          >
            Send
          </button>
          {/* Removed Show/Hide Suggestions button */}
        </div>
      </div>
    </div>
  );
};

export default PDFChatRedesigned;
