import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PromptEditor from "./components/PromptEditor";
import ResponseViewer from "./components/ResponseViewer";
import MultiModalTools from "./components/MultiModalTools";

// Phase 6: Talk to PDF components
import PDFUploader from "./components/PDFUploader";
import PDFChat from "./components/PDFChat";
import HighlightedText from "./components/HighlightedText";
import SummaryExport from "./components/SummaryExport";

const MODELS = ["openai", "ollama", "llama", "gemma"];

function App() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedModels, setSelectedModels] = useState<string[]>(MODELS);
  const [loadingModels, setLoadingModels] = useState<string[]>([]);

  // Phase 6: PDF-specific state
  const [pdfText, setPdfText] = useState("");
  const [pdfHighlights, setPdfHighlights] = useState<string[]>([]);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);

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
            <h2 className="text-xl font-semibold">Talk to a PDF</h2>

            {/* Upload and extract PDF text */}
            <PDFUploader onExtract={(text) => setPdfText(text)} />

            {/* Ask questions about uploaded PDF */}
            {typeof pdfText === "string" && pdfText.trim().length > 0 ? (
              <>
                <PDFChat
                  pdfText={pdfText}
                  onAnswerHighlight={(highlights) => setPdfHighlights(highlights)}
                  onSummary={(points) => setSummaryPoints(points)}
                />
                <HighlightedText text={pdfText} highlights={pdfHighlights} />
                <SummaryExport points={summaryPoints} />
              </>
            ) : null}
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
