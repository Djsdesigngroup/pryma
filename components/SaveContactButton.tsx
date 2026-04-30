"use client";

import { useState } from "react";
import type { ResolvedContext } from "@/lib/profile";
import { generateVCF } from "@/lib/vcf";

interface SaveContactButtonProps {
  handle: string;
  fields: ResolvedContext;
  profileUrl: string;
}

export function SaveContactButton({
  handle,
  fields,
  profileUrl,
}: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const vcf = generateVCF(handle, fields, profileUrl);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${handle || fields.name.toLowerCase().replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    // Secondary action — lighter border and text weight than Send Pryma
    <button
      onClick={handleSave}
      className="w-[280px] border border-primary/15 text-secondary/70 font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-[120ms] ease-out hover:border-primary/30 hover:text-secondary hover:bg-white/[0.05] active:scale-[0.98] active:brightness-90"
    >
      {saved ? "Contact ready" : "Add to contacts"}
    </button>
  );
}
