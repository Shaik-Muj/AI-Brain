import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { apiService } from '../services/api';
import SimplePDFViewer from './SimplePDFViewer';

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface PDFChatRedesignedProps {
  fileId: string;
  pdfUrl?: string;
}

// ErrorBoundary to catch rendering errors and prevent blank screens
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Log error
    console.error("ErrorBoundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-red-500 bg-[#1e293b] rounded-lg">Something went wrong. Please reload the page or try again later.</div>;
    }
    return this.props.children;
  }
}

const PDFChatRedesigned: React.FC<PDFChatRedesignedProps> = ({ fileId, pdfUrl }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [numSuggestions, setNumSuggestions] = useState(3);
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track if a message is currently being processed to prevent duplicate sends
  const [isProcessingSuggestion, setIsProcessingSuggestion] = useState(false);
  // Use a more robust solution with a ref to track suggestions being processed
  const processingRef = useRef(false);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Generate user ID
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId);
    }
  }, []);
  // Toggle PDF Viewer visibility - simplified viewer with no text selection
  const togglePdfViewer = () => {
    console.log("Toggling PDF viewer");
    setShowPdfViewer(prev => !prev);
  };
  
  const fetchSuggestions = async (queryText: string, contextText: string, randomSeed?: string): Promise<string[]> => {
    try {
      const response = await fetch("http://localhost:8000/pdf/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: queryText, 
          context: contextText, 
          num_suggestions: numSuggestions,
          pdf_id: fileId, // Include PDF ID to get more relevant recommendations
          random_seed: randomSeed // Add randomness to avoid repeated suggestions
        }),
      });
      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return [];
    }
  };
  
  // Send message to backend - with better error recovery
  const sendMessage = async (messageContent?: string): Promise<void> => {
    // Add defensive coding: Track if we're already in the middle of sending a message
    // This prevents duplicate calls if the function is called multiple times quickly
    if (loading) {
      console.warn("Already processing a message, ignoring duplicate request");
      return;
    }
    
    // Wrap entire function body in a try-catch to prevent unhandled exceptions
    try {
      // Validate inputs first
      if (!fileId || !fileId.trim()) {
        console.error("Missing fileId when sending message");
        const errorMsg: Message = {
          role: "assistant",
          content: "Error: PDF text is missing. Please ensure a PDF is loaded and processed correctly.",
        };
        setMessages(prev => [...prev, errorMsg]);
        setLoading(false);
        return;
      }
      
      const currentInput = messageContent || input;
      if (!currentInput.trim()) {
        console.warn("Empty message input, ignoring request");
        return;
      }
      
      console.log("Sending message to PDF chat:", { fileId, message: currentInput });
      
      // Only add the user message if it wasn't already added (in handleSuggestionClick)
      if (!messageContent || !messages.some(m => m.role === "user" && m.content === currentInput)) {
        const userMessage: Message = { role: "user", content: currentInput };
        setMessages(prev => [...prev, userMessage]);
      }
      
      setLoading(true);
      if (!messageContent) setInput("");
      
      // Call API with simpler approach
      try {
        console.log("Calling PDF chat API with:", { fileId, currentInput });
      } catch (err) {
        console.error("Error before API call:", err);
      }
      
      const data = await apiService.chatWithPDF(fileId, currentInput);
      console.log("Received response from PDF chat API:", data);
      
      // Process API response
      let assistantResponseContent: string;
      if ((data as any).error) {
        assistantResponseContent = `Error: ${(data as any).error}`;
      } else {
        assistantResponseContent = (data as any).answer || "I couldn't find an answer to that.";
      }
      
      // Create a more varied suggestion query based on the conversation context
      let suggestionQuery = assistantResponseContent;
      
      // Get the last few messages to provide more context for suggestions
      const recentMessages = messages.slice(-4).map(msg => msg.content).join(" ");
      
      // Include the current response and recent messages for more context
      if ((data as any).error || assistantResponseContent === "I couldn't find an answer to that.") {
        suggestionQuery = currentInput;
      } else {
        suggestionQuery = `${assistantResponseContent.substring(0, 200)} ${recentMessages}`;
      }
      
      // Add a random seed to help ensure varied suggestions
      const randomSeed = Math.floor(Math.random() * 1000);
      const fetchedSuggestions = await fetchSuggestions(
        suggestionQuery, 
        fileId,
        randomSeed.toString()
      );
      const aiMessage: Message = {
        role: "assistant",
        content: assistantResponseContent,
        suggestions: fetchedSuggestions
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Generate a more descriptive error message
      let errorContent = "Sorry, there was an error processing your request.";
      if (error instanceof Error) {
        errorContent += ` Details: ${error.message}`;
        console.error("Error stack:", error.stack);
      }
      
      const errorMessage: Message = {
        role: "assistant",
        content: errorContent
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    // Double protection: Check both state and ref to avoid race conditions
    if (!suggestion || typeof suggestion !== 'string' || isProcessingSuggestion || processingRef.current || loading) {
      console.warn("Skipping suggestion - invalid or already processing:", 
        {suggestion, isProcessingSuggestion, processingRef: processingRef.current, loading});
      return;
    }
    
    // Set input to the suggestion text to show what was selected
    setInput(suggestion);
    
    try {
      // Mark as processing to prevent duplicate clicks (both state and ref)
      setIsProcessingSuggestion(true);
      processingRef.current = true;
      
      // Create user message immediately to improve UI responsiveness
      const userMessage: Message = { role: "user", content: suggestion };
      setMessages(prev => [...prev, userMessage]);
      
      // Use a more robust approach without setTimeout (which can cause issues)
      // Request animation frame ensures we're in sync with browser's render cycle
      requestAnimationFrame(() => {
        sendMessage(suggestion)
          .catch((error: Error) => {
            console.error("Error processing suggestion:", error);
            // Show error to user
            const errorMsg: Message = {
              role: "assistant",
              content: `Error processing your question. Please try again. ${error.message || ''}`
            };
            setMessages(prev => [...prev, errorMsg]);
          })
          .finally(() => {
            // Always reset both processing indicators
            setIsProcessingSuggestion(false);
            processingRef.current = false;
          });
      });
    } catch (error) {
      console.error("Error in suggestion handler:", error);
      setIsProcessingSuggestion(false);
      processingRef.current = false;
    }
  };
  
  // Handle text selected from PDF
  const handlePdfTextSelect = (selectedText: string) => {
    setInput((prevInput) => {
      // If there's already text in the input, append with a space
      const prefix = prevInput.length > 0 ? prevInput + ' ' : '';
      return `${prefix}${selectedText}`;
    });
  };

  // Only show PDF viewer if pdfUrl is valid
  // Determine if we have a valid PDF URL or fileId to load from
  const isPdfUrlValid = Boolean(
    (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.trim().length > 0) || 
    (fileId && typeof fileId === 'string' && fileId.trim().length > 0)
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full bg-[#101624] rounded-lg shadow-lg border border-[#1e293b]">      
        {/* Enhanced Chat header */}
        <div className="p-5 border-b border-[#22304a] bg-gradient-to-r from-[#18213a] to-[#1e2a44] text-white rounded-t-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-[#ff5757]/20 to-[#ff5757]/5 rounded-lg p-2 mr-3 border border-[#ff5757]/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">PDF Assistant</h2>
                <p className="text-xs text-[#b6c2e0] mt-0.5">Ask questions about your document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePdfViewer}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-[#22304a] transition text-[#b6c2e0] hover:text-[#ff5757]"
                title={showPdfViewer ? "Hide PDF Viewer" : "Show PDF Viewer"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPdfViewer ? (
                    // Icon for hide PDF
                    <>
                      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                      <line x1="12" y1="4" x2="12" y2="20"></line>
                    </>
                  ) : (
                    // Icon for show PDF
                    <>
                      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                      <line x1="12" y1="4" x2="12" y2="20"></line>
                      <path d="M9 12h10"></path>
                    </>
                  )}
                </svg>
              </button>
              <div className="bg-gradient-to-r from-[#0e2329]/70 to-[#0e2329]/50 rounded-lg px-3 py-1.5 text-xs text-[#ff5757] border border-[#ff5757]/20 flex items-center">
                <span className="w-2 h-2 bg-[#ff5757] rounded-full mr-2 animate-pulse"></span>
                AI-powered
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 bg-[#0f141f] p-3 rounded-lg border border-[#22304a]/50">          
            <label htmlFor="numSuggestions" className="font-medium text-sm text-[#b6c2e0] flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              Suggestions:
            </label>
            <div className="flex-grow flex items-center gap-3">
              <input
                id="numSuggestions"
                type="range"
                min={1}
                max={5}
                value={numSuggestions}
                onChange={e => setNumSuggestions(Number(e.target.value))}
                className="w-full max-w-[180px] h-2 bg-[#22304a] rounded-lg appearance-none cursor-pointer accent-[#ff5757]"
              />
              <span className="text-sm font-medium text-[#ff5757] bg-[#0e2329] px-3 py-1 rounded-md min-w-[24px] text-center">{numSuggestions}</span>
            </div>        </div>
        </div>      {/* Split view container */}
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* PDF Viewer (conditionally rendered) */}
          {showPdfViewer && (
            <div 
              className="w-1/2 border-r border-[#22304a] overflow-hidden flex flex-col" 
              style={{ 
                maxHeight: 'calc(100vh - 250px)',
                minWidth: '480px' // Ensure minimum width for PDF viewer
              }}
            >
              {isPdfUrlValid ? (
                <SimplePDFViewer 
                  fileId={fileId} 
                  pdfUrl={pdfUrl}
                  onTextSelect={handlePdfTextSelect}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center text-red-500 bg-[#1e293b] p-6 rounded-lg">
                  PDF file could not be loaded. Please try re-uploading or check the file link.
                </div>
              )}
            </div>
          )}
            {/* Chat area */}
          <div className={`${showPdfViewer ? 'w-1/2' : 'w-full'} flex flex-col h-full`}>
            {/* Messages area with navigation - fixed height with scrolling */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#101624] scrollbar-thin scrollbar-thumb-[#22304a] scrollbar-track-[#101624]" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <div className="bg-[#131c2a]/70 rounded-lg border border-[#22304a] p-6 max-w-md w-full">
                    <div className="flex items-center mb-4">
                      <div className="bg-[#ff5757]/10 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </div>
                      <h3 className="text-white text-lg font-semibold">Start a conversation</h3>
                    </div>
                    <p className="text-[#b6c2e0] text-sm mb-4">
                      Ask questions about your document or select text from the PDF viewer to begin.
                    </p>
                    <div className="bg-[#101624] rounded-lg p-4 border border-[#22304a]">
                      <h4 className="text-[#ff5757] text-sm font-medium mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <path d="M14 2v6h6"></path>
                          <path d="M16 13H8"></path>
                          <path d="M16 17H8"></path>
                          <path d="M10 9H8"></path>
                        </svg>
                        Example questions
                      </h4>
                      <div className="space-y-2">
                        {[
                          "What is the main topic of this document?",
                          "Summarize the key points in bullet points",
                          "What are the conclusions of this paper?",
                          "Extract all tables and figures with descriptions"
                        ].map((question, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInput(question);
                              // Autofocus the input field after setting the value
                              const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                              if (inputElement) {
                                inputElement.focus();
                              }
                            }}
                            className="w-full text-left p-2 bg-[#18213a] hover:bg-[#22304a] rounded text-[#e0e6f0] text-sm transition-colors border border-[#22304a] hover:border-[#ff5757]/30"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isFirstAssistantMessage = msg.role === "assistant" && messages.findIndex(m => m.role === "assistant") === index;
                    const isLastAssistantMessage = msg.role === "assistant" && [...messages].reverse().findIndex(m => m.role === "assistant") === messages.length - 1 - index;

                    // Find previous and next assistant messages for navigation
                    const prevAssistantIndex = messages.slice(0, index).reverse().findIndex(m => m.role === "assistant");
                    const hasPrevAssistant = prevAssistantIndex !== -1;
                    const prevAssistantActualIndex = hasPrevAssistant ? index - 1 - prevAssistantIndex : -1;

                    const nextAssistantIndex = messages.slice(index + 1).findIndex(m => m.role === "assistant");
                    const hasNextAssistant = nextAssistantIndex !== -1;
                    const nextAssistantActualIndex = hasNextAssistant ? index + 1 + nextAssistantIndex : -1;
                    
                    return (
                      <div key={index} id={`message-${index}`} className="mb-4 relative">
                        {msg.role === "assistant" ? (
                          <div className="bg-gradient-to-b from-[#172033] to-[#141c2d] rounded-lg shadow-lg border border-[#22304a] overflow-hidden">
                            {/* Assistant header */}
                            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-[#1e293b] to-[#192334] border-b border-[#22304a]">
                              <div className="flex items-center">
                                <div className="bg-[#0e2329]/70 p-1 rounded-full mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="m4.93 4.93 4.24 4.24"></path>
                                    <path d="m14.83 9.17 4.24-4.24"></path>
                                    <path d="m14.83 14.83 4.24 4.24"></path>
                                    <path d="m9.17 14.83-4.24 4.24"></path>
                                    <circle cx="12" cy="12" r="4"></circle>
                                  </svg>
                                </div>
                                <span className="text-[#38bdf8] text-xs font-medium">AI Assistant</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Navigation buttons */}
                                {!isFirstAssistantMessage && (
                                  <button 
                                    onClick={() => {
                                      document.getElementById(`message-${prevAssistantActualIndex}`)?.scrollIntoView({
                                        behavior: 'smooth', 
                                        block: 'center'
                                      });
                                    }}
                                    className="p-1 rounded-full hover:bg-[#22304a] text-[#b6c2e0] hover:text-[#38bdf8] transition"
                                    title="Previous answer"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m15 18-6-6 6-6"/>
                                    </svg>
                                  </button>
                                )}
                                
                                {!isLastAssistantMessage && (
                                  <button 
                                    onClick={() => {
                                      document.getElementById(`message-${nextAssistantActualIndex}`)?.scrollIntoView({
                                        behavior: 'smooth', 
                                        block: 'center'
                                      });
                                    }}
                                    className="p-1 rounded-full hover:bg-[#22304a] text-[#b6c2e0] hover:text-[#38bdf8] transition"
                                    title="Next answer"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m9 18 6-6-6-6"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Assistant response with improved styling */}
                            <div className="px-4 py-3 text-[#e0e6f0] mr-8" style={{ fontSize: 15, minHeight: 60 }}>
                              {msg.content}
                            </div>
                              {/* Related/Recommendations section always at the bottom of assistant messages */}
                            {msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="border-t border-[#22304a] bg-[#131c2a] p-4 pt-3">
                                <div className="flex items-center mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                  </svg>
                                  <span className="text-[#ff5757] text-sm font-semibold">Related Questions</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {msg.suggestions.slice(0, numSuggestions).map((suggestion, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleSuggestionClick(suggestion);
                                      }}
                                      className={`${isProcessingSuggestion ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#22304a] hover:text-[#ff5757] hover:shadow-md hover:shadow-[#ff5757]/5'} 
                                      bg-[#101624] text-[#e0e6f0] px-3 py-2 rounded-md text-sm text-left border border-[#22304a] transition-all focus:outline-none focus:ring-2 focus:ring-[#ff5757]/40`}
                                      aria-label={`Ask: ${suggestion}`}
                                      type="button" // Explicitly set type to button
                                      disabled={isProcessingSuggestion} // Disable during processing
                                    >
                                      <div className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 text-[#8a9cc5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 2H4v20h16V2zM8 12h8M11 12v6"></path>
                                        </svg>
                                        <span>{suggestion}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mb-4 ml-8 mr-4">
                            <div className="flex items-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#8a9cc5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                              <span className="text-[#8a9cc5] text-xs">You</span>
                            </div>
                            <div className="p-3 rounded-lg bg-gradient-to-r from-[#22304a] to-[#1e283d] text-[#38bdf8] border border-[#38bdf8]/10">
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  {loading && (
                    <div className="p-4 bg-gradient-to-r from-[#172033] to-[#141c2d] rounded-lg border border-[#22304a] shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <p className="text-[#b6c2e0] text-sm">Processing your question...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Input area */}
            <div className="p-3 border-t border-[#22304a] bg-[#18213a]">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about the PDF..."
                  className="flex-1 p-3 rounded-lg bg-[#101624] border border-[#22304a] text-[#e0e6f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      
                      // Simple check with no additional callbacks
                      if (!input.trim() || loading) {
                        return;
                      }
                      
                      // Use safe execution with setTimeout to prevent UI freeze
                      try {
                        setTimeout(() => {
                          try {
                            sendMessage();
                          } catch (err) {
                            console.error("Error in sendMessage (keyboard):", err);
                            setLoading(false);
                          }
                        }, 10);
                      } catch (err) {
                        console.error("Error in keyboard handler:", err);
                        setLoading(false);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    // Use try-catch to prevent blank screens
                    try {
                      if (!input.trim() || loading || isProcessingSuggestion) {
                        return;
                      }
                      
                      // Use setTimeout to avoid blocking UI
                      setTimeout(() => {
                        try {
                          sendMessage();
                        } catch (e) {
                          console.error("Error in send:", e);
                          setLoading(false);
                        }
                      }, 10);
                    } catch (error) {
                      console.error("Error in click handler:", error);
                      setLoading(false);
                    }
                  }}
                  disabled={!input.trim() || loading || isProcessingSuggestion}
                  className="px-5 py-3 bg-gradient-to-r from-[#ff5757]/80 to-[#cc4545] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#ff5757]/20 transition-all disabled:opacity-60 disabled:bg-[#22304a] disabled:from-[#22304a] disabled:to-[#22304a] disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <>
                      <span>Send</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-2 flex justify-center">
                <div className="text-[#8a9cc5] text-xs bg-[#0f141f]/70 px-3 py-1.5 rounded-full inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"></path>
                    <path d="M8 17.5a6.5 6.5 0 1 1 13 0c0 2.5-2.5 2.5-2.5 2.5h-8c0 0-2.5 0-2.5-2.5z"></path>
                    <path d="M12 11h4"></path>
                    <path d="M12 8h4"></path>
                  </svg>
                  Ask specific questions for best results
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PDFChatRedesigned;
