export type ContextMode = "public" | "professional";

export interface PrymaProfile {
  handle: string;
  name: string;
  role: string;
  organization: string;
  // Public context
  bio: string;
  website?: string;
  location?: string;
  // Professional context
  bioProfessional?: string;
  websiteProfessional?: string;
  locationProfessional?: string;
  // Global contact fields (not context-specific)
  phone?: string;
  email?: string;
  // Avatar — accepts URL or data URL
  avatarUrl?: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  handle: string;
  full_name: string;
  role_title: string | null;
  organization: string | null;
  avatar_url: string | null;
  public_bio: string | null;
  public_website: string | null;
  public_location: string | null;
  professional_bio: string | null;
  professional_website: string | null;
  professional_location: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}
