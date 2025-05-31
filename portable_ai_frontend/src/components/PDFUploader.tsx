// src/components/PDFUploader.tsx
import React, { useState } from "react";
import PDFChatPopup from "./PDFChatPopup";
import { uploadPDF } from "../api/pdf";

interface PDFUploaderProps {
  onExtract: (text: string) => void;
  pdfText: string; // Added pdfText prop
}

export default function PDFUploader({ onExtract, pdfText }: PDFUploaderProps) { // Added pdfText to destructuring
  const [status, setStatus] = useState<string>("");
  const [points, setPoints] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>(""); // State for the PDF URL

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setStatus("Uploading...");
    try {
      const file = e.target.files[0];
      const res = await uploadPDF(file);
      if (res && res.success) {
        setStatus("Upload succeeded and text was extracted.");
        setPoints(res.points); // Store the bullet points
        setPdfUrl(URL.createObjectURL(file)); // Create a URL for the uploaded PDF
        // onExtract(res.summary); // Pass the summary to the parent component
        onExtract(res.fullText); // Pass the fullText to the parent component
      } else if (res && res.error) {
        setStatus("Upload failed: " + res.error);
      } else {
        setStatus("Upload failed: Unexpected response format.");
        console.error("Unexpected upload response:", res);
      }
    } catch (err) {
      setStatus("Upload failed: " + (err instanceof Error ? err.message : String(err)));
      console.error("PDF upload error:", err);
    }
  };

  const handleAskPDF = () => {
    setShowPopup(true); // Directly open the PDF viewer and chatbot
  };

  return (
    <div className="p-4 space-y-2">
      <label className="font-medium">Upload a PDF</label>
      <input type="file" accept="application/pdf" onChange={handleUpload} />
      {status && <p className="text-sm text-gray-600">{status}</p>}
      {points.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Extracted Bullet Points:</h3>
          <ul className="list-disc list-inside space-y-1">
            {points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          <button
            onClick={handleAskPDF}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Ask PDF
          </button>
        </div>
      )}
      {showPopup && (
        <PDFChatPopup
          pdfUrl={pdfUrl} // Pass the PDF URL
          pdfText={pdfText} // Pass the pdfText
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
