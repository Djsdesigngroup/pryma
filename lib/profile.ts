import { ContextMode, DbProfile, PrymaProfile } from "@/types/profile";

const MODE_KEY = "pryma_context_mode";

// ─── URL normalization ─────────────────────────────────────────────────────────
// Adds https:// when no protocol is present so bare domains don't produce
// broken relative links. Already-valid http:// and https:// entries pass through.

export function normalizeUrl(url: string): string {
  if (!url || url.trim() === "") return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// ─── Demo seed ────────────────────────────────────────────────────────────────
// Used as fallback for /u/dom when no DB record exists.
// Bios use \n\n (double newline) so ProfileCard's paragraph splitter works correctly.

export const DEFAULT_PROFILE: PrymaProfile = {
  handle: "dom",
  name: "Dominic Santalucia",
  role: "Founder",
  organization: "Pryma",
  bio: "Building infrastructure for a more transparent, human internet.\n\nFocused on identity, trust, and how we interact online.",
  location: "Pennsylvania, US",
  bioProfessional:
    "Founder of Pryma.\n\nOpen to conversations around identity systems, product, and early-stage infrastructure.",
  locationProfessional: "Pennsylvania, US",
};

// ─── DB conversions ───────────────────────────────────────────────────────────

export function dbProfileToCard(db: DbProfile): PrymaProfile {
  return {
    handle: db.handle,
    name: db.full_name,
    role: db.role_title ?? "",
    organization: db.organization ?? "",
    bio: db.public_bio ?? "",
    website: db.public_website ?? undefined,
    location: db.public_location ?? undefined,
    bioProfessional: db.professional_bio ?? undefined,
    websiteProfessional: db.professional_website ?? undefined,
    locationProfessional: db.professional_location ?? undefined,
    phone: db.phone ?? undefined,
    email: db.email ?? undefined,
    avatarUrl: db.avatar_url ?? undefined,
  };
}

// ─── Context mode (localStorage preference) ───────────────────────────────────

export function saveContextMode(mode: ContextMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function loadContextMode(): ContextMode {
  if (typeof window === "undefined") return "public";
  const raw = localStorage.getItem(MODE_KEY);
  return raw === "professional" ? "professional" : "public";
}
