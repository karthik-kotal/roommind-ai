import React, { useState, useRef, MouseEvent, TouchEvent } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Original Capture',
  afterLabel = 'Redesigned Vision',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none cursor-ew-resize"
      onMouseDown={() => (isDragging.current = true)}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) */}
      <img
        src={afterImage}
        alt="After Redesign"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-900/80 text-xs font-bold text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
        {afterLabel}
      </span>

      {/* Before Image (Clipped Foreground) */}
      <div
        className="absolute top-0 left-0 bottom-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before Redesign"
          className="absolute top-0 left-0 h-full max-w-none object-cover"
          style={{
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
          }}
        />
        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 text-xs font-bold text-slate-300 border border-white/10 backdrop-blur-md">
          {beforeLabel}
        </span>
      </div>

      {/* Slider Divider Bar */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xs shadow-xl border border-slate-300">
          ↔
        </div>
      </div>
    </div>
  );
};
