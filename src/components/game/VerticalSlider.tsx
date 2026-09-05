import React, { useRef, useState } from "react";

interface VerticalSliderProps {
  value: number;
  max: number;
  background: string;
  onChange: (val: number) => void;
  showHint?: boolean;
  targetHintValue?: number;
  hintType?: "hue" | "sat" | "val";
}

export function VerticalSlider({
  value,
  max,
  background,
  onChange,
  showHint = false,
  targetHintValue,
  hintType = "hue",
}: VerticalSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, offsetY / rect.height));
    const newVal = Math.round(ratio * max);
    onChange(newVal);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateValue(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const hintPercent =
    targetHintValue !== undefined
      ? Math.min(100, Math.max(0, (targetHintValue / max) * 100))
      : null;

  return (
    <div
      ref={containerRef}
      className="slider-strip"
      style={{ background }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Visual Target Hint Pill Overlay (matching user design) */}
      {showHint && hintPercent !== null && (
        <div
          className={`slider-hint-pill hint-pill-${hintType}`}
          style={{ top: `calc(${hintPercent}% - 30px)` }}
        />
      )}

      {/* Slider Interactive Knob */}
      <div
        className="slider-knob"
        style={{ top: `calc(${percent}% - 14px)` }}
      />
    </div>
  );
}
