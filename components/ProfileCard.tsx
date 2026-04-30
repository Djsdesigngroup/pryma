"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContextMode, PrymaProfile } from "@/types/profile";
import {
  loadContextMode,
  normalizeUrl,
  resolveContext,
  saveContextMode,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { PrymaLogo } from "@/components/PrymaLogo";
import { ShareButton } from "@/components/ShareButton";
import { SaveContactButton } from "@/components/SaveContactButton";
import { ProfileQR } from "@/components/QRCode";
import { ShareMode } from "@/components/ShareMode";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ContactRow } from "@/components/ContactRow";

interface ProfileCardProps {
  profile: PrymaProfile;
  profileUrl: string;
  isOwner?: boolean;
  initialContext?: ContextMode;
}

export function ProfileCard({
  profile,
  profileUrl,
  isOwner = false,
  initialContext = "public",
}: ProfileCardProps) {
  const router = useRouter();

  // mode: drives toggle indicator immediately
  const [mode, setMode] = useState<ContextMode>(initialContext);
  // displayedMode: lags mode by ~110ms so content fades out before swapping
  const [displayedMode, setDisplayedMode] = useState<ContextMode>(initialContext);
  // contentVisible: drives opacity/translateY on the content wrapper
  const [contentVisible, setContentVisible] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareModeOpen, setShareModeOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Owners load their last-used context from localStorage
  useEffect(() => {
    if (isOwner) {
      const saved = loadContextMode();
      setMode(saved);
      setDisplayedMode(saved);
    }
  }, [isOwner]);

  // Clean up pending transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  // Close owner menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  function handleModeChange(next: ContextMode) {
    if (next === mode) return;
    setMode(next);
    saveContextMode(next);

    // Fade out, swap content, fade in
    if (transitionRef.current) clearTimeout(transitionRef.current);
    setContentVisible(false);
    transitionRef.current = setTimeout(() => {
      setDisplayedMode(next);
      setContentVisible(true);
    }, 100);
  }

  function handleOpenShareMode() {
    setShareModeOpen(true);
  }

  function handleCloseShareMode() {
    setShareModeOpen(false);
  }

  async function handleOwnerSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  // All display fields resolved from displayedMode so they update after the fade swap
  const ctx = resolveContext(profile, displayedMode);
  const normalizedWebsite = ctx.website ? normalizeUrl(ctx.website) : undefined;

  // shareUrl follows displayedMode so the QR also updates after the fade swap
  const shareUrl =
    displayedMode === "professional"
      ? `${profileUrl}?context=professional`
      : profileUrl;

  const bioLines = ctx.bio?.split("\n\n").filter(Boolean) ?? [];

  const saveContactButton = (
    <SaveContactButton
      handle={profile.handle}
      fields={ctx}
      profileUrl={shareUrl}
    />
  );

  return (
    // Spacing system: 4=micro 8=tight 12=grouped 16=standard 24=section 32=page
    <div className="relative flex flex-col items-center w-full max-w-profile mx-auto px-6 pt-8 pb-6">

      {/* Owner actions menu */}
      {isOwner && (
        <div ref={menuRef} className="absolute top-6 right-0 z-10">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Profile actions"
            className="w-11 h-11 flex items-center justify-center text-base text-muted/60 hover:text-secondary hover:bg-white/5 rounded-lg transition-colors duration-[120ms] ease-out leading-none tracking-[0.2em] select-none"
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border/60 rounded-xl overflow-hidden min-w-[148px]">
              <button
                onClick={() => { setMenuOpen(false); router.push("/edit"); }}
                className="w-full text-left px-4 py-3 text-sm font-light text-secondary hover:text-primary transition-colors duration-200 ease-out"
              >
                Edit profile
              </button>
              <div className="border-t border-border/30" />
              <button
                onClick={handleOwnerSignOut}
                className="w-full text-left px-4 py-3 text-sm font-light text-secondary hover:text-primary transition-colors duration-200 ease-out"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Static header: logo → [toggle] → avatar ──
          These elements do not participate in the mode content transition */}

      {/* Logo — entrance: delay 0ms */}
      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <PrymaLogo size={35} />
      </div>

      {/* Context toggle — owners only; entrance: delay 60ms */}
      {isOwner && (
        <div className="mt-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <SegmentedControl value={mode} onChange={handleModeChange} />
        </div>
      )}

      {/* Avatar — entrance: delay 80ms */}
      <div
        className={[
          "w-20 h-20 rounded-full overflow-hidden ring-1 ring-white/[0.06] flex-shrink-0",
          "transition-transform duration-200 ease-out hover:scale-[1.01]",
          "animate-fade-up",
          isOwner ? "mt-7" : "mt-6",
        ].join(" ")}
        style={{ animationDelay: "80ms" }}
      >
        {ctx.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ctx.avatarUrl}
            alt={ctx.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-2xl font-light select-none">
            {ctx.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Content wrapper: fades on mode switch, entrance-animates on load ──
          Contains everything that changes with context: name, role, bio, meta, actions */}
      <div
        className="flex flex-col items-center w-full transition-[opacity,transform] duration-[120ms] ease-out"
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(-3px)",
        }}
      >

        {/* Name + role — entrance: delay 120ms */}
        <div
          className="flex flex-col items-center gap-1 text-center mt-[18px] animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <h1 className="font-medium text-[25px] tracking-[-0.01em] text-primary">
            {ctx.name}
          </h1>
          <p className="font-light text-sm text-secondary">
            {ctx.role}
            {ctx.organization && (
              <>
                {" "}
                <span className="text-muted">·</span> {ctx.organization}
              </>
            )}
          </p>
        </div>

        {/* Bio — entrance: delay 180ms */}
        {bioLines.length > 0 && (
          <div
            className="flex flex-col gap-3 text-center mt-6 max-w-[360px] mx-auto animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            {bioLines.map((line, i) => (
              <p key={i} className="font-light text-sm leading-[1.65] text-secondary">
                {line}
              </p>
            ))}
            {/* Microcopy — extra delay so it arrives after the main bio */}
            <p
              className="font-light text-[10px] tracking-wide text-muted/60 uppercase mt-2 animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              Shared intentionally via Pryma
            </p>
          </div>
        )}

        {/* Metadata: website + location + contact icons — entrance: delay 240ms */}
        <div
          className="flex flex-col items-center gap-2 mt-4 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          {normalizedWebsite && (
            <a
              href={normalizedWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="font-light text-sm text-secondary hover:text-primary transition-colors duration-200 ease-out"
            >
              {normalizedWebsite.replace(/^https?:\/\//, "")}
            </a>
          )}
          {ctx.location && (
            <span className="flex items-center gap-1.5 font-light text-sm text-muted">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6 1C4.067 1 2.5 2.567 2.5 4.5C2.5 7 6 11 6 11C6 11 9.5 7 9.5 4.5C9.5 2.567 7.933 1 6 1Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
                <circle cx="6" cy="4.5" r="1" fill="currentColor" />
              </svg>
              {ctx.location}
            </span>
          )}
          <ContactRow phone={ctx.phone} email={ctx.email} website={normalizedWebsite} />
        </div>

        {/* Recipient primary CTA — entrance: delay 280ms */}
        {!isOwner && (
          <div
            className="mt-6 animate-fade-up"
            style={{ animationDelay: "280ms" }}
          >
            {saveContactButton}
          </div>
        )}

        {/* Divider + QR + owner actions — entrance: delay 300ms */}
        {!shareModeOpen && (
          <div
            className="w-full mt-6 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="w-full border-t border-border opacity-10" />

            <div className="flex flex-col items-center gap-7 mt-8">
              {/* QR — subtle hover scale */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="bg-[#111111] rounded-xl p-4 transition-[opacity,transform,filter] duration-[160ms] ease-out opacity-90 hover:opacity-100 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                >
                  <ProfileQR url={shareUrl} size={122} />
                </div>
                <p className="font-light text-xs text-muted/40 tracking-wide uppercase">
                  Scan to view
                </p>
              </div>

              {/* Owner-only actions */}
              {isOwner && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <ShareButton url={shareUrl} onOpen={handleOpenShareMode} />
                  {saveContactButton}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Mode overlay */}
      {shareModeOpen && (
        <ShareMode
          url={shareUrl}
          mode={mode}
          handle={profile.handle}
          ctx={ctx}
          onClose={handleCloseShareMode}
        />
      )}
    </div>
  );
}
