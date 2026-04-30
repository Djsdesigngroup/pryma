"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  // When provided, clicking opens Share Mode instead of native share/clipboard
  onOpen?: () => void;
}

export function ShareButton({ url, onOpen }: ShareButtonProps) {
  // shared: fires on every click path — gives consistent feedback regardless of mechanism
  const [shared, setShared] = useState(false);

  function flash() {
    setShared(true);
    setTimeout(() => setShared(false), 1300);
  }

  async function handleShare() {
    if (onOpen) {
      flash();
      onOpen();
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: "Pryma", url });
      flash();
    } else {
      await navigator.clipboard.writeText(url);
      flash();
    }
  }

  return (
    <div className="flex flex-col items-center gap-[10px]">
      {/* Primary action */}
      <button
        onClick={handleShare}
        className="w-[280px] border border-primary/25 text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-[120ms] ease-out hover:border-primary/50 hover:text-primary hover:bg-white/[0.05] active:scale-[0.98] active:brightness-90"
      >
        {shared ? "Ready to share" : "Send Pryma"}
      </button>
      <p className="font-light text-[10px] text-muted/50 tracking-wide">
        Share your context instantly
      </p>
    </div>
  );
}
