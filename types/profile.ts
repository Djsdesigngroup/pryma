export type ContextMode = "public" | "professional";

export interface PrymaProfile {
  handle: string;

  publicFullName?: string;
  professionalFullName?: string;

  publicRoleTitle?: string;
  professionalRoleTitle?: string;

  publicOrganization?: string;
  professionalOrganization?: string;

  publicBio?: string;
  professionalBio?: string;

  publicWebsite?: string;
  professionalWebsite?: string;

  publicLocation?: string;
  professionalLocation?: string;

  publicPhone?: string;
  professionalPhone?: string;

  publicEmail?: string;
  professionalEmail?: string;

  publicAvatarUrl?: string;
  professionalAvatarUrl?: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  handle: string;

  public_full_name: string | null;
  professional_full_name: string | null;

  public_role_title: string | null;
  professional_role_title: string | null;

  public_organization: string | null;
  professional_organization: string | null;

  public_avatar_url: string | null;
  professional_avatar_url: string | null;

  public_phone: string | null;
  professional_phone: string | null;

  public_email: string | null;
  professional_email: string | null;

  public_bio: string | null;
  professional_bio: string | null;

  public_website: string | null;
  professional_website: string | null;

  public_location: string | null;
  professional_location: string | null;

  created_at: string;
  updated_at: string;
}