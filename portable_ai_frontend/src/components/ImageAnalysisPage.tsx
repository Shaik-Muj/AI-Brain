import React, { useState } from 'react';
import { apiService } from '../services/api';

interface ImageAnalysisPageProps {
  onBack: () => void;
}

const ImageAnalysisPage: React.FC<ImageAnalysisPageProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setIsLoading(true);
      setAnalysisResult("");
      setError(null);
      try {
        const data = await apiService.analyzeImage(file);
        setAnalysisResult(data.caption || 'No caption found.');
      } catch (err) {
        setError('Failed to analyze image. Please try again.');
        console.error('Image analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#131a2e] to-[#101624] p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute w-96 h-96 bg-[#38bdf8] opacity-10 rounded-full -top-20 -right-20 blur-3xl"></div>
      <div className="absolute w-80 h-80 bg-[#38bdf8] opacity-5 rounded-full bottom-40 left-20 blur-3xl"></div>
      <div className="absolute left-0 top-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
      
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-[#38bdf8] hover:text-[#0ea5e9] transition bg-[#18213a]/60 px-4 py-2 rounded-lg border border-[#22304a]/50 relative z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Home
      </button>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-b from-[#18213a] to-[#151e33] p-8 rounded-2xl shadow-lg border border-[#22304a] backdrop-filter backdrop-blur-sm mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-[#38bdf8]/20 to-[#38bdf8]/5 rounded-lg p-2 mr-3 border border-[#38bdf8]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Image Analysis</h2>
              <p className="text-xs text-[#b6c2e0] mt-0.5">Get AI insights from your images</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Upload section */}
          <div className="bg-gradient-to-b from-[#172033] to-[#141c2d] p-8 rounded-xl shadow-lg border border-[#22304a]">
            <h2 className="text-[#38bdf8] text-xl font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                <path d="M12 12v9"></path>
                <path d="m16 16-4-4-4 4"></path>
              </svg>
              Upload an Image
            </h2>            <div className="flex flex-col justify-center items-center h-64 bg-[#101624] rounded-lg border border-dashed border-[#38bdf8]/30 hover:border-[#38bdf8]/70 transition-all group relative">
              <input 
                type="file" 
                accept="image/*" 
                id="image-upload" 
                className="hidden"
                onChange={handleImageUpload}
              />
              <label 
                htmlFor="image-upload" 
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-center"
              >
                <div className="rounded-full bg-[#38bdf8]/10 p-4 mb-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                </div>
                <h3 className="text-[#38bdf8] font-medium text-xl mb-2">
                  Click to Upload
                </h3>
                <p className="text-[#8a9cc5] text-sm mb-1">
                  Drag & drop or click to browse
                </p>
                <p className="text-[#64748b] text-xs">
                  Supports JPG, PNG, GIF
                </p>
              </label>
            </div>
          </div>

          {/* Result section */}
          <div className="bg-gradient-to-b from-[#172033] to-[#141c2d] p-8 rounded-xl shadow-lg border border-[#22304a] flex flex-col">
            <h2 className="text-[#38bdf8] text-xl font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m4.93 4.93 4.24 4.24"></path>
                <path d="m14.83 9.17 4.24-4.24"></path>
                <path d="m14.83 14.83 4.24 4.24"></path>
                <path d="m9.17 14.83-4.24 4.24"></path>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              Analysis Results
            </h2>
            <div className="flex-grow flex flex-col items-center justify-center bg-[#101624] rounded-lg border border-[#22304a] p-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#38bdf8] animate-bounce"></div>
                    <div className="w-3 h-3 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <p className="text-[#b6c2e0] text-center">Analyzing image with AI...</p>
                  <p className="text-[#8a9cc5] text-xs mt-2">Extracting visual details and context</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-400 p-4 bg-red-400/10 rounded-lg border border-red-400/20 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p className="font-medium mb-1">{error}</p>
                  <p className="text-sm text-[#8a9cc5]">Please try a different image or try again later.</p>
                </div>
              ) : selectedImage ? (
                <>
                  <div className="mb-4 w-full max-h-48 flex justify-center overflow-hidden rounded-lg border border-[#38bdf8]/20">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Uploaded" 
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="w-full">
                    <h3 className="text-[#b6c2e0] text-xs uppercase tracking-wider mb-2 text-center">AI ANALYSIS</h3>
                    <div className="bg-[#0e2329]/30 p-4 rounded-lg border border-[#38bdf8]/10 text-[#e0e6f0]">
                      {analysisResult}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-[#22304a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                  <p className="text-[#8a9cc5] text-center mb-2">Upload an image to analyze</p>
                  <p className="text-[#64748b] text-xs text-center">Our AI will describe the content and provide insights</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisPage;
