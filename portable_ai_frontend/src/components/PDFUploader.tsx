// src/components/PDFUploader.tsx
import { useState } from "react";
import { uploadPDF } from "../api/pdf";

interface PDFUploaderProps {
  onExtract: (text: string) => void;
}

export default function PDFUploader({ onExtract }: PDFUploaderProps) {
  const [status, setStatus] = useState("");
  const [points, setPoints] = useState<string[]>([]); // State to store bullet points

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setStatus("Uploading...");
    try {
      const res = await uploadPDF(e.target.files[0]);
      if (res && res.success) {
        if (res.points && res.points.length > 0) {
          setStatus("Upload succeeded and text was extracted.");
          setPoints(res.points); // Store the bullet points
          onExtract(res.summary); // Pass the summary to the parent component
        } else {
          setStatus("Upload succeeded, but no summary points were generated.");
        }
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
        </div>
      )}
    </div>
  );
}
