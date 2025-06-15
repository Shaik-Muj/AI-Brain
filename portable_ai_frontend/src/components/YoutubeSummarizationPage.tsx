import React, { useState } from 'react';
import { apiService } from '../services/api';

interface YoutubeSummarizationPageProps {
  onBack: () => void;
}

const YoutubeSummarizationPage: React.FC<YoutubeSummarizationPageProps> = ({ onBack }) => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);  const handleSummarize = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSummary('');
    setTranscript('');
    setVideoTitle('');
    setDuration('');
    
    try {
      const response = await apiService.summarizeYouTube(youtubeUrl);
      setSummary(response.summary || 'No summary available.');
      setTranscript(response.transcript || '');
      setVideoTitle(response.title || 'Untitled Video');
      setDuration(response.duration || '');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to summarize video. Please try again.';
      setError(errorMessage);
      console.error('YouTube summarization error:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#131a2e] to-[#101624] p-6">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-[#38bdf8] hover:text-[#0ea5e9] transition bg-[#18213a]/60 px-4 py-2 rounded-lg border border-[#22304a]/50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Home
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-b from-[#18213a] to-[#151e33] p-8 rounded-2xl shadow-lg border border-[#22304a] backdrop-filter backdrop-blur-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-[#ff0000]/20 to-[#ff0000]/5 rounded-lg p-2 mr-3 border border-[#ff0000]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#ff0000]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">YouTube Summarization</h2>
              <p className="text-xs text-[#b6c2e0] mt-0.5">Extract key points from videos automatically</p>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="rounded-lg bg-gradient-to-b from-[#172033] to-[#131a2e] p-8 text-center border border-[#22304a] shadow-inner">
              {error && (
                <div className="text-red-400 mb-4 font-medium">{error}</div>
              )}              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="text-[#b6c2e0] text-xl animate-pulse mb-2">Processing video...</div>
                  <p className="text-[#8a9cc5] text-sm text-center">
                    This may take a few minutes for longer videos. We're downloading, transcribing, and summarizing the content.
                  </p>
                </div>
              ) : error ? (
                <div className="text-red-400 mb-4 p-4 bg-[#101624] rounded border border-red-400/30">
                  <p className="font-medium mb-2">Error:</p>
                  <p>{error}</p>
                  {error.includes("timeout") && (
                    <p className="mt-4 text-sm text-[#8a9cc5]">
                      Try again with a shorter video, or check your internet connection.
                    </p>
                  )}
                </div>
              ) : summary ? (
                <>
                  {videoTitle && (
                    <div className="mb-6">
                      <h3 className="text-[#38bdf8] font-bold text-2xl mb-1">{videoTitle}</h3>
                      {videoTitle && duration && (
                        <p className="text-[#8a9cc5] text-sm">{duration} minutes</p>
                      )}
                    </div>
                  )}
                  <p className="text-center text-[#b6c2e0] uppercase text-xs mb-2 tracking-wider">SUMMARY OF THE VIDEO:</p>
                  <div className="text-[#e0e6f0] text-base leading-relaxed whitespace-pre-line mb-6">{summary}</div>
                  {transcript && (
                    <>
                      <p className="text-center text-[#b6c2e0] uppercase text-xs mb-2 tracking-wider">FULL TRANSCRIPT:</p>
                      <div className="text-[#b6c2e0] text-sm leading-relaxed whitespace-pre-line bg-[#101624] rounded p-4 border border-[#22304a] max-h-64 overflow-y-auto">{transcript}</div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-[#b6c2e0]">Enter a YouTube URL below and click summarize</div>
              )}
            </div>
          </div>          <div className="relative bg-[#101624]/70 p-6 rounded-xl border border-[#22304a]/70 backdrop-blur-sm">
            <div className="flex flex-col">
              <label className="flex items-center text-[#b6c2e0] text-sm mb-2 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#ff0000]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                YouTube URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste your YouTube link here..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full p-4 pr-36 rounded-lg bg-[#0c101c] border border-[#22304a] text-[#e0e6f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#ff0000]/30 text-base shadow-inner"
                  disabled={loading}
                />
                <button
                  onClick={handleSummarize}
                  disabled={loading}
                  className={`absolute right-2 top-2 px-5 py-2 rounded-lg font-semibold transition-all ${loading 
                    ? 'bg-[#22304a] text-[#64748b] cursor-not-allowed border border-[#22304a]' 
                    : 'bg-gradient-to-r from-[#ff0000]/80 to-[#cc0000] text-white hover:shadow-lg hover:shadow-[#ff0000]/20 border border-[#ff0000]/30'}`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#8a9cc5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : 'Summarize'}
                </button>
              </div>
              
              <div className="mt-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#8a9cc5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p className="text-xs text-[#8a9cc5]">
                  Supports both youtube.com and youtu.be links. We'll download, transcribe, and summarize your video.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeSummarizationPage;
