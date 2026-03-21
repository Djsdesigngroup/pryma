import { ContextMode, DbProfile, PrymaProfile } from "@/types/profile";

const MODE_KEY = "pryma_context_mode";

// ─── Demo seed ────────────────────────────────────────────────────────────────

export const DEFAULT_PROFILE: PrymaProfile = {
  handle: "dom",
  name: "Dominic Santalucia",
  role: "Founder",
  organization: "Pryma",
  bio: "Building infrastructure for a more transparent, human internet.\nFocused on identity, trust, and how we interact online.",
  location: "Pennsylvania, US",
  bioProfessional:
    "Founder of Pryma.\nOpen to conversations around identity systems, product, and early-stage infrastructure.",
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
