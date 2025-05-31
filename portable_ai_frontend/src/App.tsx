import { useState, useEffect } from "react"; // Added useEffect
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PromptEditor from "./components/PromptEditor";
import ResponseViewer from "./components/ResponseViewer";
import MultiModalTools from "./components/MultiModalTools";

// Phase 6: Talk to PDF components
import PDFUploader from "./components/PDFUploader";
// import HighlightedText from "./components/HighlightedText"; // No longer primary
// import SummaryExport from "./components/SummaryExport"; // No longer primary

const MODELS = ["openai", "ollama", "llama", "gemma"];

function App() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedModels, setSelectedModels] = useState<string[]>(MODELS);
  const [loadingModels, setLoadingModels] = useState<string[]>([]);
  
  // Phase 6: PDF-specific state
  const [pdfText, setPdfText] = useState("");

  // Log pdfText when it changes
  useEffect(() => {
    console.log("App.tsx: pdfText state changed to:", pdfText);
  }, [pdfText]);

  const handleToggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    );
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;

    setResponses({});
    setLoadingModels([...selectedModels]);

    await Promise.all(
      selectedModels.map(async (model) => {
        try {
          const res = await fetch("http://localhost:8000/prompt/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, model }),
          });

          const data = await res.json();
          setResponses((prev) => ({ ...prev, [model]: data.response }));
        } catch (error) {
          setResponses((prev) => ({
            ...prev,
            [model]: `Error: ${(error as Error).message}`,
          }));
        } finally {
          setLoadingModels((prev) => prev.filter((m) => m !== model));
        }
      })
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          models={MODELS}
          selectedModels={selectedModels}
          onToggle={handleToggleModel}
        />
        <main className="flex-1 p-4 space-y-4">

          {/* Phase 5: Vision + Video tools */}
          <MultiModalTools
            onVisionCaption={setPrompt}
            onVideoExtract={setPrompt}
          />

          {/* ✅ Phase 6: PDF Tools */}
          <section className="space-y-4 bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Talk to a PDF</h2>            {/* Upload and extract PDF text */}
            <PDFUploader 
              pdfText={pdfText} // Pass the pdfText state
              onExtract={(text) => {
              console.log("App.tsx: PDFUploader extracted text:", text); // Log extracted text
              setPdfText(text);
            }} />
            
            {/* The PDFChatRedesigned component is now rendered by PDFChatPopup, triggered from PDFUploader */}
            {/* So, we no longer render it directly here. */}
            {/* We can keep the conditional message for when no PDF is loaded, if desired. */}
            {!(typeof pdfText === "string" && pdfText.trim().length > 0) && (
              <p className="text-gray-500">Upload a PDF to start chatting with it.</p>
            )}
          </section>

          {/* Prompt editor and results for general LLM prompts */}
          <PromptEditor
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handlePromptSubmit}
          />
          <ResponseViewer
            responses={responses}
            loadingModels={loadingModels}
          />

        </main>
      </div>
    </div>
  );
}

export default App;
