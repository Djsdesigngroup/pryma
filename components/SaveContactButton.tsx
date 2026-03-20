"use client";

import { useState } from "react";
import { PrymaProfile } from "@/types/profile";
import { generateVCF } from "@/lib/vcf";

interface SaveContactButtonProps {
  profile: PrymaProfile;
  profileUrl: string;
}

export function SaveContactButton({
  profile,
  profileUrl,
}: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const vcf = generateVCF(profile, profileUrl);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.handle || profile.name.toLowerCase().replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <button
      onClick={handleSave}
      className="w-[280px] border border-primary/20 text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/40 hover:text-primary"
    >
      {saved ? "Contact ready to add" : "Save contact"}
    </button>
  );
}
