import type { ContextMode, DbProfile, PrymaProfile } from "@/types/profile";

const MODE_KEY = "pryma_context_mode";

export function normalizeUrl(url: string): string {
  if (!url || url.trim() === "") return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export const DEFAULT_PROFILE: PrymaProfile = {
  handle: "dom",
  publicFullName: "Dominic Santalucia",
  professionalFullName: "Dominic Santalucia",
  publicRoleTitle: "Founder",
  professionalRoleTitle: "Founder & Product Lead",
  publicOrganization: "Pryma",
  professionalOrganization: "Pryma",
  publicBio:
    "Building infrastructure for a more transparent, human internet.\n\nFocused on identity, trust, and how we interact online.",
  publicLocation: "Pennsylvania, US",
  professionalBio:
    "Founder of Pryma. Working on identity infrastructure, context-based contact sharing, and products that reduce friction in real-world interaction.",
  professionalLocation: "Pennsylvania, US",
};

export function dbProfileToCard(db: DbProfile): PrymaProfile {
  return {
    handle: db.handle,
    publicFullName: db.public_full_name ?? undefined,
    professionalFullName: db.professional_full_name ?? undefined,
    publicRoleTitle: db.public_role_title ?? undefined,
    professionalRoleTitle: db.professional_role_title ?? undefined,
    publicOrganization: db.public_organization ?? undefined,
    professionalOrganization: db.professional_organization ?? undefined,
    publicAvatarUrl: db.public_avatar_url ?? undefined,
    professionalAvatarUrl: db.professional_avatar_url ?? undefined,
    publicPhone: db.public_phone ?? undefined,
    professionalPhone: db.professional_phone ?? undefined,
    publicEmail: db.public_email ?? undefined,
    professionalEmail: db.professional_email ?? undefined,
    publicBio: db.public_bio ?? undefined,
    professionalBio: db.professional_bio ?? undefined,
    publicWebsite: db.public_website ?? undefined,
    professionalWebsite: db.professional_website ?? undefined,
    publicLocation: db.public_location ?? undefined,
    professionalLocation: db.professional_location ?? undefined,
  };
}

// Flat display fields resolved for the active context.
// Professional falls back to public when a professional field is not set.
export interface ResolvedContext {
  name: string;
  role?: string;
  organization?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  bio?: string;
  website?: string;
  location?: string;
}

export function resolveContext(
  profile: PrymaProfile,
  mode: ContextMode
): ResolvedContext {
  if (mode === "professional") {
    return {
      name: profile.professionalFullName ?? profile.publicFullName ?? "",
      role: profile.professionalRoleTitle ?? profile.publicRoleTitle,
      organization:
        profile.professionalOrganization ?? profile.publicOrganization,
      avatarUrl: profile.professionalAvatarUrl ?? profile.publicAvatarUrl,
      phone: profile.professionalPhone ?? profile.publicPhone,
      email: profile.professionalEmail ?? profile.publicEmail,
      bio: profile.professionalBio ?? profile.publicBio,
      website: profile.professionalWebsite ?? profile.publicWebsite,
      location: profile.professionalLocation ?? profile.publicLocation,
    };
  }
  return {
    name: profile.publicFullName ?? "",
    role: profile.publicRoleTitle,
    organization: profile.publicOrganization,
    avatarUrl: profile.publicAvatarUrl,
    phone: profile.publicPhone,
    email: profile.publicEmail,
    bio: profile.publicBio,
    website: profile.publicWebsite,
    location: profile.publicLocation,
  };
}

export function saveContextMode(mode: ContextMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, mode);
}

export function loadContextMode(): ContextMode {
  if (typeof window === "undefined") return "public";
  const raw = localStorage.getItem(MODE_KEY);
  return raw === "professional" ? "professional" : "public";
}
