// src/api/pdf.ts

const BASE_URL = "http://localhost:8000/pdf"; // adjust if needed

export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export async function askPDFQuestion(question: string, pdfText: string) {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, pdfText }),
  });
  return await res.json();
}

export const getPDFSummary = async () => {
  const res = await fetch(`${BASE_URL}/summary`);
  return res.json();
};
