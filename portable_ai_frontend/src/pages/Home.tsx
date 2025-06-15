import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({})

  // Multi-chatbot handler
  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponses({});
    // Example: send to all models (replace with your actual backend call)
    const models = ['openai', 'ollama', 'llama', 'gemma'];
    const results: Record<string, string> = {};
    await Promise.all(models.map(async (model) => {
      try {
        const res = await fetch('http://localhost:8000/prompt/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model }),
        });
        const data = await res.json();
        results[model] = data.response || 'No response';
      } catch (e) {
        results[model] = 'Error';
      }
    }));
    setResponses(results);
    setLoading(false);
  };  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0f2e36] via-[#11343d] to-[#185c63] relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute w-96 h-96 bg-[#2a7d85] opacity-20 rounded-full -top-20 -left-20 blur-3xl"></div>
      <div className="absolute w-80 h-80 bg-[#38bdf8] opacity-10 rounded-full top-40 -right-10 blur-3xl"></div>
      <div className="absolute w-72 h-72 bg-[#2a7d85] opacity-20 rounded-full -bottom-10 -right-20 blur-3xl"></div>
      <div className="absolute left-0 top-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
      
      {/* Floating shapes for visual interest */}
      <div className="absolute top-[20%] left-[10%] w-12 h-12 bg-[#38bdf8]/10 rounded-lg rotate-12 backdrop-blur-sm border border-[#38bdf8]/20 hidden lg:block"></div>
      <div className="absolute bottom-[15%] right-[12%] w-16 h-16 bg-[#ff5757]/10 rounded-lg -rotate-12 backdrop-blur-sm border border-[#ff5757]/20 hidden lg:block"></div>
        <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="logo-container logo-glow">
          <div className="bg-gradient-to-br from-[#23272f]/60 to-[#23272f]/20 p-6 rounded-full mb-5 backdrop-blur-lg border border-[#38bdf8]/20 shadow-lg shadow-[#38bdf8]/5">
            <img 
              src="/brain-logo.svg" 
              alt="Animated Brain Logo" 
              className="w-32 h-32 object-contain logo-spin"
              onError={(e) => {
                // Animated brain icon as fallback
                (e.target as HTMLImageElement).outerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 text-[#38bdf8]">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 2 17.5v-15a2.5 2.5 0 0 1 5-.44A2.5 2.5 0 0 1 9.5 2Z"></path>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 22 17.5v-15a2.5 2.5 0 0 0-5-.44A2.5 2.5 0 0 0 14.5 2Z"></path>
                  </svg>
                `;
              }}
            />
          </div>        </div>
        <h1 className="text-5xl font-bold text-white tracking-wide mb-3 text-center" style={{ textShadow: '0 2px 10px rgba(56, 189, 248, 0.2)' }}>
          PORTABLE AI <span className="text-[#38bdf8]">BRAIN</span>
        </h1>
        <p className="text-[#b6c2e0] text-lg max-w-lg text-center mb-3">
          Your all-in-one AI toolkit for analyzing content across different media formats
        </p>
        <div className="inline-flex items-center px-3 py-1.5 bg-[#0e2329]/70 rounded-full backdrop-blur-md mb-8 border border-[#38bdf8]/20">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] mr-2 animate-pulse"></span>
          <span className="text-[#38bdf8] text-sm">Powered by multiple AI models</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 w-full max-w-5xl px-6">
        {/* All buttons have identical dimensions and consistent styling */}
        {/* Youtube Summarization */}
        <button
          className="group flex flex-col items-center justify-center bg-gradient-to-b from-[#18213a] to-[#131a2e] rounded-2xl px-6 py-8 shadow-lg hover:shadow-xl hover:shadow-[#ff0000]/5 hover:translate-y-[-5px] transition-all duration-300 border border-[#22304a] hover:border-[#ff0000]/30 h-[180px] w-full backdrop-blur-sm"
          onClick={() => navigate('/youtube')}
        >
          <div className="rounded-full bg-[#0e2329]/70 p-4 mb-4 border border-[#22304a] group-hover:border-[#ff0000]/30 group-hover:bg-[#0e2329] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#ff0000]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </div>
          <span className="text-white text-xl font-medium group-hover:text-[#ff0000]/90 transition-colors">YouTube Summarization</span>
          <span className="text-[#8a9cc5] text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Transform videos into concise summaries</span>
        </button>
        
        {/* Image Analysis */}
        <button
          className="group flex flex-col items-center justify-center bg-gradient-to-b from-[#18213a] to-[#131a2e] rounded-2xl px-6 py-8 shadow-lg hover:shadow-xl hover:shadow-[#38bdf8]/5 hover:translate-y-[-5px] transition-all duration-300 border border-[#22304a] hover:border-[#38bdf8]/30 h-[180px] w-full backdrop-blur-sm"
          onClick={() => navigate('/image-analysis')}
        >
          <div className="rounded-full bg-[#0e2329]/70 p-4 mb-4 border border-[#22304a] group-hover:border-[#38bdf8]/30 group-hover:bg-[#0e2329] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
          <span className="text-white text-xl font-medium group-hover:text-[#38bdf8]/90 transition-colors">Image Analysis</span>
          <span className="text-[#8a9cc5] text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Get AI insights from your images</span>
        </button>
        
        {/* Talk to the PDF */}
        <button
          className="group flex flex-col items-center justify-center bg-gradient-to-b from-[#18213a] to-[#131a2e] rounded-2xl px-6 py-8 shadow-lg hover:shadow-xl hover:shadow-[#ff5757]/5 hover:translate-y-[-5px] transition-all duration-300 border border-[#22304a] hover:border-[#ff5757]/30 h-[180px] w-full backdrop-blur-sm"
          onClick={() => navigate('/pdf-chat')}
        >
          <div className="rounded-full bg-[#0e2329]/70 p-4 mb-4 border border-[#22304a] group-hover:border-[#ff5757]/30 group-hover:bg-[#0e2329] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>
          <span className="text-white text-xl font-medium group-hover:text-[#ff5757]/90 transition-colors">Talk to the PDF</span>
          <span className="text-[#8a9cc5] text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Ask questions about your documents</span>
        </button>
      </div>      {/* Enhanced prompt bar for regular chatbot */}
      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-gradient-to-br from-[#172033]/80 to-[#131a2e]/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-[#22304a]">
          <h3 className="text-xl font-medium text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Ask AI Models
          </h3>
          
          <div className="flex flex-col mb-4">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask something..."
                className="w-full px-6 py-4 rounded-lg bg-[#101624] text-white placeholder-gray-400 text-lg focus:outline-none border border-[#22304a] focus:ring-2 focus:ring-[#38bdf8]/50 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && prompt.trim()) {
                    handlePromptSubmit();
                  }
                }}
              />
              <button
                onClick={handlePromptSubmit}
                disabled={loading || !prompt.trim()}
                className="absolute right-2 top-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#2591c8] text-white font-semibold hover:shadow-lg hover:shadow-[#38bdf8]/20 transition-all disabled:opacity-60 disabled:bg-[#22304a] disabled:from-[#22304a] disabled:to-[#22304a]"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </span>
                ) : 'Ask'}
              </button>
            </div>
            <p className="text-[#8a9cc5] text-xs mt-2 pl-2">Compare responses from multiple AI models at once</p>
          </div>
          
          {/* Enhanced responses with left/right navigation */}
          {Object.keys(responses).length > 0 && (
            <div className="w-full mt-4 space-y-6">
              <h4 className="text-sm font-medium text-[#38bdf8] uppercase tracking-wider mb-2">Model Responses</h4>
              
              {Object.entries(responses).map(([model, response], index) => {
                const modelColors: Record<string, {bg: string, border: string, icon: string}> = {
                  'openai': {bg: '#1a3a40', border: '#38bdf8', icon: '#38bdf8'},
                  'ollama': {bg: '#2d2d39', border: '#a78bfa', icon: '#a78bfa'},
                  'gemma': {bg: '#321c37', border: '#ec4899', icon: '#ec4899'},
                  'llama': {bg: '#3a2518', border: '#f97316', icon: '#f97316'},
                };
                
                const color = modelColors[model] || {bg: '#23272f', border: '#2c3e4e', icon: '#64748b'};
                
                return (
                  <div key={model} className="relative">
                    {/* Navigation buttons */}
                    {index > 0 && (
                      <button 
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-[#22304a]/80 text-[#8a9cc5] p-1 rounded-full hover:bg-[#38bdf8]/20 hover:text-[#38bdf8] transition-colors"
                        onClick={() => {
                          const prevModel = Object.keys(responses)[index - 1];
                          document.getElementById(`model-${prevModel}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6"/>
                        </svg>
                      </button>
                    )}
                    
                    {index < Object.keys(responses).length - 1 && (
                      <button 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-[#22304a]/80 text-[#8a9cc5] p-1 rounded-full hover:bg-[#38bdf8]/20 hover:text-[#38bdf8] transition-colors"
                        onClick={() => {
                          const nextModel = Object.keys(responses)[index + 1];
                          document.getElementById(`model-${nextModel}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </button>
                    )}
                    
                    <div id={`model-${model}`} className={`bg-[${color.bg}] text-white rounded-lg p-4 shadow border border-[${color.border}]/30`}>
                      <div className="flex items-center mb-2">
                        <div className={`rounded-full bg-[${color.bg}] p-1 mr-2 border border-[${color.border}]/30`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[${color.icon}]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a9 9 0 0 0-9 9v7.5a1.5 1.5 0 0 0 1.5 1.5H7V11a5 5 0 0 1 10 0v9h2.5a1.5 1.5 0 0 0 1.5-1.5V11a9 9 0 0 0-9-9Z"></path>
                            <path d="M12 6v2"></path>
                          </svg>
                        </div>
                        <span className="font-bold capitalize text-[#d1d8e6]">{model}</span>
                        <span className="ml-auto text-xs text-[#8a9cc5]">{index + 1}/{Object.keys(responses).length}</span>
                      </div>
                      <div className="pl-7 text-[#e0e6f0] whitespace-pre-line">{response}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
