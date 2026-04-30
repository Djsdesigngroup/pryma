"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  // When provided, clicking opens Share Mode instead of native share/clipboard
  onOpen?: () => void;
}

export function ShareButton({ url, onOpen }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (onOpen) {
      onOpen();
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: "Pryma", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="flex flex-col items-center gap-[10px]">
      {/* Primary action — slightly more prominent border and text */}
      <button
        onClick={handleShare}
        className="w-[280px] border border-primary/25 text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-[120ms] ease-out hover:border-primary/50 hover:text-primary hover:bg-white/[0.05] active:scale-[0.98] active:brightness-90"
      >
        {copied ? "Link copied" : "Send Pryma"}
      </button>
      <p className="font-light text-[10px] text-muted/50 tracking-wide">
        Share your context instantly
      </p>
    </div>
  );
}
