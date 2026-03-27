"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContextMode, PrymaProfile } from "@/types/profile";
import { loadContextMode, normalizeUrl, saveContextMode } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { PrymaLogo } from "@/components/PrymaLogo";
import { ShareButton } from "@/components/ShareButton";
import { SaveContactButton } from "@/components/SaveContactButton";
import { ProfileQR } from "@/components/QRCode";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ContactRow } from "@/components/ContactRow";

interface ProfileCardProps {
  profile: PrymaProfile;
  profileUrl: string;
  // Renders the owner ··· menu when true — set server-side via auth check
  isOwner?: boolean;
}

export function ProfileCard({ profile, profileUrl, isOwner = false }: ProfileCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ContextMode>("public");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(loadContextMode());
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
    setMode(next);
    saveContextMode(next);
  }

  async function handleOwnerSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  // Resolve active context fields
  const activeBio =
    mode === "professional" && profile.bioProfessional
      ? profile.bioProfessional
      : profile.bio;
  const activeWebsite =
    mode === "professional" && profile.websiteProfessional !== undefined
      ? profile.websiteProfessional
      : profile.website;
  const activeLocation =
    mode === "professional" && profile.locationProfessional !== undefined
      ? profile.locationProfessional
      : profile.location;

  // Normalize website so bare domains like "pryma.id" form valid hrefs
  const normalizedWebsite = activeWebsite ? normalizeUrl(activeWebsite) : undefined;

  const bioLines = activeBio?.split("\n\n").filter(Boolean) ?? [];

  return (
    <div className="relative flex flex-col items-center gap-6 w-full max-w-profile mx-auto px-6 py-12">

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

      {/* Logo mark */}
      <PrymaLogo size={32} />

      {/* Context mode selector */}
      <SegmentedControl value={mode} onChange={handleModeChange} />

      {/* Avatar */}
      <div className="w-20 h-20 rounded-full overflow-hidden border border-border/30 flex-shrink-0">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-2xl font-light select-none">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-medium text-[26px] tracking-[-0.02em] text-primary">
          {profile.name}
        </h1>
        <p className="font-light text-sm text-secondary">
          {profile.role}
          {profile.organization && (
            <>
              {" "}
              <span className="text-muted">·</span> {profile.organization}
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
          <p className="font-light text-[10px] tracking-wide text-muted/60 uppercase mt-1">
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
        {activeLocation && (
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
            {activeLocation}
          </span>
        )}
      </div>

      {/* Contact row — icon-only strip, renders only if at least one item exists */}
      <ContactRow
        phone={profile.phone}
        email={profile.email}
        website={normalizedWebsite}
      />

      {/* Divider */}
      <div className="w-full border-t border-border opacity-20" />

      {/* Actions + QR */}
      <div className="flex flex-col items-center gap-4">
        <ShareButton url={profileUrl} />
        <SaveContactButton profile={profile} profileUrl={profileUrl} />
        <div className="flex flex-col items-center gap-3 mt-1">
          <div className="bg-[#111111] rounded-xl p-4">
            <ProfileQR url={profileUrl} />
          </div>
          <p className="font-light text-xs text-muted tracking-wide uppercase">
            Scan to view
          </p>
        </div>
      </div>
    </div>
  );
}
