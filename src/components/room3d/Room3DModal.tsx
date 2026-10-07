import React, { useState } from 'react';
import { Room, RoomScan, StylePackage } from '../../types';
import { Room3DViewer } from './Room3DViewer';
import { X, Sparkles, Sliders, Box, Move3d, Layers, ShieldCheck } from 'lucide-react';
import { STYLE_THEMES } from './materials';

export interface Room3DModalProps {
  room: Room;
  scan?: RoomScan | null;
  isOpen: boolean;
  onClose: () => void;
  initialStyle?: StylePackage;
  detectedWallCategory?: string;
  detectedFloorCategory?: string;
  detectedObjects?: Array<{ className: string; modelScore?: number }>;
}

export const Room3DModal: React.FC<Room3DModalProps> = ({
  room,
  scan,
  isOpen,
  onClose,
  initialStyle = 'MODERN',
  detectedWallCategory,
  detectedFloorCategory,
  detectedObjects = [],
}) => {
  const [selectedStyle, setSelectedStyle] = useState<StylePackage>(initialStyle);

  if (!isOpen) return null;

  // Extract dimensions
  const dimensions = {
    length: room.length || 5.0,
    width: room.width || 4.0,
    height: room.height || 2.8,
  };

  const currentTheme = STYLE_THEMES[selectedStyle] || STYLE_THEMES.MODERN;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 4 Parametric Spatial Rendering</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Move3d className="w-7 h-7 text-indigo-400" />
              <span>Interactive 3D Virtual Room</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Parametric 3D model generated from room dimensions & AI visual surface mapping for{' '}
              <strong className="text-slate-200">{room.name}</strong> ({room.type}).
            </p>
          </div>

          {/* Style Package Selector */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {(['STANDARD', 'MODERN', 'LUXURY'] as StylePackage[]).map((pkg) => (
              <button
                key={pkg}
                onClick={() => setSelectedStyle(pkg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedStyle === pkg
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>

        {/* Main 3D Viewport */}
        <Room3DViewer
          dimensions={dimensions}
          detectedWallCategory={detectedWallCategory}
          detectedFloorCategory={detectedFloorCategory}
          selectedStyle={selectedStyle}
          detectedObjects={detectedObjects}
          title={`${room.name} — Interactive 3D Virtual Room`}
        />

        {/* Footnote / Technical Disclaimer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Box className="w-3 h-3 text-indigo-400" />
              <span>Spatial Bounds</span>
            </span>
            <p className="text-xs font-bold text-white">
              {dimensions.length}m × {dimensions.width}m × {dimensions.height}m
            </p>
            <p className="text-[11px] text-slate-400">
              Total Area: {(dimensions.length * dimensions.width).toFixed(1)} m² (
              {((dimensions.length * dimensions.width) * 10.764).toFixed(0)} sq.ft)
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Theme Materials</span>
            </span>
            <p className="text-xs font-bold text-white">{currentTheme.name}</p>
            <p className="text-[11px] text-slate-400">
              Walls: {detectedWallCategory || 'Default Plaster'} | Floor: {detectedFloorCategory || 'Tile'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Engineering Classification</span>
            </span>
            <p className="text-xs font-bold text-emerald-400">Parametric 3D Virtual Model</p>
            <p className="text-[11px] text-slate-400">
              (Not a photogrammetric digital twin)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
