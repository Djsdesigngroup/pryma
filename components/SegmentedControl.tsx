"use client";

import { ContextMode } from "@/types/profile";

interface SegmentedControlProps {
  value: ContextMode;
  onChange: (mode: ContextMode) => void;
}

export function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  const activeIndex = value === "public" ? 0 : 1;

  return (
    <div className="relative flex items-center rounded-sm border border-border/40 overflow-hidden">
      {/* Sliding highlight — transitions horizontally between tabs */}
      <div
        className="absolute top-0 bottom-0 w-1/2 bg-white/8 transition-transform duration-[180ms] ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {(["public", "professional"] as ContextMode[]).map((mode, i) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={[
            "relative z-10 px-4 py-1.5 text-[10px] font-medium tracking-widest uppercase transition-colors duration-[180ms] ease-out",
            i === 0 ? "" : "border-l border-border/40",
            value === mode ? "text-primary" : "text-muted hover:text-secondary",
          ].join(" ")}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
