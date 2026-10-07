import { useState, useRef, useCallback, useEffect } from 'react';

export interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    stream: null,
    isActive: false,
    error: null,
    permissionStatus: 'unknown',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API (getUserMedia) is not supported in this browser environment.');
      }

      // Try back camera first, fallback to user camera
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (err) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setState({
        stream: mediaStream,
        isActive: true,
        error: null,
        permissionStatus: 'granted',
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      let errorMsg = 'Camera permission is required to scan your room.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera access was denied by your browser. Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on your hardware.';
      } else if (err.message) {
        errorMsg = err.message;
      }

      setState({
        stream: null,
        isActive: false,
        error: errorMsg,
        permissionStatus: 'denied',
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
    }
    setState({
      stream: null,
      isActive: false,
      error: null,
      permissionStatus: state.permissionStatus,
    });
  }, [state.stream, state.permissionStatus]);

  const captureFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        return reject(new Error('Video element not bound.'));
      }

      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      if (width === 0 || height === 0) {
        return reject(new Error('Video frame not ready. Please wait for camera stream to start.'));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Canvas context initialization failed.'));
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to encode frame snapshot to Blob.'));
          }
        },
        'image/jpeg',
        0.92
      );
    });
  }, []);

  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state.stream]);

  return {
    videoRef,
    stream: state.stream,
    isActive: state.isActive,
    error: state.error,
    permissionStatus: state.permissionStatus,
    startCamera,
    stopCamera,
    captureFrame,
  };
};
