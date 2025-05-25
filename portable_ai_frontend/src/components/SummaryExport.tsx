// src/components/SummaryExport.tsx
import { useState } from "react";
import { getPDFSummary } from "../api/pdf";

interface SummaryExportProps {
  points: string[];
}

export default function SummaryExport({ points }: SummaryExportProps) {
  const [summary, setSummary] = useState("");

  const fetchSummary = async () => {
    const res = await getPDFSummary();
    setSummary(res.summary || res.error);
  };

  const download = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "summary.txt";
    link.click();
  };

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={fetchSummary}
        className="bg-purple-600 text-white px-4 py-1 rounded"
      >
        Get Summary
      </button>

      {summary && (
        <div className="bg-gray-100 p-4 rounded">
          <pre className="whitespace-pre-wrap">{summary}</pre>
          <button
            onClick={download}
            className="mt-2 bg-green-600 text-white px-4 py-1 rounded"
          >
            Download Summary
          </button>
        </div>
      )}

      {points.length > 0 && (
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">Summary Points from PDFChat:</h3>
          <ul className="list-disc list-inside">
            {points.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
