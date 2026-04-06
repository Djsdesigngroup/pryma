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
    if (isOwner) {
      setMode(loadContextMode());
    }
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

  return (
    <div className="relative flex flex-col items-center gap-5 w-full max-w-profile mx-auto px-6 py-4">

      {/* Owner actions menu — quiet ··· in top-right, only for the owner */}
      {isOwner && (
        <div ref={menuRef} className="absolute top-4 right-0 z-10">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Profile actions"
            className="p-2 text-muted/60 hover:text-secondary transition-colors duration-200 ease-out leading-none tracking-[0.15em] select-none"
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

      {/* Logo + avatar — tighter top stack */}
      <div className="flex flex-col items-center gap-3">
        <PrymaLogo size={32} />

        {/* Context mode selector — owners only */}
        {isOwner && (
          <SegmentedControl value={mode} onChange={handleModeChange} />
        )}

        <div className="w-20 h-20 rounded-full overflow-hidden ring-1 ring-white/[0.06] flex-shrink-0">
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
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-medium text-[26px] tracking-[-0.02em] text-primary">
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

      {/* Bio */}
      {bioLines.length > 0 && (
        <div className="flex flex-col gap-2.5 text-center -mt-1">
          {bioLines.map((line, i) => (
            <p key={i} className="font-light text-sm leading-[1.55] text-secondary">
              {line}
            </p>
          ))}
          <p className="font-light text-[10px] tracking-wide text-muted/50 uppercase mt-1">
            Shared intentionally via Pryma
          </p>
        </div>
      )}

      {/* Website + Location */}
      <div className="flex flex-col items-center gap-2">
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
      </div>

      {/* Contact row — icon-only strip, renders only if at least one item exists */}
      <ContactRow
        phone={ctx.phone}
        email={ctx.email}
        website={normalizedWebsite}
      />

      {/* Primary CTA for recipients — shown above the divider, owners use the section below */}
      {!isOwner && (
        <SaveContactButton
          handle={profile.handle}
          fields={ctx}
          profileUrl={shareUrl}
        />
      )}

      {/* Divider + Actions + QR — hidden while Share Mode is open to prevent duplicate QR */}
      {!shareModeOpen && (
        <>
          <div className="w-full border-t border-border opacity-20" />

          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-[#111111] rounded-xl p-4">
                <ProfileQR url={shareUrl} />
              </div>
              <p className="font-light text-xs text-muted tracking-wide uppercase">
                Scan to view
              </p>
            </div>
            {isOwner && (
              <>
                <ShareButton url={shareUrl} onOpen={() => setShareModeOpen(true)} />
                <SaveContactButton
                  handle={profile.handle}
                  fields={ctx}
                  profileUrl={shareUrl}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Share Mode — full-screen overlay triggered by Send Pryma */}
      {shareModeOpen && (
        <ShareMode
          url={shareUrl}
          mode={mode}
          handle={profile.handle}
          ctx={ctx}
          onClose={() => setShareModeOpen(false)}
        />
      )}
    </div>
  );
}
