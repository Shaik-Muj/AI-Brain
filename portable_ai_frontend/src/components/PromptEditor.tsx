// src/components/PromptEditor.tsx
import React from "react";

interface PromptEditorProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, setPrompt, onSubmit }) => {
  return (
    <div className="bg-white p-4 shadow-md rounded-xl">
      <textarea
        className="w-full p-2 border border-gray-300 rounded-md"
        placeholder="Enter your prompt..."
        rows={5}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={onSubmit}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Submit Prompt
      </button>
    </div>
  );
};

export default PromptEditor;
