import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room3DScene, Room3DSceneProps } from './Room3DScene';
import { Camera, RefreshCw, Eye, Move3d, Layers } from 'lucide-react';
import {
  SurfaceKey,
  SurfaceCustomizationMap,
  getDefaultSurfaceMap,
  MATERIAL_PRESETS,
} from './materials';
import { Room3DStudioInspector } from './Room3DStudioInspector';

export interface Room3DViewerProps extends Room3DSceneProps {
  title?: string;
  subtitle?: string;
  allowSurfaceEditing?: boolean;
  externalSurfaceMap?: SurfaceCustomizationMap | null;
  onSurfaceConfigChange?: (config: SurfaceCustomizationMap) => void;
}

type CameraPreset = '3D_ISOMETRIC' | 'TOP_DOWN' | 'INTERIOR';

export const Room3DViewer: React.FC<Room3DViewerProps> = (props) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('3D_ISOMETRIC');

  // Independent Surface Customization State
  const [surfaceMap, setSurfaceMap] = useState<SurfaceCustomizationMap>(() =>
    props.externalSurfaceMap ||
    getDefaultSurfaceMap(
      props.selectedStyle,
      props.detectedWallCategory,
      props.detectedFloorCategory
    )
  );

  const [selectedSurface, setSelectedSurface] = useState<SurfaceKey | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [hiddenObjectIds, setHiddenObjectIds] = useState<string[]>([]);

  const l = props.dimensions.length > 0 ? props.dimensions.length : 5.0;
  const w = props.dimensions.width > 0 ? props.dimensions.width : 4.0;
  const h = props.dimensions.height > 0 ? props.dimensions.height : 2.8;

  // Re-sync default map when external map, style, or vision detection changes
  useEffect(() => {
    if (props.externalSurfaceMap) {
      setSurfaceMap(props.externalSurfaceMap);
      props.onSurfaceConfigChange?.(props.externalSurfaceMap);
    } else {
      const initialMap = getDefaultSurfaceMap(
        props.selectedStyle,
        props.detectedWallCategory,
        props.detectedFloorCategory
      );
      setSurfaceMap(initialMap);
      props.onSurfaceConfigChange?.(initialMap);
    }
  }, [props.externalSurfaceMap, props.selectedStyle, props.detectedWallCategory, props.detectedFloorCategory]);

  // Derive camera position based on preset view
  let cameraPosition: [number, number, number] = [l * 1.4, h * 1.5, w * 1.6];
  if (cameraPreset === 'TOP_DOWN') {
    cameraPosition = [0, Math.max(l, w) * 1.8, 0.01];
  } else if (cameraPreset === 'INTERIOR') {
    cameraPosition = [0, h * 0.5, w * 0.4];
  }

  const handleSurfaceSelect = (surfaceName: string) => {
    if (surfaceName in surfaceMap) {
      setSelectedSurface(surfaceName as SurfaceKey);
      setSelectedObjectId(null);
    }
    props.onSelectSurface?.(surfaceName);
  };

  const handleObjectSelect = (objectId: string | null) => {
    setSelectedObjectId(objectId);
    if (objectId) {
      setSelectedSurface(null);
    }
  };

  const handleUpdateSurface = (
    surfaceKey: SurfaceKey,
    updates: Partial<SurfaceCustomizationMap[SurfaceKey]>
  ) => {
    setSurfaceMap((prev) => {
      const updated: SurfaceCustomizationMap = {
        ...prev,
        [surfaceKey]: {
          ...prev[surfaceKey],
          ...updates,
        },
      };
      props.onSurfaceConfigChange?.(updated);
      return updated;
    });
  };

  const handleResetSurface = (surfaceKey: SurfaceKey) => {
    const defaultMap = getDefaultSurfaceMap(
      props.selectedStyle,
      props.detectedWallCategory,
      props.detectedFloorCategory
    );
    handleUpdateSurface(surfaceKey, defaultMap[surfaceKey]);
  };

  const handleResetAll = () => {
    const defaultMap = getDefaultSurfaceMap(
      props.selectedStyle,
      props.detectedWallCategory,
      props.detectedFloorCategory
    );
    setSurfaceMap(defaultMap);
    setHiddenObjectIds([]);
    setSelectedObjectId(null);
    setSelectedSurface(null);
    props.onSurfaceConfigChange?.(defaultMap);
  };

  const handleToggleObjectVisibility = (objectId: string) => {
    setHiddenObjectIds((prev) =>
      prev.includes(objectId) ? prev.filter((id) => id !== objectId) : [...prev, objectId]
    );
  };

  return (
    <div className="relative w-full h-[540px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col group">
      {/* 3D Viewport Header Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Title & Badge */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <Move3d className="w-3.5 h-3.5 text-indigo-400" />
              <span>{props.title || 'Interactive 3D Virtual Studio'}</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Parametric Spatial Reconstruction ({l}m × {w}m × {h}m)
              {(!props.detectedObjects || props.detectedObjects.length === 0) && (
                <span className="ml-2 text-amber-400/90 font-medium border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  No indoor objects confidently detected
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Camera Angles & Controls Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg">
          <button
            onClick={() => setCameraPreset('3D_ISOMETRIC')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              cameraPreset === '3D_ISOMETRIC'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Isometric 3D View"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>3D Orbit</span>
          </button>

          <button
            onClick={() => setCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              cameraPreset === 'TOP_DOWN'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Top-Down Plan View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Floorplan</span>
          </button>

          <button
            onClick={() => setCameraPreset('INTERIOR')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              cameraPreset === 'INTERIOR'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Interior Eye-Level View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interior</span>
          </button>

          <button
            onClick={handleResetAll}
            className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
            title="Reset All Surfaces & Objects to AI Defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* R3F WebGL Canvas */}
      <div className="w-full h-full">
        <Canvas
          key={cameraPreset}
          camera={{ position: cameraPosition, fov: 50 }}
          shadows
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#020617');
          }}
        >
          <Room3DScene
            {...props}
            surfaceMap={surfaceMap}
            selectedSurfaceName={selectedSurface}
            onSelectSurface={handleSurfaceSelect}
            selectedObjectId={selectedObjectId}
            onSelectObject={handleObjectSelect}
            hiddenObjectIds={hiddenObjectIds}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={Math.max(l, w) * 3}
            maxPolarAngle={Math.PI / 2 + 0.05}
          />
        </Canvas>
      </div>

      {/* Interactive 3D Studio Inspector Sidebar Overlay */}
      {props.allowSurfaceEditing !== false && (
        <Room3DStudioInspector
          surfaceMap={surfaceMap}
          selectedSurfaceName={selectedSurface}
          onSelectSurface={(surf) => {
            setSelectedSurface(surf);
            setSelectedObjectId(null);
          }}
          onUpdateSurface={handleUpdateSurface}
          onResetSurface={handleResetSurface}
          onResetAll={handleResetAll}
          detectedObjects={props.detectedObjects}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleObjectSelect}
          hiddenObjectIds={hiddenObjectIds}
          onToggleObjectVisibility={handleToggleObjectVisibility}
        />
      )}

      {/* Interactive Guidance Footer */}
      <div className="absolute bottom-3 left-4 z-0 text-[10px] text-slate-500 font-mono pointer-events-none group-hover:opacity-100 opacity-60 transition">
        Left-click drag to rotate • Right-click drag to pan • Scroll to zoom • Click surfaces or objects to inspect
      </div>
    </div>
  );
};

