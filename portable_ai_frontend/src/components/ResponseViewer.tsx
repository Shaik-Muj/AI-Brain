import React from "react";

interface Props {
  responses: Record<string, string>;
  loadingModels: string[];
}

const ResponseViewer: React.FC<Props> = ({ responses, loadingModels }) => {
  const isLoading = (model: string) => loadingModels.includes(model);

  return (
    <div className="space-y-4">
      {Object.entries(responses).map(([model, response]) => (
        <div key={model} className="p-4 bg-white shadow rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-lg capitalize">{model}</span>
            {isLoading(model) && (
              <span className="text-sm text-blue-600 animate-pulse">Loading...</span>
            )}
            {!isLoading(model) && response.startsWith("Error") && (
              <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">Error</span>
            )}
          </div>

          <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap overflow-x-auto">
            <code>{response}</code>
          </pre>
        </div>
      ))}
    </div>
  );
};

export default ResponseViewer;
