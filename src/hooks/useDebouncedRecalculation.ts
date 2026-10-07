import { useState, useEffect, useRef } from 'react';
import { StylePackage } from '../types';
import { SurfaceCustomizationMap } from '../components/room3d/materials';
import { roomService, RecalculationResponseData } from '../services/roomService';

interface UseDebouncedRecalculationOptions {
  roomId: number | string | null;
  stylePackage: StylePackage;
  customTaxRatePercent: number;
  surfaceMap: SurfaceCustomizationMap | null;
  enabled?: boolean;
  debounceMs?: number;
}

export function useDebouncedRecalculation({
  roomId,
  stylePackage,
  customTaxRatePercent,
  surfaceMap,
  enabled = true,
  debounceMs = 350,
}: UseDebouncedRecalculationOptions) {
  const [recalculatedData, setRecalculatedData] = useState<RecalculationResponseData | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [recalculationError, setRecalculationError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !roomId || !surfaceMap) {
      return;
    }

    // Clear previous timer and cancel in-flight request
    const timerId = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsRecalculating(true);
      setRecalculationError(null);

      try {
        const result = await roomService.recalculateDesign(
          roomId,
          {
            stylePackage,
            customTaxRatePercent,
            surfaceMap,
          },
          controller.signal
        );

        setRecalculatedData(result);
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          // Request was intentionally aborted for newer state change
          return;
        }
        console.warn('Recalculation error:', err);
        setRecalculationError(
          err.response?.data?.message || err.message || 'Transient recalculation failed'
        );
      } finally {
        setIsRecalculating(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timerId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [roomId, stylePackage, customTaxRatePercent, surfaceMap, enabled, debounceMs]);

  return {
    recalculatedData,
    isRecalculating,
    recalculationError,
  };
}
