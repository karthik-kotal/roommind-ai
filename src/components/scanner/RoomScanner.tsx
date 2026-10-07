import React, { useState, useEffect, useRef } from 'react';
import { SurfaceType, Room, RoomScan, ImageQualityResult } from '../../types';
import { useCamera } from '../../hooks/useCamera';
import { useDeviceOrientation, TARGET_ORIENTATIONS } from '../../hooks/useDeviceOrientation';
import { imageQualityService } from '../../services/imageQualityService';
import { scanService } from '../../services/scanService';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  X,
  Compass,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface RoomScannerProps {
  room: Room;
  scan: RoomScan;
  onClose: () => void;
  onCompleteScan: (updatedScan: RoomScan) => void;
  onOpenAnalysisModal?: () => void;
}

const SURFACE_SEQUENCE: { type: SurfaceType; name: string; step: string; instruction: string }[] = [
  {
    type: 'WALL_1',
    name: 'Wall 1',
    step: '01',
    instruction: 'Point camera directly at Wall 1 (Front Wall).',
  },
  {
    type: 'WALL_2',
    name: 'Wall 2',
    step: '02',
    instruction: 'Turn 90° right toward Wall 2 (Right Wall).',
  },
  {
    type: 'WALL_3',
    name: 'Wall 3',
    step: '03',
    instruction: 'Turn around toward Wall 3 (Back Wall).',
  },
  {
    type: 'WALL_4',
    name: 'Wall 4',
    step: '04',
    instruction: 'Turn left toward Wall 4 (Left Wall).',
  },
  {
    type: 'FLOOR',
    name: 'Floor',
    step: '05',
    instruction: 'Tilt camera downward toward the floor surface.',
  },
  {
    type: 'CEILING',
    name: 'Ceiling',
    step: '06',
    instruction: 'Tilt camera upward toward the ceiling surface.',
  },
];

export const RoomScanner: React.FC<RoomScannerProps> = ({
  room,
  scan,
  onClose,
  onCompleteScan,
  onOpenAnalysisModal,
}) => {
  const [currentSurfaceIndex, setCurrentSurfaceIndex] = useState<number>(0);
  const [capturedImages, setCapturedImages] = useState<Record<SurfaceType, string | null>>({
    WALL_1: null,
    WALL_2: null,
    WALL_3: null,
    WALL_4: null,
    FLOOR: null,
    CEILING: null,
  });

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const activeSurfaceObj = SURFACE_SEQUENCE[currentSurfaceIndex];

  // Camera hook
  const {
    videoRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCamera();

  // Device orientation hook
  const orientationState = useDeviceOrientation(activeSurfaceObj.type);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Cleanup blob object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle frame capture
  const handleTriggerCapture = async () => {
    setUploadError(null);
    try {
      setIsEvaluating(true);
      const blob = await captureFrame();
      const evaluation = await imageQualityService.evaluateImage(blob);

      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setQualityResult(evaluation);
    } catch (err: any) {
      console.error('Frame capture error:', err);
      setUploadError(err.message || 'Failed to capture frame from camera.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Confirm capture & upload image to Spring Boot backend
  const handleConfirmUpload = async () => {
    if (!previewBlob || !activeSurfaceObj) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await scanService.uploadSurfaceImage(scan.id, activeSurfaceObj.type, previewBlob);

      // Save preview URL for summary list
      const surfaceType = activeSurfaceObj.type;
      setCapturedImages((prev) => ({ ...prev, [surfaceType]: previewUrl }));

      // Clear preview state
      setPreviewBlob(null);
      setPreviewUrl(null);
      setQualityResult(null);

      // Move to next surface or complete sequence
      if (currentSurfaceIndex < SURFACE_SEQUENCE.length - 1) {
        setCurrentSurfaceIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
        // Refresh scan status from backend
        const finalScan = await scanService.getScan(scan.id);
        onCompleteScan(finalScan);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to upload surface image to server.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewBlob(null);
    setPreviewUrl(null);
    setQualityResult(null);
    setUploadError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <Camera className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{room.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {room.type}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Phase 2 Guided Room Capture</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Surface Sequence Progress Bar */}
      {!isCompleted && (
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-white/5 overflow-x-auto scrollbar-none z-20">
          <div className="flex items-center justify-between min-w-[500px] gap-2">
            {SURFACE_SEQUENCE.map((s, idx) => {
              const isDone = !!capturedImages[s.type];
              const isCurrent = idx === currentSurfaceIndex;
              return (
                <div
                  key={s.type}
                  className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isCurrent
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-200 ring-2 ring-indigo-500/30'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-80">{s.step}</span>
                  <span className="truncate">{s.name}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* COMPLETION SCREEN */}
        {isCompleted ? (
          <div className="w-full max-w-xl mx-auto p-6 sm:p-8 text-center animate-fadeIn space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                ROOM SCAN COMPLETE ✓
              </h1>
              <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
                Your room has been captured successfully. All 6 surface perspectives are saved to your account.
              </p>
            </div>

            {/* Surface checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              {SURFACE_SEQUENCE.map((s) => (
                <div
                  key={s.type}
                  className="p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl flex items-center gap-3"
                >
                  {capturedImages[s.type] ? (
                    <img
                      src={capturedImages[s.type]!}
                      alt={s.name}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      ✓
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Uploaded ✓</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Next stage banner */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs text-left flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Next Stage: AI Spatial Analysis (Phase 3)</p>
                <p className="mt-0.5 text-slate-300">
                  Phase 2 camera workflow is complete. In Phase 3, AI computer vision will analyze room geometry, lighting, surfaces, and auto-generate 3D interactive WebGL room models.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onOpenAnalysisModal) {
                  onOpenAnalysisModal();
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold rounded-xl text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition flex items-center justify-center gap-2"
            >
              <span>ANALYZE MY ROOM</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            {/* LIVE CAMERA STREAM OR ERROR STATE */}
            {cameraError ? (
              <div className="p-6 max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-2xl">
                <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Camera Access Error</h3>
                <p className="text-sm text-slate-300">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="w-full py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-500 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Camera Access</span>
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Real HTML5 Video element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* GUIDED CAMERA ALIGNMENT OVERLAY */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10">
                  {/* Top Instruction Banner */}
                  <div className="self-center bg-slate-950/80 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full shadow-lg text-center max-w-md">
                    <p className="text-xs text-indigo-400 uppercase font-bold tracking-wider">
                      Target: {activeSurfaceObj.name}
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {activeSurfaceObj.instruction}
                    </p>
                  </div>

                  {/* Center Target Box Overlay */}
                  <div className="relative self-center w-72 h-72 sm:w-80 sm:h-80 border-2 border-dashed rounded-3xl flex items-center justify-center transition-all duration-300 backdrop-blur-[1px]"
                    style={{
                      borderColor: orientationState.isAligned ? '#10B981' : '#6366F1',
                      backgroundColor: orientationState.isAligned ? 'rgba(16, 185, 129, 0.05)' : 'rgba(99, 102, 241, 0.05)',
                    }}
                  >
                    {/* Visual Target Dot */}
                    <div
                      className="absolute w-8 h-8 rounded-full border-2 shadow-lg transition-transform duration-100 flex items-center justify-center"
                      style={{
                        transform: `translate(${orientationState.deltaX * 100}px, ${orientationState.deltaY * 100}px)`,
                        backgroundColor: orientationState.isAligned ? '#10B981' : '#EF4444',
                        borderColor: '#FFFFFF',
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    </div>

                    {/* Corner Guides */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/60" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/60" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/60" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/60" />

                    {/* Alignment Badge */}
                    <div className={`absolute bottom-3 px-3 py-1 rounded-full text-xs font-bold transition ${
                      orientationState.isAligned ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40' : 'bg-slate-900/90 text-indigo-200 border border-white/10'
                    }`}>
                      {orientationState.guidanceText}
                    </div>
                  </div>

                  {/* Sensor Status Indicator */}
                  <div className="self-center flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {orientationState.isManualMode
                        ? 'MANUAL GUIDED MODE'
                        : `Sensors Active (Yaw: ${orientationState.currentOrientation?.alpha}°, Pitch: ${orientationState.currentOrientation?.beta}°)`}
                    </span>
                    {orientationState.isManualMode && (
                      <button
                        onClick={orientationState.requestPermission}
                        className="ml-2 text-[10px] text-indigo-400 underline font-semibold pointer-events-auto"
                      >
                        Enable Sensors
                      </button>
                    )}
                  </div>
                </div>

                {/* BOTTOM CAPTURE BAR */}
                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
                  <button
                    onClick={handleTriggerCapture}
                    disabled={isEvaluating}
                    className={`group relative p-1 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                      orientationState.isAligned
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/40'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/40'
                    }`}
                  >
                    <div className="px-8 py-4 rounded-full bg-slate-950/40 flex items-center gap-3 text-white font-bold text-base tracking-wider uppercase">
                      <Camera className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                      <span>{isEvaluating ? 'Checking...' : `CAPTURE ${activeSurfaceObj.name}`}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CAPTURE PREVIEW MODAL */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>{activeSurfaceObj.name} Captured</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {qualityResult?.width}x{qualityResult?.height}
              </span>
            </h3>

            {/* Preview Image */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
              <img src={previewUrl} alt="Captured preview" className="w-full h-full object-cover" />
            </div>

            {/* Quality Evaluation Result */}
            {qualityResult && (
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                qualityResult.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {qualityResult.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{qualityResult.message}</span>
                </div>
                <div className="flex gap-4 pt-1 text-[11px] opacity-80 font-mono">
                  <span>Brightness: {qualityResult.brightness}</span>
                  <span>Blur Score: {qualityResult.blurScore}</span>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {uploadError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRetake}
                disabled={isUploading}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Upload</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
