"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 2-20 chars, starts + ends alphanumeric, hyphens allowed in middle
const HANDLE_REGEX = /^[a-z0-9]([a-z0-9-]{0,18}[a-z0-9])?$/;

interface HandleInputProps {
  value: string;
  onChange: (val: string) => void;
  currentHandle?: string; // exclude from uniqueness check (edit page)
  onValidChange?: (valid: boolean) => void;
}

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export function HandleInput({
  value,
  onChange,
  currentHandle,
  onValidChange,
}: HandleInputProps) {
  const [state, setState] = useState<CheckState>("idle");

  const checkHandle = useCallback(
    async (handle: string) => {
      if (!handle) {
        setState("idle");
        onValidChange?.(false);
        return;
      }
      if (!HANDLE_REGEX.test(handle)) {
        setState("invalid");
        onValidChange?.(false);
        return;
      }
      if (handle === currentHandle) {
        setState("available");
        onValidChange?.(true);
        return;
      }
      setState("checking");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("handle")
        .eq("handle", handle)
        .maybeSingle();

      if (data) {
        setState("taken");
        onValidChange?.(false);
      } else {
        setState("available");
        onValidChange?.(true);
      }
    },
    [currentHandle, onValidChange]
  );

  useEffect(() => {
    setState("idle");
    const timer = setTimeout(() => checkHandle(value), 400);
    return () => clearTimeout(timer);
  }, [value, checkHandle]);

  const hint: Record<CheckState, React.ReactNode> = {
    idle: null,
    checking: <span className="text-muted/60">Checking…</span>,
    available: <span className="text-[#4ade80]/50">Available</span>,
    taken: <span className="text-[#f87171]/60">Handle taken</span>,
    invalid: (
      <span className="text-[#f87171]/60">
        2–20 chars · lowercase letters, numbers, hyphens
      </span>
    ),
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="handle"
        className="font-light text-[10px] text-primary/[0.38] tracking-[0.12em] uppercase"
      >
        Handle <span className="text-primary/[0.25] ml-1">*</span>
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-light text-muted/60 select-none">
          @
        </span>
        <input
          id="handle"
          type="text"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          placeholder="yourhandle"
          autoComplete="off"
          className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl pl-8 pr-4 py-3 text-sm font-light text-primary placeholder:text-muted/50 outline-none focus:border-white/[0.30] transition-colors duration-[120ms] ease-out"
        />
      </div>
      {hint[state] && (
        <p className="text-[10px] font-light pl-1 tracking-wide">
          {hint[state]}
        </p>
      )}
    </div>
  );
}
