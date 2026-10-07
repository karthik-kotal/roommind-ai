import React, { useState, useEffect } from 'react';
import { Room, RoomScan, RoomAnalysis, RoomDesign, StylePackage } from '../../types';
import { scanService } from '../../services/scanService';
import { roomService, BomResponseData, FeedbackResponseData } from '../../services/roomService';
import { SurfaceCustomizationMap } from '../room3d/materials';
import { useDebouncedRecalculation } from '../../hooks/useDebouncedRecalculation';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  IndianRupee,
  Layers,
  Percent,
  Info,
  SlidersHorizontal,
  Move3d,
  RefreshCw,
  Star,
  Save,
  RotateCcw,
  Copy,
  FolderOpen,
  FileText,
  Receipt,
  MessageSquareQuote,
  Send,
  Download,
} from 'lucide-react';
import { Room3DViewer } from '../room3d/Room3DViewer';

interface AnalysisResultModalProps {
  room: Room;
  scan?: RoomScan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  room,
  scan,
  isOpen,
  onClose,
}) => {
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [design, setDesign] = useState<RoomDesign | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePackage>('MODERN');
  const [taxRate, setTaxRate] = useState<number>(18.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 5B Live Surface Customization State & Debounced Recalculation Hook
  const [liveSurfaceMap, setLiveSurfaceMap] = useState<SurfaceCustomizationMap | null>(null);
  const [loadedSurfaceMap, setLoadedSurfaceMap] = useState<SurfaceCustomizationMap | null>(null);

  // Phase 5C Versioning & History State
  const [designHistory, setDesignHistory] = useState<RoomDesign[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Phase 5D State (BOM, PDF, Feedback)
  const [activeBom, setActiveBom] = useState<BomResponseData | null>(null);
  const [isBomLoading, setIsBomLoading] = useState<boolean>(false);
  const [bomError, setBomError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<number | null>(null);

  const [feedbackDesignId, setFeedbackDesignId] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<Record<number, FeedbackResponseData>>({});



  const { recalculatedData, isRecalculating, recalculationError } = useDebouncedRecalculation({
    roomId: room?.id,
    stylePackage: selectedStyle,
    customTaxRatePercent: taxRate,
    surfaceMap: liveSurfaceMap,
    enabled: isOpen && !!room?.id,
  });

  const fetchHistory = async () => {
    if (!room?.id) return;
    try {
      const history = await roomService.getRoomDesigns(room.id);
      setDesignHistory(history);
    } catch (e) {
      console.warn('Failed to fetch design history:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const runAnalysisAndFetchDesign = async () => {
      setLoading(true);
      setError(null);
      try {
        let currentAnalysis: RoomAnalysis | null = null;

        if (scan) {
          // Trigger real computer vision pipeline
          currentAnalysis = await scanService.analyzeScan(scan.id);
          setAnalysis(currentAnalysis);
        }

        // Fetch design history and set latest active design
        const history = await roomService.getRoomDesigns(room.id);
        setDesignHistory(history);

        if (history.length > 0) {
          setDesign(history[0]);
          setSelectedStyle(history[0].stylePackage);
        } else {
          const newDesign = await roomService.createDesign(room.id, selectedStyle, taxRate);
          setDesign(newDesign);
          setDesignHistory([newDesign]);
        }
      } catch (err: any) {
        console.error('Analysis / Design generation error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to complete room analysis.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysisAndFetchDesign();
  }, [isOpen, room?.id, scan?.id]);

  const handleSaveDesign = async () => {
    if (!room?.id) return;
    setIsSaving(true);
    try {
      const saved = await roomService.createDesign(room.id, selectedStyle, taxRate, liveSurfaceMap);
      setDesign(saved);
      setSaveSuccessMsg(`Design saved as Version ${saved.versionNumber || 1}`);
      await fetchHistory();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving design version:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDesign = (ver: RoomDesign) => {
    setDesign(ver);
    setSelectedStyle(ver.stylePackage);
    if (ver.surfaceCustomizationMapJson) {
      try {
        const parsed = JSON.parse(ver.surfaceCustomizationMapJson);
        if (Object.keys(parsed).length > 0) {
          setLoadedSurfaceMap(parsed);
          setSaveSuccessMsg(`Loaded Version ${ver.versionNumber || 1} into 3D Studio`);
          setTimeout(() => setSaveSuccessMsg(null), 3000);
          return;
        }
      } catch (e) {}
    }
    setLoadedSurfaceMap(null);
  };

  const handleRestoreDesign = async (designId: number) => {
    if (!room?.id) return;
    try {
      const restored = await roomService.restoreDesign(room.id, designId);
      setDesign(restored);
      setSaveSuccessMsg(`Restored as Version ${restored.versionNumber}`);
      await fetchHistory();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error restoring design version:', err);
    }
  };

  const handleToggleFavorite = async (designId: number, currentFav: boolean) => {
    if (!room?.id) return;
    try {
      await roomService.toggleFavoriteDesign(room.id, designId, !currentFav);
      await fetchHistory();
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleCloneDesign = async (designId: number) => {
    if (!room?.id) return;
    try {
      const cloned = await roomService.cloneDesign(room.id, designId);
      setSaveSuccessMsg(`Cloned as Version ${cloned.versionNumber}`);
      await fetchHistory();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error cloning design version:', err);
    }
  };

  const handleFetchBom = async (designId: number) => {
    if (!room?.id) return;
    setIsBomLoading(true);
    setBomError(null);
    try {
      const bom = await roomService.getBom(room.id, designId);
      setActiveBom(bom);
    } catch (e: any) {
      setBomError(e.response?.data?.message || e.message || 'Failed to load BOM');
    } finally {
      setIsBomLoading(false);
    }
  };

  const handleDownloadPdf = async (designId: number, versionNum?: number) => {
    if (!room?.id) return;
    setIsDownloadingPdf(designId);
    try {
      await roomService.downloadPdfReport(room.id, designId, versionNum);
      setSaveSuccessMsg(`Downloaded PDF report for Version ${versionNum || 1}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e: any) {
      console.error('PDF download error:', e);
      setError(e.response?.data?.message || e.message || 'Failed to download PDF report.');
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  const handleOpenFeedback = async (designId: number) => {
    if (!room?.id) return;
    setFeedbackDesignId(designId);
    setFeedbackSuccessMsg(null);
    try {
      const fb = await roomService.getFeedback(room.id, designId);
      if (fb) {
        setFeedbackRating(fb.rating);
        setFeedbackComment(fb.comment || '');
        setUserFeedbacks(prev => ({ ...prev, [designId]: fb }));
      } else {
        setFeedbackRating(5);
        setFeedbackComment('');
      }
    } catch (e) {
      setFeedbackRating(5);
      setFeedbackComment('');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!room?.id || !feedbackDesignId) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await roomService.submitFeedback(
        room.id,
        feedbackDesignId,
        feedbackRating,
        feedbackComment
      );
      setUserFeedbacks(prev => ({ ...prev, [feedbackDesignId]: res }));
      setFeedbackSuccessMsg('Feedback submitted successfully!');
      setTimeout(() => {
        setFeedbackSuccessMsg(null);
        setFeedbackDesignId(null);
      }, 2000);
    } catch (e: any) {
      console.error('Feedback submit error:', e);
      setError(e.response?.data?.message || e.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };



  const handleStyleChange = async (newStyle: StylePackage) => {
    setSelectedStyle(newStyle);
  };

  const handleTaxRateChange = (newTax: number) => {
    setTaxRate(newTax);
  };

  if (!isOpen) return null;

  // Derive active displayed values: prefer transient recalculatedData if present
  const displayScore = recalculatedData
    ? recalculatedData.overallCompatibilityScore
    : design?.overallCompatibilityScore;

  const displaySubtotal = recalculatedData
    ? recalculatedData.subtotalCostInr
    : design?.subtotalCostInr;

  const displayTaxRate = recalculatedData
    ? recalculatedData.taxRatePercent
    : design?.taxRatePercent || taxRate;

  const displayTaxAmount = recalculatedData
    ? recalculatedData.taxAmountInr
    : design?.taxAmountInr;

  const displayTotal = recalculatedData
    ? recalculatedData.estimatedTotalCostInr
    : design?.estimatedTotalCostInr;

  // Parse JSON payloads safely
  let wallRecs: Record<string, any> = {};
  let compatComponents: Record<string, { score: number; weight: number }> = {};
  let rawVision: Record<string, any> = {};

  if (design?.wallRecommendationsJson) {
    try {
      wallRecs = JSON.parse(design.wallRecommendationsJson);
    } catch (e) {}
  }

  const activeCompatJson = recalculatedData
    ? recalculatedData.compatibilityBreakdownJson
    : design?.compatibilityBreakdownJson;

  if (activeCompatJson) {
    try {
      const parsed = JSON.parse(activeCompatJson);
      compatComponents = parsed.components || {};
    } catch (e) {}
  }

  if (analysis?.rawVisionOutputJson) {
    try {
      rawVision = JSON.parse(analysis.rawVisionOutputJson);
    } catch (e) {}
  }

  let detectedObjects: Array<{ className: string; modelScore?: number }> = [];
  if (analysis?.furnitureDetectedJson) {
    try {
      detectedObjects = JSON.parse(analysis.furnitureDetectedJson);
    } catch (e) {}
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phase 3 Real AI Vision & Synthesis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Spatial Analysis & Redesign Synthesis
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Room: <strong className="text-slate-200">{room.name}</strong> ({room.type})
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Running Pretrained Computer Vision Models (SigLIP / YOLOv8 / SAM)...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: REAL COMPUTER VISION DETECTED FEATURES */}
            {analysis && (
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  <span>Real Computer Vision Extracted Features</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Detected Wall Category */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-400 uppercase font-mono text-[10px]">
                      Wall Surface Classification
                    </span>
                    <p className="text-sm font-bold text-white">{analysis.detectedWallCategory}</p>
                    <p className="text-[11px] text-indigo-300">
                      SigLIP Model Score: <strong>{(analysis.wallModelScore * 100).toFixed(1)}%</strong>
                    </p>
                  </div>

                  {/* Detected Floor Category */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-400 uppercase font-mono text-[10px]">
                      Floor Surface Classification
                    </span>
                    <p className="text-sm font-bold text-white">{analysis.detectedFloorCategory}</p>
                    <p className="text-[11px] text-indigo-300">
                      SigLIP Model Score: <strong>{(analysis.floorModelScore * 100).toFixed(1)}%</strong>
                    </p>
                  </div>
                </div>

                {/* Lighting Characteristics */}
                {rawVision.lightCharacteristics && (
                  <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      Light Characteristics: <strong className="text-slate-200">{rawVision.lightCharacteristics}</strong> ({rawVision.averageBrightnessLux} Lux)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: STYLE PACKAGE SELECTION */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Design Aesthetic Package
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['STANDARD', 'MODERN', 'LUXURY'] as StylePackage[]).map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => handleStyleChange(pkg)}
                    disabled={analyzing}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      selectedStyle === pkg
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{pkg}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {pkg === 'STANDARD' ? 'Budget Durable' : pkg === 'MODERN' ? 'Japandi Zen' : 'High-End Marble'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Toast for Save / Restore / Load Actions */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
              </div>
            )}

            {/* PHASE 4 & 5A: INTERACTIVE 3D VIRTUAL ROOM VIEWPORT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Move3d className="w-4 h-4 text-indigo-400" />
                  <span>Interactive 3D Virtual Studio</span>
                  {isRecalculating && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono animate-pulse border border-indigo-500/30">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Recalculating spend...</span>
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveDesign}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-400 text-white text-xs font-bold hover:shadow-lg hover:shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving Version...' : 'Save Design Version'}</span>
                  </button>
                  <span className="text-xs text-slate-400">
                    Theme: <strong className="text-indigo-300">{selectedStyle}</strong>
                  </span>
                </div>
              </div>

              <Room3DViewer
                dimensions={{
                  length: room.length || 5.0,
                  width: room.width || 4.0,
                  height: room.height || 2.8,
                }}
                detectedWallCategory={analysis?.detectedWallCategory}
                detectedFloorCategory={analysis?.detectedFloorCategory}
                selectedStyle={selectedStyle}
                detectedObjects={detectedObjects}
                title={`${room.name} — Interactive 3D Studio`}
                allowSurfaceEditing
                externalSurfaceMap={loadedSurfaceMap}
                onSurfaceConfigChange={(map) => setLiveSurfaceMap(map)}
              />
            </div>

            {/* SECTION 3: EXPLAINABLE WALL RECOMMENDATIONS */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Explainable Material Recommendations</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(wallRecs).map(([key, val]: [string, any]) => {
                  if (key === 'stylePackage') return null;
                  return (
                    <div
                      key={key}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                          {key}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold">
                          Recommended
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white">{val.recommendedOption}</p>

                      {/* Explainable Reasons List */}
                      {val.reasons && (
                        <div className="space-y-1 pt-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Why this option was chosen:
                          </p>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {val.reasons.map((r: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: EXPLAINABLE COMPATIBILITY BREAKDOWN */}
            {(design || recalculatedData) && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Overall Compatibility Score</span>
                      {recalculatedData && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          Live Recalculated
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Weighted linear combination of 5 architectural compliance factors
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                      {displayScore}%
                    </span>
                  </div>
                </div>

                {/* Sub-component progress breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {Object.entries(compatComponents).map(([compKey, compVal]) => (
                    <div key={compKey} className="p-3 bg-slate-900/60 rounded-xl space-y-1.5 border border-slate-800">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300 capitalize">
                          {compKey.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {compVal.score}% <span className="text-slate-500 text-[10px]">({compVal.weight * 100}% wt)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${compVal.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: RENOVATION COST ENGINE IN INDIAN RUPEES (₹) */}
            {(design || recalculatedData) && (
              <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-emerald-400" />
                      <span>Estimated Renovation Spend</span>
                      {recalculatedData && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          Live Recalculated
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">Calculated per sq.ft area in Indian Rupees (₹)</p>
                  </div>

                  {/* Configurable Tax Input */}
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Percent className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-slate-400 font-medium">Tax:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={taxRate}
                      onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Material & Labor Subtotal:</span>
                    <span className="font-mono font-semibold">
                      ₹{displaySubtotal !== undefined ? Number(displaySubtotal).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Configured Tax ({displayTaxRate}%):</span>
                    <span className="font-mono font-semibold">
                      ₹{displayTaxAmount !== undefined ? Number(displayTaxAmount).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-2 border-t border-slate-800">
                    <span>Estimated Total Cost:</span>
                    <span className="font-mono text-base">
                      ₹{displayTotal !== undefined ? Number(displayTotal).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>

                {/* Surface Breakdown List if recalculatedData present */}
                {recalculatedData?.surfaceCostBreakdown && (
                  <div className="pt-2 space-y-1.5 border-t border-slate-800/80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Itemized Surface Breakdown
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {recalculatedData.surfaceCostBreakdown.map((s) => (
                        <div key={s.surfaceKey} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between">
                          <span className="text-slate-300 font-mono font-semibold">{s.surfaceKey}:</span>
                          <span className="text-emerald-400 font-mono">
                            ₹{Number(s.totalSurfaceCostInr).toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-slate-500">({s.areaSqFt} sq.ft)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MANDATORY LEGAL COST DISCLAIMER */}
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Disclaimer:</strong> {recalculatedData?.costDisclaimer || design?.costDisclaimer}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 6: DESIGN VERSION HISTORY & FAVORITES */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    <span>Design Version History & Saved Snapshots</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    View, load into 3D, favorite, restore, or clone historical room designs
                  </p>
                </div>
                <span className="text-xs text-indigo-300 font-mono font-bold">
                  {designHistory.length} Version{designHistory.length === 1 ? '' : 's'} Saved
                </span>
              </div>

              {designHistory.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No saved versions found for this room.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {designHistory.map((ver) => {
                    const isCurrentActive = design?.id === ver.id;
                    return (
                      <div
                        key={ver.id}
                        className={`p-4 rounded-xl border transition space-y-3 ${
                          isCurrentActive
                            ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                              Version {ver.versionNumber || 1}
                            </span>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ver.stylePackage}
                            </span>
                            {isCurrentActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                Active
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleFavorite(ver.id, !!ver.isFavorite)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 transition"
                            title={ver.isFavorite ? 'Unfavorite Design' : 'Mark as Favorite'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                ver.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">
                            Spend:{' '}
                            <strong className="text-emerald-400">
                              ₹{Number(ver.estimatedTotalCostInr).toLocaleString('en-IN')}
                            </strong>
                          </span>
                          <span className="text-slate-400">
                            Score:{' '}
                            <strong className="text-indigo-300">
                              {ver.overallCompatibilityScore}%
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                          <span className="text-[10px] text-slate-500">
                            {new Date(ver.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleLoadDesign(ver)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1"
                              title="Load this saved design state into 3D Studio"
                            >
                              <FolderOpen className="w-3 h-3 text-indigo-400" />
                              <span>Open</span>
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(ver.id, ver.versionNumber)}
                              disabled={isDownloadingPdf === ver.id}
                              className="px-2 py-1 rounded bg-indigo-900/60 border border-indigo-500/30 hover:bg-indigo-800 text-indigo-200 font-semibold transition flex items-center gap-1 disabled:opacity-50"
                              title="Download server-side PDF design report"
                            >
                              <FileText className="w-3 h-3 text-indigo-400" />
                              <span>{isDownloadingPdf === ver.id ? 'Generating...' : 'Report'}</span>
                            </button>
                            <button
                              onClick={() => handleFetchBom(ver.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1"
                              title="View server-side Bill of Materials (BOM)"
                            >
                              <Receipt className="w-3 h-3 text-emerald-400" />
                              <span>BOM</span>
                            </button>
                            <button
                              onClick={() => handleOpenFeedback(ver.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1"
                              title="Give feedback on this design version"
                            >
                              <MessageSquareQuote className="w-3 h-3 text-amber-400" />
                              <span>{userFeedbacks[ver.id] ? `★ ${userFeedbacks[ver.id].rating}` : 'Feedback'}</span>
                            </button>
                            <button
                              onClick={() => handleRestoreDesign(ver.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1"
                              title="Create a new version snapshot copying this configuration"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => handleCloneDesign(ver.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1"
                              title="Clone into a new editable version"
                            >
                              <Copy className="w-3 h-3 text-emerald-400" />
                              <span>Clone</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 5D — BILL OF MATERIALS (BOM) MODAL */}
        {(activeBom || isBomLoading || bomError) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => { setActiveBom(null); setBomError(null); }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Bill of Materials (BOM)</h3>
                {activeBom && (
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                    Version {activeBom.versionNumber} ({activeBom.stylePackage})
                  </span>
                )}
              </div>

              {isBomLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Reconciling saved design snapshot BOM...</p>
                </div>
              ) : bomError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {bomError}
                </div>
              ) : activeBom ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="p-3">Surface</th>
                          <th className="p-3 text-right">Area (sq.ft)</th>
                          <th className="p-3 text-right">Material Cost</th>
                          <th className="p-3 text-right">Labor Cost</th>
                          <th className="p-3 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                        {activeBom.surfaceItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/50">
                            <td className="p-3 font-semibold text-white">{item.surfaceKey}</td>
                            <td className="p-3 text-right">{item.areaSqFt} sq.ft</td>
                            <td className="p-3 text-right">₹{Number(item.materialCostInr).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right">₹{Number(item.laborCostInr).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-bold text-emerald-400">₹{Number(item.totalSurfaceCostInr).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Cost:</span>
                      <span className="text-white font-semibold">₹{Number(activeBom.subtotalCostInr).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Configured Tax ({activeBom.taxRatePercent}%):</span>
                      <span className="text-white font-semibold">₹{Number(activeBom.taxAmountInr).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800">
                      <span>Reconciled Total Cost:</span>
                      <span className="text-base">₹{Number(activeBom.estimatedTotalCostInr).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* PHASE 5D — HUMAN FEEDBACK MODAL */}
        {feedbackDesignId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
              <button
                onClick={() => setFeedbackDesignId(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Design Feedback</h3>
              </div>

              {feedbackSuccessMsg ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{feedbackSuccessMsg}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Rating (1 – 5 Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= feedbackRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-sm font-bold text-amber-400 ml-2 font-mono">
                        {feedbackRating} / 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Feedback Comment (Optional, max 500 chars)
                    </label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts on material options, recommendations, or layout..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="text-right text-[10px] text-slate-500 mt-1">
                      {feedbackComment.length} / 500
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    Note: Feedback data is recorded for offline evaluation & preference analysis. No immediate AI model retraining occurs.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setFeedbackDesignId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={isSubmittingFeedback}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


