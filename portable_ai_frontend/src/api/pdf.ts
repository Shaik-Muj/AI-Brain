// src/api/pdf.ts

const BASE_URL = "http://localhost:8000/pdf"; // adjust if needed

export const uploadPDF = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    console.log("Uploading PDF:", file.name, "size:", file.size, "bytes");
    
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to upload PDF: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Failed to upload PDF: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("PDF upload response:", data);
    
    // Validate that we got a proper PDF ID back
    if (!data.pdf_id || typeof data.pdf_id !== 'string' || data.pdf_id.trim() === '') {
      console.error("Invalid PDF ID received from server:", data.pdf_id);
      throw new Error("Server did not return a valid PDF ID");
    }
    
    // Log the success with the file ID for debugging
    console.log(`PDF uploaded successfully. Server assigned ID: ${data.pdf_id}`);
    
    return data;
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
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

export const getPDFById = async (pdfId: string) => {
  const res = await fetch(`${BASE_URL}/get-pdf/${pdfId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch PDF with ID: ${pdfId}`);
  }
  return res.blob();
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
