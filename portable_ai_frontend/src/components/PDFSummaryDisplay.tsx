// src/components/PDFSummaryDisplay.tsx
import React, { useState } from "react";

interface PDFSummaryDisplayProps {
  points: string[];
  onAskQuestions: () => void;
  fileName?: string;
  loading?: boolean;
}

const PDFSummaryDisplay: React.FC<PDFSummaryDisplayProps> = ({ points, onAskQuestions, fileName, loading = false }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Show loading state or null if no points
  if (loading || !points || points.length === 0) {
    return loading ? (
      <div className="bg-gradient-to-b from-[#172033] to-[#141c2d] rounded-lg shadow-lg border border-[#22304a] p-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="flex space-x-2 mb-3">
            <div className="w-3 h-3 bg-[#ff5757] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[#ff5757] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-[#ff5757] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-[#b6c2e0]">Processing document...</p>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="bg-gradient-to-b from-[#172033] to-[#141c2d] rounded-lg shadow-lg border border-[#22304a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1e293b] to-[#192334] border-b border-[#22304a]">
        <div className="flex items-center">
          <div className="bg-[#0e2329]/70 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
              <path d="M10 9H8"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-[#38bdf8] font-bold">Document Summary</h3>
            {fileName && <p className="text-[#b6c2e0] text-xs">{fileName}</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-5">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m4.93 4.93 4.24 4.24"></path>
              <path d="m14.83 9.17 4.24-4.24"></path>
              <path d="m14.83 14.83 4.24 4.24"></path>
              <path d="m9.17 14.83-4.24 4.24"></path>
            </svg>
            Key Points
          </h4>
          <ul className="list-disc list-inside space-y-1.5 pl-3 text-[#b6c2e0]">
            {points.map((point, index) => (
              <li key={index} className="mb-1 text-sm">
                <span className="text-[#e0e6f0]">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onAskQuestions}
            className="px-6 py-3 bg-gradient-to-r from-[#ff5757]/80 to-[#cc4545] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#ff5757]/20 transition-all border border-[#ff5757]/30 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Ask Questions About PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFSummaryDisplay;
