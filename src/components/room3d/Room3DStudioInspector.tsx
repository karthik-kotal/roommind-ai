import React, { useState } from 'react';
import {
  SurfaceKey,
  SurfaceCustomizationMap,
  MaterialPresetKey,
  MATERIAL_PRESETS,
} from './materials';
import {
  Palette,
  Sliders,
  RotateCcw,
  Eye,
  EyeOff,
  Box,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export interface Room3DStudioInspectorProps {
  surfaceMap: SurfaceCustomizationMap;
  selectedSurfaceName: string | null;
  onSelectSurface: (surfaceName: SurfaceKey) => void;
  onUpdateSurface: (
    surfaceKey: SurfaceKey,
    updates: Partial<SurfaceCustomizationMap[SurfaceKey]>
  ) => void;
  onResetSurface: (surfaceKey: SurfaceKey) => void;
  onResetAll: () => void;
  detectedObjects?: Array<{
    className: string;
    modelScore?: number;
  }>;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  hiddenObjectIds: string[];
  onToggleObjectVisibility: (objectId: string) => void;
}

const SURFACE_LABELS: Record<SurfaceKey, string> = {
  WALL_NORTH: 'North Wall (Back)',
  WALL_WEST: 'West Wall (Left)',
  WALL_EAST: 'East Wall (Right)',
  FLOOR: 'Floor Surface',
  CEILING: 'Ceiling Surface',
};

const COLOR_SWATCHES = [
  '#f8fafc', // Soft White
  '#f5f2eb', // Plaster Beige
  '#94a3b8', // Slate Grey
  '#1e293b', // Deep Charcoal
  '#8b5a2b', // Oak Timber
  '#451a03', // Dark Mahogany
  '#10b981', // Emerald Green
  '#3b82f6', // Cobalt Blue
  '#b91c1c', // Terracotta Red
  '#f59e0b', // Amber Gold
];

export const Room3DStudioInspector: React.FC<Room3DStudioInspectorProps> = ({
  surfaceMap,
  selectedSurfaceName,
  onSelectSurface,
  onUpdateSurface,
  onResetSurface,
  onResetAll,
  detectedObjects = [],
  selectedObjectId,
  onSelectObject,
  hiddenObjectIds,
  onToggleObjectVisibility,
}) => {
  const [activeTab, setActiveTab] = useState<'SURFACES' | 'OBJECTS'>('SURFACES');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const currentSurfaceKey: SurfaceKey =
    selectedSurfaceName && selectedSurfaceName in surfaceMap
      ? (selectedSurfaceName as SurfaceKey)
      : 'WALL_NORTH';

  const currentSurfaceConfig = surfaceMap[currentSurfaceKey];

  return (
    <div
      className={`absolute bottom-4 right-4 z-20 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl transition-all duration-300 ${
        isCollapsed ? 'h-12 overflow-hidden' : 'max-h-[80vh] flex flex-col'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-950/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white tracking-wide uppercase">
            3D Studio Inspector
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetAll}
            className="px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition flex items-center gap-1 border border-slate-800"
            title="Reset All Surfaces to Default AI Theme"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tab Controls */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('SURFACES')}
              className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'SURFACES'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Surfaces</span>
            </button>
            <button
              onClick={() => setActiveTab('OBJECTS')}
              className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'OBJECTS'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>YOLO Objects ({detectedObjects.length})</span>
            </button>
          </div>

          {/* TAB 1: SURFACES INSPECTOR */}
          {activeTab === 'SURFACES' && (
            <div className="space-y-4">
              {/* Surface Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Surface to Edit
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(SURFACE_LABELS) as SurfaceKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => onSelectSurface(key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        currentSurfaceKey === key
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {SURFACE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Material Finish Preset
                </label>
                <select
                  value={currentSurfaceConfig.materialPreset}
                  onChange={(e) => {
                    const presetKey = e.target.value as MaterialPresetKey;
                    const preset = MATERIAL_PRESETS[presetKey];
                    onUpdateSurface(currentSurfaceKey, {
                      materialPreset: presetKey,
                      color: preset.defaultColor,
                      roughness: preset.roughness,
                      metalness: preset.metalness,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                >
                  {(Object.keys(MATERIAL_PRESETS) as MaterialPresetKey[]).map((pKey) => (
                    <option key={pKey} value={pKey}>
                      {MATERIAL_PRESETS[pKey].name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 italic">
                  {MATERIAL_PRESETS[currentSurfaceConfig.materialPreset].description}
                </p>
              </div>

              {/* Color Swatches & Hex Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Surface Paint / Finish Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-300">
                      {currentSurfaceConfig.color}
                    </span>
                    <input
                      type="color"
                      value={currentSurfaceConfig.color}
                      onChange={(e) =>
                        onUpdateSurface(currentSurfaceKey, { color: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {COLOR_SWATCHES.map((swatchColor) => (
                    <button
                      key={swatchColor}
                      onClick={() =>
                        onUpdateSurface(currentSurfaceKey, { color: swatchColor })
                      }
                      className={`w-6 h-6 rounded-lg border transition ${
                        currentSurfaceConfig.color.toLowerCase() === swatchColor.toLowerCase()
                          ? 'ring-2 ring-indigo-400 border-white scale-110'
                          : 'border-slate-800 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatchColor }}
                    />
                  ))}
                </div>
              </div>

              {/* Fine PBR Sliders: Roughness & Metalness */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Surface Roughness</span>
                    <span className="font-mono text-indigo-400">
                      {currentSurfaceConfig.roughness.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={currentSurfaceConfig.roughness}
                    onChange={(e) =>
                      onUpdateSurface(currentSurfaceKey, {
                        roughness: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Reflective Metalness</span>
                    <span className="font-mono text-indigo-400">
                      {currentSurfaceConfig.metalness.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={currentSurfaceConfig.metalness}
                    onChange={(e) =>
                      onUpdateSurface(currentSurfaceKey, {
                        metalness: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Reset Single Surface Button */}
              <button
                onClick={() => onResetSurface(currentSurfaceKey)}
                className="w-full py-2 text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset {SURFACE_LABELS[currentSurfaceKey]}</span>
              </button>
            </div>
          )}

          {/* TAB 2: DETECTED OBJECTS INSPECTOR */}
          {activeTab === 'OBJECTS' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                <span className="font-bold">Parametric Representation Notice:</span> Detected objects
                are converted into 3D parametric floor bounding volumes. (Not photogrammetrically reconstructed).
              </div>

              {detectedObjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No indoor furniture items detected by YOLO model in this scan.
                </div>
              ) : (
                <div className="space-y-2">
                  {detectedObjects.map((obj, idx) => {
                    const cls = obj.className.toLowerCase();
                    const objId = `det-${idx}-${cls.replace(/\s+/g, '_')}`;
                    const isHidden = hiddenObjectIds.includes(objId);
                    const isSelected = selectedObjectId === objId;

                    return (
                      <div
                        key={objId}
                        onClick={() => onSelectObject(objId)}
                        className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500/50 shadow'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Box className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                          <div>
                            <p className="text-xs font-bold text-white capitalize">{obj.className}</p>
                            <p className="text-[10px] text-slate-400">
                              YOLO Confidence:{' '}
                              <strong className="text-indigo-300">
                                {obj.modelScore ? `${(obj.modelScore * 100).toFixed(1)}%` : 'Verified'}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleObjectVisibility(objId);
                          }}
                          className={`p-1.5 rounded-lg border transition ${
                            isHidden
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title={isHidden ? 'Show Object in 3D' : 'Hide Object in 3D'}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
