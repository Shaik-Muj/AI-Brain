// src/components/SimplePDFViewer.tsx
import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source - use CDN for reliability, matching our package version (4.8.69)
const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
console.log("PDF.js Worker URL set to:", workerUrl);

interface SimplePDFViewerProps {
  fileId: string;
  pdfUrl?: string;
  onTextSelect?: (text: string) => void;
}

const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({ fileId, pdfUrl, onTextSelect }) => {  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);  const [useFallbackUrl, setUseFallbackUrl] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRIES = 2;
  
  // Memoize the PDF.js options to prevent unnecessary reloads
  const pdfOptions = React.useMemo(() => ({
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/standard_fonts/'
  }), []); // Empty dependency array means this is created only once
  
  // Calculate the PDF source only once to prevent infinite rerenders
  const pdfSource = React.useMemo(() => {
    // Reset error state when source changes
    setError(null);
    
    // If we're using the fallback URL and have a direct pdfUrl
    if (useFallbackUrl && pdfUrl) {
      console.log("SimplePDFViewer: Using fallback direct pdfUrl:", pdfUrl);
      return pdfUrl;
    }
    
    // Always use the backend URL when fileId is provided
    console.log("SimplePDFViewer: Using fileId:", fileId, "pdfUrl:", pdfUrl);
    
    // Make sure the fileId is valid
    if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
      console.error("Invalid fileId:", fileId);
      setError("No valid file ID provided");
      return '';
    }
    
    const baseUrl = `http://localhost:8000/pdf/get-pdf/${fileId}`;
    console.log("SimplePDFViewer: Backend URL:", baseUrl);
    
    // Add timestamp parameter for cache-busting (but only ONCE)
    const timestamp = Date.now();
    const finalUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
    console.log("SimplePDFViewer: Final PDF URL:", finalUrl);
    return finalUrl;
  }, [fileId, pdfUrl, useFallbackUrl]); // Recalculate when fallback strategy changes
  
  // Effect to automatically retry on certain errors
  useEffect(() => {
    if (error && error.includes("Failed to fetch") && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        console.log(`Retrying PDF load (${retryCount + 1}/${MAX_RETRIES})...`);
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsLoading(true);
      }, 2000); // Wait 2 seconds before retry
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);
  
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    setRetryCount(0); // Reset retry count on success
  }
  
  function onDocumentLoadError(err: Error | string) {
    // Clear any previous loading state
    setIsLoading(false);
    
    // Format and log the error
    console.error("PDF load error:", err);
    
    // Try to get more specific information to help debugging
    let errorMessage = "Failed to load PDF";
    
    if (typeof err === 'string') {
      errorMessage += `: ${err}`;
    } else if (err instanceof Error) {
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      if (err.stack) {
        console.error("Error stack:", err.stack);
      }
      
      // Check for specific errors
      
      // Version mismatch error
      if (err.message.includes('API version') && err.message.includes('Worker version')) {
        errorMessage = `PDF.js version mismatch. Please refresh the page or contact support if the issue persists.`;
        
        // Log detailed information for developers
        console.error(`PDF.js Version Mismatch: ${err.message}`);
        console.error('This usually happens when the main PDF.js library and its worker file are different versions.');
        console.error(`Current workerSrc: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
      }
      // File not found errors
      else if (err.message.includes('net::ERR_FILE_NOT_FOUND') || 
          err.message.includes('404') ||
          err.message.includes('Failed to fetch')) {
        errorMessage = `The PDF file could not be found. Please check that the file exists on the server.`;
        
        // If we have a direct pdfUrl and we're not already using it, try it as a fallback
        if (fileId && pdfUrl && !useFallbackUrl) {
          console.log("PDF file not found from backend URL, trying direct pdfUrl as fallback");
          
          // Update error message to indicate fallback attempt
          setError(`${errorMessage} Attempting to load from direct URL...`);
          
          // Switch to using the direct URL instead
          setUseFallbackUrl(true);
          return;
        }
        // If fallback also failed, try opening in a new tab as last resort
        else if (useFallbackUrl && pdfUrl) {
          console.log("Fallback URL also failed, trying to open in new tab");
          
          // Try to open the PDF URL in a new tab as a fallback mechanism
          if (typeof window !== 'undefined') {
            try {
              window.open(pdfUrl, '_blank');
              errorMessage = `${errorMessage} Opened PDF in new tab as a fallback.`;
            } catch (fallbackError) {
              console.error("Fallback attempt also failed:", fallbackError);
              errorMessage = `${errorMessage} Fallback attempt also failed.`;
            }
          }
        }
      }
      // CORS errors
      else if (err.message.includes('CORS') || err.message.includes('cross-origin')) {
        errorMessage = `Cross-origin error: The PDF is hosted on a different domain. Ask your administrator to enable CORS on the server.`;
      }
    }
    
    // Set the error message
    setError(errorMessage);
    
    // Report error to monitoring system if available
    if (typeof window !== 'undefined' && window.console) {
      console.warn('PDF Viewer Error:', errorMessage);
    }
  }
  
  // Function to manually retry loading
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setUseFallbackUrl(false); // Reset to try backend URL first
    setRetryCount(0);
  };
  
  // Change page functions
  const previousPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };
  
  const nextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };
  
  // Handle text selection
  const handleTextSelection = () => {
    if (!onTextSelect) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      onTextSelect(selection.toString().trim());
    }
  };

  if (!pdfSource) {
    return (
      <div className="text-red-500 p-4 bg-red-100/10 rounded-lg">
        No valid PDF source provided. Please check the file ID or URL.
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#1e293b] rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-[#101624]">
        <div className="flex items-center">
          <button 
            onClick={previousPage}
            disabled={pageNumber <= 1 || isLoading || !!error}
            className="p-1.5 rounded text-white disabled:opacity-50"
          >
            &larr; Prev
          </button>
          <span className="mx-2 text-white">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1) || isLoading || !!error}
            className="p-1.5 rounded text-white disabled:opacity-50"
          >
            Next &rarr;
          </button>
        </div>
        
        {/* Add retry button */}
        {error && (
          <button 
            onClick={handleRetry}
            className="px-3 py-1 bg-[#ff5757] text-white rounded hover:bg-[#ff3a3a] text-sm"
          >
            Retry
          </button>
        )}
      </div>
      
      {/* Document container */}      <div 
        className="flex-1 overflow-auto p-4"
        onMouseUp={handleTextSelection}
      >
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="text-white">Loading PDF...</div>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col justify-center items-center h-32">
            <div className="text-red-500 p-4 text-center">
              {error}
            </div>
            <div className="text-gray-400 text-sm mt-2">
              File ID: {fileId || 'Not provided'}
            </div>
          </div>
        )}
          {!error && pdfSource && (
          <Document
            file={pdfSource}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="text-white text-center p-4">Loading PDF...</div>}
            options={pdfOptions}
          >
            {numPages && numPages > 0 && (              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true} 
                renderAnnotationLayer={true}
                error={<div className="text-red-500 text-center p-4">Error loading page {pageNumber}</div>}
              />
            )}
          </Document>
        )}
      </div>
    </div>
  );
};

export default SimplePDFViewer;
