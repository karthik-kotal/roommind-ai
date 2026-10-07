import React, { useState } from 'react';
import { LayoutGrid, Plus, Move } from 'lucide-react';

interface Element2D {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const FloorPlanner: React.FC = () => {
  const [elements, setElements] = useState<Element2D[]>([
    { id: '1', name: 'Bed Frame', x: 50, y: 50, width: 120, height: 140, color: '#6366f1' },
    { id: '2', name: 'Study Desk', x: 220, y: 50, width: 100, height: 60, color: '#10b981' },
    { id: '3', name: 'Wardrobe', x: 50, y: 220, width: 140, height: 60, color: '#f59e0b' },
  ]);

  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const handleAddElement = () => {
    const newEl: Element2D = {
      id: Date.now().toString(),
      name: 'Custom Furniture',
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      color: '#ec4899',
    };
    setElements([...elements, newEl]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            <span>Interactive 2D Floor Plan Canvas</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Legacy 2D layout drafting widget (Preserved feature)
          </p>
        </div>
        <button
          onClick={handleAddElement}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold hover:bg-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Element</span>
        </button>
      </div>

      {/* Grid Canvas Container */}
      <div className="relative w-full h-[320px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
        {elements.map((el) => (
          <div
            key={el.id}
            onClick={() => setActiveElementId(el.id)}
            className={`absolute rounded-lg border-2 flex items-center justify-center p-2 text-center text-xs font-bold transition shadow-lg cursor-grab active:cursor-grabbing ${
              activeElementId === el.id ? 'border-white ring-2 ring-indigo-500/50' : 'border-transparent'
            }`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
              backgroundColor: el.color,
              color: '#ffffff',
            }}
          >
            <span className="truncate">{el.name}</span>
          </div>
        ))}

        <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-900/90 border border-white/10 rounded-full text-[10px] text-slate-400">
          Scale: 1m = 40px
        </div>
      </div>
    </div>
  );
};
