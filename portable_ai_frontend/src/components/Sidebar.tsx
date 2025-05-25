// src/components/Sidebar.tsx
import React from "react";

interface SidebarProps {
  models: string[];
  selectedModels: string[];
  onToggle: (model: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ models, selectedModels, onToggle }) => {
  return (
    <aside className="w-64 bg-white shadow-md p-4 hidden md:block">
      <h2 className="text-xl font-semibold mb-4">Select Models</h2>
      <div className="space-y-2">
        {models.map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedModels.includes(model)}
              onChange={() => onToggle(model)}
              className="mr-2"
            />
            <label>{model}</label>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
