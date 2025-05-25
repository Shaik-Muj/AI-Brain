// src/components/PDFChat.tsx
import { useState } from "react";
import { askPDFQuestion } from "../api/pdf";

interface PDFChatProps {
  pdfText: string;
  onAnswerHighlight: (highlights: string[]) => void;
  onSummary: (points: string[]) => void;
}

export default function PDFChat({
  pdfText,
  onAnswerHighlight,
  onSummary,
}: PDFChatProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await askPDFQuestion(question, pdfText);

    setAnswer(res.answer || res.error || "No answer");
    if (res.highlight) onAnswerHighlight(res.highlight);
    if (res.summary_points) onSummary(res.summary_points);
  };

  return (
    <div className="p-4 space-y-3">
      <form onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about the document..."
          className="border px-3 py-2 w-full"
        />
        <button className="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
          Ask
        </button>
      </form>

      {answer && (
        <div className="mt-4 bg-gray-100 p-4 rounded shadow">
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
