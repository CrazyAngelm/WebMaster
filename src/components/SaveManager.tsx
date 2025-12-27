// 📁 src/components/SaveManager.tsx - Save/Load UI
// 🎯 Core function: UI for exporting and importing game saves
// 🔗 Key dependencies: lucide-react, src/store/gameStore.ts

import React, { useRef } from 'react';
import { Download, Upload, Save } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const SaveManager: React.FC = () => {
  const { exportSave, importSave, saveGame } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = await exportSave();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hornygrad_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const success = await importSave(content);
      if (success) {
        alert('Save imported successfully!');
        window.location.reload(); // Reload to refresh state
      } else {
        alert('Failed to import save.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-4 bg-fantasy-surface/50 p-2 rounded border border-fantasy-border">
      <button 
        onClick={() => saveGame()}
        className="p-1 hover:text-fantasy-accent text-gray-400 transition-colors"
        title="Quick Save"
      >
        <Save size={16} />
      </button>
      <button 
        onClick={handleExport}
        className="p-1 hover:text-fantasy-accent text-gray-400 transition-colors"
        title="Export Save"
      >
        <Download size={16} />
      </button>
      <button 
        onClick={handleImportClick}
        className="p-1 hover:text-fantasy-accent text-gray-400 transition-colors"
        title="Import Save"
      >
        <Upload size={16} />
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />
    </div>
  );
};



