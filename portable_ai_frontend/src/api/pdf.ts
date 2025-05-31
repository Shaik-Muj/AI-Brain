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

export const fetchGoogleResults = async (query: string): Promise<string[]> => {
  const res = await fetch(`http://localhost:8000/google-search?query=${encodeURIComponent(query)}`);
  return res.json();
};

export const fetchRAGResults = async (query: string): Promise<string[]> => {
  const res = await fetch(`http://localhost:8000/rag-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
};

export const fetchChatbotResponse = async (
  query: string,
  conversation: { role: string; content: string }[]
): Promise<string> => {
  try {
    const res = await fetch(`http://localhost:8000/search/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, conversation }), // Include conversation history
    });

    if (!res.ok) {
      console.error("Chatbot API returned an error:", res.status, res.statusText);
      throw new Error(`Chatbot API error: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Chatbot API response data:", data);
    return data.response || "No response from chatbot.";
  } catch (err) {
    console.error("Error in fetchChatbotResponse:", err);
    throw err;
  }
};
