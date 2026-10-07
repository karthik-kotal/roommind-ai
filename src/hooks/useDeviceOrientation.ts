import { useState, useEffect, useCallback } from 'react';
import { SurfaceType, OrientationData } from '../types';

export interface TargetOrientation {
  alpha: number; // Yaw (-180 to 180 or 0 to 360)
  beta: number;  // Pitch (-180 to 180)
  gamma: number; // Roll (-90 to 90)
  label: string;
}

export const TARGET_ORIENTATIONS: Record<SurfaceType, TargetOrientation> = {
  WALL_1: { alpha: 0, beta: 0, gamma: 0, label: 'Wall 1 (Front)' },
  WALL_2: { alpha: 90, beta: 0, gamma: 0, label: 'Wall 2 (Right)' },
  WALL_3: { alpha: 180, beta: 0, gamma: 0, label: 'Wall 3 (Back)' },
  WALL_4: { alpha: -90, beta: 0, gamma: 0, label: 'Wall 4 (Left)' },
  FLOOR: { alpha: 0, beta: -85, gamma: 0, label: 'Floor (Tilt Down)' },
  CEILING: { alpha: 0, beta: 85, gamma: 0, label: 'Ceiling (Tilt Up)' },
};

export interface DeviceOrientationState {
  isAvailable: boolean;
  permissionGranted: boolean;
  currentOrientation: OrientationData | null;
  targetOrientation: TargetOrientation | null;
  isAligned: boolean;
  deltaX: number; // -1 to 1 offset for UI dot overlay
  deltaY: number; // -1 to 1 offset for UI dot overlay
  guidanceText: string;
  isManualMode: boolean;
}

export const useDeviceOrientation = (activeSurface: SurfaceType | null) => {
  const [state, setState] = useState<DeviceOrientationState>({
    isAvailable: false,
    permissionGranted: false,
    currentOrientation: null,
    targetOrientation: activeSurface ? TARGET_ORIENTATIONS[activeSurface] : null,
    isAligned: false,
    deltaX: 0,
    deltaY: 0,
    guidanceText: 'Position camera according to visual target guide.',
    isManualMode: true,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const DeviceOrientationEventTyped = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientationEventTyped?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEventTyped.requestPermission();
        if (response === 'granted') {
          setState((prev) => ({ ...prev, permissionGranted: true, isAvailable: true, isManualMode: false }));
          return true;
        } else {
          setState((prev) => ({ ...prev, permissionGranted: false, isManualMode: true }));
          return false;
        }
      } catch (err) {
        console.warn('Device orientation permission request failed:', err);
        setState((prev) => ({ ...prev, isManualMode: true }));
        return false;
      }
    } else if ('DeviceOrientationEvent' in window) {
      setState((prev) => ({ ...prev, isAvailable: true, permissionGranted: true, isManualMode: false }));
      return true;
    } else {
      setState((prev) => ({ ...prev, isAvailable: false, isManualMode: true }));
      return false;
    }
  }, []);

  useEffect(() => {
    if (!activeSurface) return;
    const target = TARGET_ORIENTATIONS[activeSurface];

    if (!state.isAvailable || state.isManualMode) {
      setState((prev) => ({
        ...prev,
        targetOrientation: target,
        isAligned: true,
        guidanceText: `MANUAL GUIDED MODE: Align camera with ${target.label} and tap Capture when ready.`,
      }));
      return;
    }

    let initialAlpha: number | null = null;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha ?? 0;
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;

      if (initialAlpha === null) {
        initialAlpha = alpha;
      }

      let relativeYaw = alpha - initialAlpha;
      if (relativeYaw > 180) relativeYaw -= 360;
      if (relativeYaw < -180) relativeYaw += 360;

      const currentData: OrientationData = {
        alpha: Math.round(relativeYaw),
        beta: Math.round(beta),
        gamma: Math.round(gamma),
        isSupported: true,
        permissionGranted: true,
      };

      const targetYaw = target.alpha;
      const targetPitch = target.beta;

      const currentAlpha = currentData.alpha ?? 0;
      const currentBeta = currentData.beta ?? 0;

      let yawDiff = currentAlpha - targetYaw;
      if (yawDiff > 180) yawDiff -= 360;
      if (yawDiff < -180) yawDiff += 360;

      const pitchDiff = currentBeta - targetPitch;

      const isAligned = Math.abs(yawDiff) <= 12 && Math.abs(pitchDiff) <= 12;

      const deltaX = Math.max(-1, Math.min(1, yawDiff / 30));
      const deltaY = Math.max(-1, Math.min(1, pitchDiff / 30));

      let guidanceText = 'Perfect angle ✓';
      if (!isAligned) {
        const xDir = yawDiff > 0 ? '← Turn Left' : 'Turn Right →';
        const yDir = pitchDiff > 0 ? '↓ Tilt Down' : 'Tilt Up ↑';
        guidanceText = `Adjust camera: ${Math.abs(yawDiff) > 12 ? xDir : ''} ${Math.abs(pitchDiff) > 12 ? yDir : ''}`.trim();
      }

      setState({
        isAvailable: true,
        permissionGranted: true,
        currentOrientation: currentData,
        targetOrientation: target,
        isAligned,
        deltaX,
        deltaY,
        guidanceText,
        isManualMode: false,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [activeSurface, state.isAvailable, state.isManualMode]);

  return {
    ...state,
    requestPermission,
  };
};
