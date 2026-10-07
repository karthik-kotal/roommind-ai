import React, { useMemo } from 'react';
import * as THREE from 'three';
import { StylePackage } from '../../types';
import {
  STYLE_THEMES,
  getSurfaceColor,
  getFurnitureColor,
  SurfaceCustomizationMap,
  getDefaultSurfaceMap,
} from './materials';

export interface Room3DSceneProps {
  dimensions: {
    length: number; // In meters or feet (e.g. 5m)
    width: number;  // In meters or feet (e.g. 4m)
    height: number; // In meters or feet (e.g. 2.8m)
  };
  detectedWallCategory?: string;
  detectedFloorCategory?: string;
  selectedStyle?: StylePackage;
  detectedObjects?: Array<{
    className: string;
    modelScore?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  onSelectSurface?: (surfaceName: string) => void;
  selectedSurfaceName?: string | null;
  surfaceMap?: SurfaceCustomizationMap;
  selectedObjectId?: string | null;
  onSelectObject?: (objectId: string | null) => void;
  hiddenObjectIds?: string[];
  customColors?: Record<string, string>;
}

export const Room3DScene: React.FC<Room3DSceneProps> = ({
  dimensions,
  detectedWallCategory,
  detectedFloorCategory,
  selectedStyle = 'MODERN',
  detectedObjects = [],
  onSelectSurface,
  selectedSurfaceName,
  surfaceMap,
  selectedObjectId,
  onSelectObject,
  hiddenObjectIds = [],
  customColors = {},
}) => {
  // Normalize dimensions (default to standard room if 0/invalid)
  const l = dimensions.length > 0 ? dimensions.length : 5.0;
  const w = dimensions.width > 0 ? dimensions.width : 4.0;
  const h = dimensions.height > 0 ? dimensions.height : 2.8;

  // Active Theme Base Colors & Default Map fallback
  const theme = STYLE_THEMES[selectedStyle] || STYLE_THEMES.MODERN;
  const defaultMap = useMemo(
    () => getDefaultSurfaceMap(selectedStyle, detectedWallCategory, detectedFloorCategory),
    [selectedStyle, detectedWallCategory, detectedFloorCategory]
  );

  const activeMap = surfaceMap || defaultMap;

  // Per-surface independent customization values (overridden by customColors legacy fallback if present)
  const northWall = {
    color: customColors['WALL_NORTH'] || customColors['WALL'] || activeMap.WALL_NORTH.color,
    roughness: activeMap.WALL_NORTH.roughness,
    metalness: activeMap.WALL_NORTH.metalness,
  };

  const westWall = {
    color: customColors['WALL_WEST'] || customColors['WALL'] || activeMap.WALL_WEST.color,
    roughness: activeMap.WALL_WEST.roughness,
    metalness: activeMap.WALL_WEST.metalness,
  };

  const eastWall = {
    color: customColors['WALL_EAST'] || customColors['WALL'] || activeMap.WALL_EAST.color,
    roughness: activeMap.WALL_EAST.roughness,
    metalness: activeMap.WALL_EAST.metalness,
  };

  const floor = {
    color: customColors['FLOOR'] || activeMap.FLOOR.color,
    roughness: activeMap.FLOOR.roughness,
    metalness: activeMap.FLOOR.metalness,
  };

  const ceiling = {
    color: customColors['CEILING'] || activeMap.CEILING.color,
    roughness: activeMap.CEILING.roughness,
    metalness: activeMap.CEILING.metalness,
  };

  // Create furniture meshes derived from detected objects
  const furnitureItems = useMemo(() => {
    if (!detectedObjects || detectedObjects.length === 0) {
      return [];
    }

    // Map detected YOLOv8 objects to 3D room floor coordinates
    return detectedObjects.map((obj, idx) => {
      const cls = obj.className.toLowerCase();
      // Heuristic position mapping across floor plane [-l/2..l/2, -w/2..w/2]
      const spreadX = ((idx % 3) - 1) * (l * 0.28);
      const spreadZ = (Math.floor(idx / 3) - 0.5) * (w * 0.3);

      let size: [number, number, number] = [0.8, 0.8, 0.8];
      let posY = 0.4;

      if (cls.includes('sofa') || cls.includes('couch')) {
        size = [1.8, 0.85, 0.9];
        posY = 0.425;
      } else if (cls.includes('bed')) {
        size = [2.0, 0.6, 1.6];
        posY = 0.3;
      } else if (cls.includes('table') || cls.includes('desk')) {
        size = [1.4, 0.75, 0.8];
        posY = 0.375;
      } else if (cls.includes('chair')) {
        size = [0.65, 0.85, 0.65];
        posY = 0.425;
      } else if (cls.includes('plant')) {
        size = [0.45, 1.1, 0.45];
        posY = 0.55;
      } else if (cls.includes('lamp')) {
        size = [0.35, 1.5, 0.35];
        posY = 0.75;
      } else if (cls.includes('window') || cls.includes('door')) {
        size = [0.9, 1.8, 0.15];
        posY = 0.9;
      }

      return {
        id: `det-${idx}-${cls.replace(/\s+/g, '_')}`,
        className: obj.className,
        modelScore: obj.modelScore,
        position: [spreadX, posY, spreadZ] as [number, number, number],
        size,
      };
    });
  }, [detectedObjects, l, w]);

  return (
    <group>
      {/* Lighting Setup */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[l, h * 1.5, w]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-l, h, -w]} intensity={0.3} />
      <pointLight position={[0, h - 0.3, 0]} intensity={0.6} color="#fef08a" />

      {/* FLOOR PLANE */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface?.('FLOOR');
        }}
      >
        <planeGeometry args={[l, w]} />
        <meshStandardMaterial
          color={floor.color}
          roughness={floor.roughness}
          metalness={floor.metalness}
          emissive={selectedSurfaceName === 'FLOOR' ? '#3b82f6' : '#000000'}
          emissiveIntensity={selectedSurfaceName === 'FLOOR' ? 0.25 : 0}
        />
      </mesh>

      {/* CEILING PLANE */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, h, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface?.('CEILING');
        }}
      >
        <planeGeometry args={[l, w]} />
        <meshStandardMaterial
          color={ceiling.color}
          roughness={ceiling.roughness}
          metalness={ceiling.metalness}
          emissive={selectedSurfaceName === 'CEILING' ? '#3b82f6' : '#000000'}
          emissiveIntensity={selectedSurfaceName === 'CEILING' ? 0.25 : 0}
        />
      </mesh>

      {/* BACK WALL (NORTH) */}
      <mesh
        position={[0, h / 2, -w / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface?.('WALL_NORTH');
        }}
      >
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial
          color={northWall.color}
          roughness={northWall.roughness}
          metalness={northWall.metalness}
          emissive={selectedSurfaceName === 'WALL_NORTH' ? '#3b82f6' : '#000000'}
          emissiveIntensity={selectedSurfaceName === 'WALL_NORTH' ? 0.25 : 0}
        />
      </mesh>

      {/* LEFT WALL (WEST) */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-l / 2, h / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface?.('WALL_WEST');
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={westWall.color}
          roughness={westWall.roughness}
          metalness={westWall.metalness}
          emissive={selectedSurfaceName === 'WALL_WEST' ? '#3b82f6' : '#000000'}
          emissiveIntensity={selectedSurfaceName === 'WALL_WEST' ? 0.25 : 0}
        />
      </mesh>

      {/* RIGHT WALL (EAST) */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[l / 2, h / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface?.('WALL_EAST');
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={eastWall.color}
          roughness={eastWall.roughness}
          metalness={eastWall.metalness}
          emissive={selectedSurfaceName === 'WALL_EAST' ? '#3b82f6' : '#000000'}
          emissiveIntensity={selectedSurfaceName === 'WALL_EAST' ? 0.25 : 0}
        />
      </mesh>

      {/* BASEBOARD TRIMS */}
      <mesh position={[0, 0.05, -w / 2 + 0.02]}>
        <boxGeometry args={[l, 0.1, 0.04]} />
        <meshStandardMaterial color={theme.trimColor} />
      </mesh>
      <mesh position={[-l / 2 + 0.02, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.1, w]} />
        <meshStandardMaterial color={theme.trimColor} />
      </mesh>
      <mesh position={[l / 2 - 0.02, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.1, w]} />
        <meshStandardMaterial color={theme.trimColor} />
      </mesh>

      {/* WINDOW CUTOUT FRAME ON NORTH WALL */}
      <group position={[l * 0.2, h * 0.55, -w / 2 + 0.05]}>
        <mesh>
          <boxGeometry args={[1.2, 1.2, 0.08]} />
          <meshStandardMaterial color={theme.trimColor} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.0, 1.0]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} roughness={0.1} />
        </mesh>
      </group>

      {/* DOOR CUTOUT FRAME ON WEST WALL */}
      <group position={[-l / 2 + 0.05, h * 0.4, w * 0.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 2.0, 0.08]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.8, 1.9]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} />
        </mesh>
      </group>

      {/* PARAMETRIC FURNITURE MESHES FROM YOLO DETECTIONS */}
      {furnitureItems.map((item) => {
        const isHidden = hiddenObjectIds.includes(item.id);
        if (isHidden) return null;

        const isSelected = selectedObjectId === item.id;
        const itemColor = getFurnitureColor(item.className);

        return (
          <group
            key={item.id}
            position={item.position}
            onClick={(e) => {
              e.stopPropagation();
              onSelectObject?.(item.id);
            }}
          >
            {/* Main Object Box Mesh */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={item.size} />
              <meshStandardMaterial
                color={itemColor}
                roughness={0.4}
                metalness={0.1}
                emissive={isSelected ? '#8b5cf6' : '#000000'}
                emissiveIntensity={isSelected ? 0.4 : 0}
              />
            </mesh>

            {/* Selection Highlight Wireframe Box */}
            {isSelected && (
              <mesh>
                <boxGeometry args={[item.size[0] * 1.05, item.size[1] * 1.05, item.size[2] * 1.05]} />
                <meshBasicMaterial color="#a78bfa" wireframe />
              </mesh>
            )}

            {/* Subtle Base Anchor */}
            <mesh position={[0, -item.size[1] / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[item.size[0] * 1.1, item.size[2] * 1.1]} />
              <meshBasicMaterial color="#0f172a" transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

