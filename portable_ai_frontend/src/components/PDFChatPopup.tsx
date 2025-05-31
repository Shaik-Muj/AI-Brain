import React from "react";
// import { fetchChatbotResponse } from "../api/pdf"; // No longer needed here
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
// import SimpleSuggestions from "./SimpleSuggestions"; // No longer needed here
import PDFChatRedesigned from "./PDFChatRedesigned"; // Import the main chat component

interface PDFChatPopupProps {
  pdfUrl: string; // URL or path to the PDF file
  pdfText: string; // Full text of the PDF for the chat
  onClose: () => void;
}

// Interface Message is no longer needed here as PDFChatRedesigned handles its own messages
// interface Message {
//   role: "user" | "chatbot";
//   content: string;
// }

const PDFChatPopup: React.FC<PDFChatPopupProps> = ({ pdfUrl, pdfText, onClose }) => {
  // Remove states and functions related to the old inline chat, as PDFChatRedesigned handles this
  // const [conversation, setConversation] = useState<Message[]>([]); 
  // const [loading, setLoading] = useState<boolean>(false);
  // const [prompt, setPrompt] = useState<string>("");

  const zoomPluginInstance = zoomPlugin();
  const ZoomIn = zoomPluginInstance.ZoomIn;
  const ZoomOut = zoomPluginInstance.ZoomOut;

  // fetchChatbotResults is no longer needed here
  // handleTextSelection is no longer needed here (PDFChatRedesigned might have its own way or not use it)
  // handleAskChatbot is no longer needed here

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white w-5/6 h-5/6 p-4 rounded-lg flex shadow-xl">
        {/* Left Pane: PDF Viewer */}
        <div className="w-1/2 border-r p-4 overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">PDF Viewer</h2>
            <button onClick={onClose} className="text-red-500 hover:text-red-700 font-semibold">Close</button>
          </div>
          <div
            className="border p-4 rounded-lg bg-gray-100 flex-grow"
            // onMouseUp={handleTextSelection} // Removed, PDFChatRedesigned handles its input
          >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={pdfUrl} plugins={[zoomPluginInstance]} />
            </Worker>
          </div>
          <div className="mt-4 flex space-x-2 justify-center">
            <ZoomIn>
              {(props) => (
                <button
                  onClick={props.onClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Zoom In
                </button>
              )}
            </ZoomIn>
            <ZoomOut>
              {(props) => (
                <button
                  onClick={props.onClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Zoom Out
                </button>
              )}
            </ZoomOut>
          </div>
        </div>

        {/* Right Pane: Chatbot - Now using PDFChatRedesigned */}
        <div className="w-1/2 p-4 flex flex-col">
          {/* The yellow banner can be removed if no longer needed for debugging this specific component 
          <div style={{
            backgroundColor: '#ffcc00',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '22px',
            padding: '16px',
            textAlign: 'center',
            border: '4px solid #ff0000',
            marginBottom: '16px',
            zIndex: 9999
          }}>
            PDFChatPopup COMPONENT IS MOUNTED
          </div>
          */}
          <PDFChatRedesigned pdfText={pdfText} />
        </div>
      </div>
    </div>
  );
};

export default PDFChatPopup;
