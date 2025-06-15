import React, { useState } from "react";
import PDFUploader from "./PDFUploader";
import PDFChatRedesigned from "./PDFChatRedesigned";
import PDFSummaryDisplay from "./PDFSummaryDisplay";

interface PDFChatUploadPageProps {
  onBack: () => void;
}

const PDFChatUploadPage: React.FC<PDFChatUploadPageProps> = ({ onBack }) => {  const [pdfText, setPdfText] = useState<string>("");
  const [fileId, setFileId] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [showChat, setShowChat] = useState<boolean>(false);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to handle switching to chat after user clicks "Ask Questions About PDF" button
  const handleShowChat = (id: string, url?: string) => {
    if (id) {
      setFileId(id);
      if (url) setPdfUrl(url);
      setShowChat(true);
    }
  };  // Reset function to go back to upload view
  const handleBackToUpload = () => {
    if (showChat) {
      setShowChat(false);
    } else if (uploadComplete) {
      // Go back to uploader from summary view
      setUploadComplete(false);
    }
  };
    // Function to handle PDF upload completion
  const handlePdfUploadComplete = (id: string, url: string, points: string[], name: string, text: string) => {
    setFileId(id);
    setPdfUrl(url);
    setSummaryPoints(points);
    setFileName(name);
    setPdfText(text);
    setUploadComplete(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101624] via-[#131a2e] to-[#101624] p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute w-96 h-96 bg-[#ff5757] opacity-10 rounded-full -top-20 -left-20 blur-3xl"></div>
      <div className="absolute w-80 h-80 bg-[#ff5757] opacity-5 rounded-full bottom-40 right-20 blur-3xl"></div>
      <div className="absolute left-0 top-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
        <button 
        onClick={showChat || uploadComplete ? handleBackToUpload : onBack}
        className="mb-6 flex items-center text-[#38bdf8] hover:text-[#0ea5e9] transition bg-[#18213a]/60 px-4 py-2 rounded-lg border border-[#22304a]/50 relative z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        {showChat ? "Back to PDF Summary" : uploadComplete ? "Upload Another PDF" : "Back to Home"}
      </button>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-b from-[#18213a] to-[#151e33] p-8 rounded-2xl shadow-lg border border-[#22304a] backdrop-filter backdrop-blur-sm mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-[#ff5757]/20 to-[#ff5757]/5 rounded-lg p-2 mr-3 border border-[#ff5757]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Talk to the PDF</h2>
              <p className="text-xs text-[#b6c2e0] mt-0.5">Ask questions about your documents</p>
            </div>
          </div>
        </div>        {/* Main content */}
        <div className="grid grid-cols-1 gap-8">          {showChat ? (
            <PDFChatRedesigned fileId={fileId} pdfUrl={pdfUrl} />
          ) : uploadComplete ? (
            <PDFSummaryDisplay
              points={summaryPoints}
              fileName={fileName}
              loading={isLoading}
              onAskQuestions={() => fileId && handleShowChat(fileId, pdfUrl)}
            />
          ) : (
            <PDFUploader 
              pdfText={pdfText} 
              onExtract={(text) => {
                setPdfText(text);
              }}              onFileIdReceived={handleShowChat}
              onPointsExtracted={(points) => {
                console.log("Setting summary points:", points);
                setSummaryPoints(points);
              }}
              onUploadComplete={(id, url, points, name, text) => {
                handlePdfUploadComplete(id, url, points, name, text);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFChatUploadPage;
