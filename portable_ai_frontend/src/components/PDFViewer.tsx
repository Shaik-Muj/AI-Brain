// src/components/PDFViewer.tsx
import React from "react";
import PDFChat from "./PDFChat";

interface PDFViewerProps {
  pdfText: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfText }) => {
  return (
    <div className="pdf-viewer-container flex h-screen">
      {/* PDF display section */}
      <div className="pdf-display w-1/2 border-r overflow-auto">
        {/* PDF content would be displayed here */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">PDF Content</h2>
          <div className="bg-gray-100 p-4 rounded">
            {pdfText ? (
              <pre className="whitespace-pre-wrap">{pdfText.substring(0, 500)}...</pre>
            ) : (
              <p>No PDF content loaded</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat section */}
      <div className="chat-section w-1/2 overflow-auto">
        <PDFChat pdfText={pdfText} />
      </div>
    </div>
  );
};

export default PDFViewer;