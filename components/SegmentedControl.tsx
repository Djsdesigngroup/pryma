"use client";

import { ContextMode } from "@/types/profile";

interface SegmentedControlProps {
  value: ContextMode;
  onChange: (mode: ContextMode) => void;
}

export function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex items-center rounded-sm border border-border/40 overflow-hidden">
      {(["public", "professional"] as ContextMode[]).map((mode, i) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={[
            "px-4 py-1.5 text-[10px] font-medium tracking-widest uppercase transition-colors duration-150",
            i === 0 ? "" : "border-l border-border/40",
            value === mode
              ? "bg-white/8 text-primary"
              : "text-muted hover:text-secondary",
          ].join(" ")}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
