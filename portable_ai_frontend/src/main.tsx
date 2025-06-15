import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import YoutubeSummarizationPage from "./components/YoutubeSummarizationPage";
import ImageAnalysisPage from "./components/ImageAnalysisPage";
import PDFChatUploadPage from "./components/PDFChatUploadPage";
import "./index.css"; // Tailwind import
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker - this should be done once in the application
import { pdfjs } from 'react-pdf';

// Use a CDN-hosted worker for reliability across environments that matches our package version (4.8.69)
const workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Log for debugging
console.log("PDF.js worker configured globally with source:", workerSrc);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/youtube"
          element={
            <YoutubeSummarizationPage onBack={() => window.history.back()} />
          }
        />
        <Route
          path="/image-analysis"
          element={<ImageAnalysisPage onBack={() => window.history.back()} />}
        />        <Route
          path="/pdf-chat"
          element={<PDFChatUploadPage onBack={() => window.history.back()} />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
