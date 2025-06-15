// src/components/PDFUploader.tsx
import React, { useState } from "react";
import PDFChatPopup from "./PDFChatPopup";
import { uploadPDF } from "../api/pdf";

interface PDFUploaderProps {
  onExtract: (text: string) => void;
  pdfText: string;
  onFileIdReceived?: (id: string, url?: string) => void;
  onPointsExtracted?: (points: string[]) => void;
  onUploadComplete?: (id: string, url: string, points: string[], fileName: string, text: string) => void;
}

export default function PDFUploader({ onExtract, pdfText, onFileIdReceived, onPointsExtracted, onUploadComplete }: PDFUploaderProps) {
  const [status, setStatus] = useState<string>("");
  const [points, setPoints] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [fileId, setFileId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setIsLoading(true);
    setStatus("Uploading...");
    setError(null);
    setPoints([]);
      try {
      const file = e.target.files[0];
      if (!file) {
        setError("No file selected");
        setIsLoading(false);
        return;
      }
      
      console.log("Uploading file:", file.name);
      setFileName(file.name);
      
      const res = await uploadPDF(file);
      console.log("Upload response:", res);
      
      if (res && res.success) {
        setStatus("Upload succeeded and text was extracted.");
        setPoints(res.points || []);
        
        // For better debugging
        console.log("PDF ID received:", res.pdf_id);
        
        // Validate PDF ID
        if (!res.pdf_id || typeof res.pdf_id !== 'string' || res.pdf_id.trim() === '') {
          throw new Error("Server returned an invalid PDF ID");
        }
        
        // Create a blob URL for the PDF
        const fileUrl = URL.createObjectURL(file);
        console.log("Created file URL:", fileUrl);
        setPdfUrl(fileUrl);
        setFileId(res.pdf_id);
        
        // Store the file ID and URL, but don't navigate to chat yet
        // Only extract the text for later use
        onExtract(res.fullText);
        
        // Pass the extracted points to parent if callback exists
        if (onPointsExtracted) {
          onPointsExtracted(res.points);
        }
        
        // Notify parent of upload completion with all data
        if (onUploadComplete) {
          onUploadComplete(res.pdf_id, fileUrl, res.points, file.name, res.fullText);
        }
      } else if (res && res.error) {
        setError("Upload failed: " + res.error);
        setStatus("");
      } else {
        setError("Upload failed: Unexpected response format.");
        setStatus("");
        console.error("Unexpected upload response:", res);
      }
    } catch (err) {
      setError("Upload failed: " + (err instanceof Error ? err.message : String(err)));
      setStatus("");
      console.error("PDF upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };  const handleAskPDF = () => {
    // If there's an onFileIdReceived callback, use it to initiate the chat in the parent component
    if (onFileIdReceived && fileId) {
      onFileIdReceived(fileId, pdfUrl);
    } else if (fileId) {
      // Otherwise, fall back to the popup approach
      setShowPopup(true);
    } else {
      setError("No PDF has been uploaded yet");
    }
  };
  return (
    <div className="w-full bg-gradient-to-b from-[#172033] to-[#141c2d] p-6 rounded-xl shadow-lg border border-[#22304a]">
      {/* No additional header needed since the parent component will provide it */}
      
      <div className="mb-6">
        <div className="flex flex-col justify-center items-center h-64 bg-[#101624] rounded-lg border border-dashed border-[#ff5757]/30 hover:border-[#ff5757]/70 transition-all group relative">
          <input 
            type="file" 
            accept="application/pdf" 
            id="pdf-upload" 
            className="hidden"
            onChange={handleUpload} 
            disabled={isLoading}
          />
          
          <label 
            htmlFor="pdf-upload" 
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-center"
          >
            <div className="rounded-full bg-[#ff5757]/10 p-4 mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <h3 className="text-[#ff5757] font-medium text-xl mb-2">
              Click to Upload PDF
            </h3>
            <p className="text-[#8a9cc5] text-sm mb-1">
              Drag & drop or click to browse
            </p>
            <p className="text-[#64748b] text-xs">
              Only PDF files are supported
            </p>
          </label>
        </div>
      </div>
      
      {isLoading && (
        <div className="bg-[#101624] p-4 rounded-lg border border-[#22304a] mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-[#ff5757] animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-[#ff5757] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-[#ff5757] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-[#b6c2e0] text-sm">{status}</p>
          </div>
          <p className="text-[#8a9cc5] text-xs mt-2 pl-6">This may take a moment for larger documents</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-400/10 p-4 rounded-lg border border-red-400/20 mb-6 text-red-400">
          <p className="font-medium mb-1">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}      {points.length > 0 && (
        <div className="bg-[#101624] p-5 rounded-lg border border-[#22304a] mb-6">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#ff5757]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
              <path d="M10 9H8"></path>
            </svg>
            <h3 className="font-semibold text-white">PDF Processed Successfully</h3>
          </div>
          <p className="text-[#e0e6f0] text-sm mb-3">
            Your PDF has been successfully uploaded and processed. The key points have been extracted.
          </p>
          
          <button
            onClick={handleAskPDF}
            className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-[#ff5757]/80 to-[#cc4545] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#ff5757]/20 transition-all border border-[#ff5757]/30 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Ask Questions About PDF
          </button>
        </div>
      )}
      
      {/* Only show the popup if we're not using the parent component's callback */}
      {showPopup && !onFileIdReceived && (
        <PDFChatPopup
          pdfUrl={pdfUrl}
          fileId={fileId}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
