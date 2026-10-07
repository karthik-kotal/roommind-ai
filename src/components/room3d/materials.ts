import * as THREE from 'three';
import { StylePackage } from '../../types';

export type MaterialPresetKey =
  | 'MATTE_PAINT'
  | 'SATIN_PAINT'
  | 'HARDWOOD'
  | 'CERAMIC_TILE'
  | 'ITALIAN_MARBLE'
  | 'EXPOSED_BRICK'
  | 'WALLPAPER';

export interface MaterialPreset {
  name: string;
  defaultColor: string;
  roughness: number;
  metalness: number;
  description: string;
}

export const MATERIAL_PRESETS: Record<MaterialPresetKey, MaterialPreset> = {
  MATTE_PAINT: {
    name: 'Matte Interior Paint',
    defaultColor: '#f1f5f9',
    roughness: 0.85,
    metalness: 0.0,
    description: 'Flat, non-reflective interior wall paint finish',
  },
  SATIN_PAINT: {
    name: 'Satin Sheen Paint',
    defaultColor: '#e2e8f0',
    roughness: 0.45,
    metalness: 0.05,
    description: 'Subtle pearl-like sheen with smooth reflectance',
  },
  HARDWOOD: {
    name: 'Scandinavian Oak Hardwood',
    defaultColor: '#8b5a2b',
    roughness: 0.4,
    metalness: 0.02,
    description: 'Warm natural timber wood planking',
  },
  CERAMIC_TILE: {
    name: 'Ceramic Floor Tile',
    defaultColor: '#cbd5e1',
    roughness: 0.25,
    metalness: 0.1,
    description: 'Glazed porcelain tile finish',
  },
  ITALIAN_MARBLE: {
    name: 'Polished Italian Marble',
    defaultColor: '#334155',
    roughness: 0.15,
    metalness: 0.25,
    description: 'High-gloss polished natural stone finish',
  },
  EXPOSED_BRICK: {
    name: 'Exposed Terracotta Brick',
    defaultColor: '#b91c1c',
    roughness: 0.9,
    metalness: 0.0,
    description: 'Textured rustic masonry finish',
  },
  WALLPAPER: {
    name: 'Patterned Wall Covering',
    defaultColor: '#cbd5e1',
    roughness: 0.7,
    metalness: 0.0,
    description: 'Textured decorative wall covering',
  },
};

export interface SurfaceCustomization {
  materialPreset: MaterialPresetKey;
  color: string;
  roughness: number;
  metalness: number;
}

export type SurfaceKey = 'WALL_NORTH' | 'WALL_WEST' | 'WALL_EAST' | 'FLOOR' | 'CEILING';

export type SurfaceCustomizationMap = Record<SurfaceKey, SurfaceCustomization>;

export interface SurfaceTheme {
  name: string;
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  trimColor: string;
  accentColor: string;
  roughness: number;
  metalness: number;
}

export const STYLE_THEMES: Record<StylePackage, SurfaceTheme> = {
  STANDARD: {
    name: 'Standard Durable',
    wallColor: '#e2e8f0', // Soft off-white
    floorColor: '#94a3b8', // Slate grey tile
    ceilingColor: '#f8fafc',
    trimColor: '#64748b',
    accentColor: '#3b82f6',
    roughness: 0.6,
    metalness: 0.1,
  },
  MODERN: {
    name: 'Japandi Zen Minimalist',
    wallColor: '#f5f2eb', // Warm plaster beige
    floorColor: '#a8896c', // Light Scandinavian oak wood
    ceilingColor: '#faf8f5',
    trimColor: '#4a3b32',
    accentColor: '#10b981',
    roughness: 0.4,
    metalness: 0.05,
  },
  LUXURY: {
    name: 'Luxury Dark Marble & Brass',
    wallColor: '#1e293b', // Deep charcoal / dark wall
    floorColor: '#334155', // Polished dark stone / marble tile
    ceilingColor: '#0f172a',
    trimColor: '#f59e0b', // Warm brass accent trim
    accentColor: '#8b5cf6',
    roughness: 0.2,
    metalness: 0.3,
  },
};

export function getDefaultSurfaceMap(
  selectedStyle: StylePackage = 'MODERN',
  detectedWallCategory?: string,
  detectedFloorCategory?: string
): SurfaceCustomizationMap {
  const theme = STYLE_THEMES[selectedStyle] || STYLE_THEMES.MODERN;
  const initialWallColor = getSurfaceColor(detectedWallCategory, theme.wallColor);
  const initialFloorColor = getSurfaceColor(detectedFloorCategory, theme.floorColor);

  return {
    WALL_NORTH: {
      materialPreset: 'MATTE_PAINT',
      color: initialWallColor,
      roughness: theme.roughness,
      metalness: theme.metalness,
    },
    WALL_WEST: {
      materialPreset: 'MATTE_PAINT',
      color: initialWallColor,
      roughness: theme.roughness,
      metalness: theme.metalness,
    },
    WALL_EAST: {
      materialPreset: 'MATTE_PAINT',
      color: initialWallColor,
      roughness: theme.roughness,
      metalness: theme.metalness,
    },
    FLOOR: {
      materialPreset: detectedFloorCategory?.toLowerCase().includes('wood') ? 'HARDWOOD' : 'CERAMIC_TILE',
      color: initialFloorColor,
      roughness: theme.roughness,
      metalness: theme.metalness,
    },
    CEILING: {
      materialPreset: 'MATTE_PAINT',
      color: theme.ceilingColor,
      roughness: 0.9,
      metalness: 0.0,
    },
  };
}

// Maps vision surface strings (e.g. "painted wall", "wood-like flooring") to hexadecimal colors
export function getSurfaceColor(category?: string, defaultColor: string = '#cbd5e1'): string {
  if (!category) return defaultColor;
  const lower = category.toLowerCase();

  if (lower.includes('wood') || lower.includes('hardwood') || lower.includes('timber') || lower.includes('laminate')) {
    return '#8b5a2b';
  }
  if (lower.includes('tile') || lower.includes('ceramic') || lower.includes('marble')) {
    return '#cbd5e1';
  }
  if (lower.includes('carpet') || lower.includes('rug')) {
    return '#64748b';
  }
  if (lower.includes('concrete') || lower.includes('cement')) {
    return '#78716c';
  }
  if (lower.includes('plaster') || lower.includes('beige') || lower.includes('cream')) {
    return '#f3eed9';
  }
  if (lower.includes('brick') || lower.includes('exposed')) {
    return '#b91c1c';
  }
  if (lower.includes('dark') || lower.includes('charcoal')) {
    return '#1e293b';
  }
  if (lower.includes('wallpaper') || lower.includes('pattern')) {
    return '#e2e8f0';
  }
  return defaultColor;
}

export function getFurnitureColor(className?: string): string {
  if (!className) return '#64748b';
  const lower = className.toLowerCase();
  if (lower.includes('sofa') || lower.includes('couch')) return '#3b82f6'; // Blue fabric
  if (lower.includes('chair') || lower.includes('armchair')) return '#8b5cf6'; // Purple fabric
  if (lower.includes('bed')) return '#ec4899'; // Warm pink/rose bedding
  if (lower.includes('table') || lower.includes('desk')) return '#b45309'; // Rich wood table
  if (lower.includes('plant') || lower.includes('pot')) return '#10b981'; // Emerald green plant
  if (lower.includes('lamp') || lower.includes('light')) return '#f59e0b'; // Amber warm lamp
  if (lower.includes('door')) return '#78350f'; // Dark wood door
  if (lower.includes('window')) return '#38bdf8'; // Sky blue glass
  return '#94a3b8';
}

