"use client";

import { useEffect, useState } from "react";
import { PrymaLogo } from "@/components/PrymaLogo";
import { ProfileQR } from "@/components/QRCode";
import { SaveContactButton } from "@/components/SaveContactButton";
import type { ContextMode } from "@/types/profile";
import type { ResolvedContext } from "@/lib/profile";

interface ShareModeProps {
  url: string;
  mode: ContextMode;
  handle: string;
  ctx: ResolvedContext;
  onClose: () => void;
}

export function ShareMode({ url, mode, handle, ctx, onClose }: ShareModeProps) {
  const [copied, setCopied] = useState(false);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const contextLabel = mode === "professional" ? "Professional" : "Public";

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-5 px-6">

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close share mode"
        className="absolute top-5 right-5 p-2 text-muted/60 hover:text-secondary transition-colors duration-200 ease-out"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Logo */}
      <PrymaLogo size={28} />

      {/* Active context label */}
      <p className="font-light text-[10px] text-muted tracking-widest uppercase -mt-1">
        {contextLabel}
      </p>

      {/* QR code — primary share mechanism */}
      <div className="flex flex-col items-center gap-3">
        <div className="bg-[#111111] rounded-2xl p-6">
          <ProfileQR url={url} size={240} />
        </div>
        <p className="font-light text-xs text-muted tracking-wide uppercase">
          Scan to view
        </p>
      </div>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="w-[280px] border border-primary/20 text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/40 hover:text-primary"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>

      {/* Save contact */}
      <SaveContactButton handle={handle} fields={ctx} profileUrl={url} />

      {/* Footer */}
      <p className="font-light text-[10px] tracking-wide text-muted/60 uppercase mt-1">
        Shared intentionally via Pryma
      </p>

    </div>
  );
}
