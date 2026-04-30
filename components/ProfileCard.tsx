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
  // Renders the owner ··· menu when true — set server-side via auth check
  isOwner?: boolean;
  // Context to display for non-owners (from ?context= query param, default "public")
  initialContext?: ContextMode;
}

export function ProfileCard({
  profile,
  profileUrl,
  isOwner = false,
  initialContext = "public",
}: ProfileCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ContextMode>(initialContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareModeOpen, setShareModeOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Owners load their last-used context from localStorage
  useEffect(() => {
    if (isOwner) setMode(loadContextMode());
  }, [isOwner]);

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
    setMode(next);
    saveContextMode(next);
  }

  // Hoisted so ShareButton and ShareMode receive stable-named references
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

  // Resolve all display fields for the active context.
  // Professional fields fall back to public when not set.
  const ctx = resolveContext(profile, mode);

  // Normalize website so bare domains like "pryma.id" form valid hrefs
  const normalizedWebsite = ctx.website ? normalizeUrl(ctx.website) : undefined;

  // Context-aware share URL — professional recipients land on the professional view
  const shareUrl =
    mode === "professional"
      ? `${profileUrl}?context=professional`
      : profileUrl;

  const bioLines = ctx.bio?.split("\n\n").filter(Boolean) ?? [];

  // Extracted to avoid duplicating identical props across recipient and owner sites
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

      {/* Owner actions menu — quiet ··· in top-right, only for the owner */}
      {isOwner && (
        <div ref={menuRef} className="absolute top-6 right-0 z-10">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Profile actions"
            className="w-11 h-11 flex items-center justify-center text-base text-muted/60 hover:text-secondary hover:bg-white/5 rounded-lg transition-colors duration-200 ease-out leading-none tracking-[0.2em] select-none"
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

      {/* ── Header block: logo → [toggle] → avatar → name → role ──
          Individual margins for precise spacing at each step */}
      <div className="flex flex-col items-center">
        <PrymaLogo size={35} />

        {/* Context mode selector — owners only; mt-5 (20px) below logo */}
        {isOwner && (
          <div className="mt-5">
            <SegmentedControl value={mode} onChange={handleModeChange} />
          </div>
        )}

        {/* mt-7 (28px) below toggle for owners; mt-6 (24px) below logo for recipients */}
        <div
          className={`w-20 h-20 rounded-full overflow-hidden ring-1 ring-white/[0.06] flex-shrink-0 ${isOwner ? "mt-7" : "mt-6"}`}
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

        {/* Name + role — mt-[18px] below avatar */}
        <div className="flex flex-col items-center gap-1 text-center mt-[18px]">
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
      </div>

      {/* ── Bio — mt-6 (24px) below header ── */}
      {bioLines.length > 0 && (
        <div className="flex flex-col gap-3 text-center mt-6 max-w-[360px] mx-auto">
          {bioLines.map((line, i) => (
            <p key={i} className="font-light text-sm leading-[1.65] text-secondary">
              {line}
            </p>
          ))}
          <p className="font-light text-[10px] tracking-wide text-muted/60 uppercase mt-2">
            Shared intentionally via Pryma
          </p>
        </div>
      )}

      {/* ── Metadata: website + location + contact icons ──
          mt-4 (16px) below bio — gap-2 (8px) within, same information tier */}
      <div className="flex flex-col items-center gap-2 mt-4">
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

      {/* ── Recipient primary CTA — mt-6 (24px) below metadata ──
          Owners get their SaveContactButton in the action block below */}
      {!isOwner && <div className="mt-6">{saveContactButton}</div>}

      {/* ── Divider + QR + owner actions — mt-6 (24px) below last content ──
          Hidden while ShareMode is open to prevent a duplicate QR on screen */}
      {!shareModeOpen && (
        <div className="w-full mt-6">
          <div className="w-full border-t border-border opacity-10" />

          {/* gap-7 (28px): QR group → owner buttons */}
          <div className="flex flex-col items-center gap-7 mt-8">
            {/* gap-2 (8px): QR image → label — tight single unit */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[#111111] rounded-xl p-4">
                <ProfileQR url={shareUrl} size={122} />
              </div>
              <p className="font-light text-xs text-muted tracking-wide uppercase">
                Scan to view
              </p>
            </div>

            {/* Owner-only actions — gap-6 (24px): covers ShareButton microcopy → SaveContact */}
            {isOwner && (
              <div className="flex flex-col items-center gap-6 w-full">
                <ShareButton url={shareUrl} onOpen={handleOpenShareMode} />
                {saveContactButton}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Mode — full-screen overlay triggered by Send Pryma */}
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
