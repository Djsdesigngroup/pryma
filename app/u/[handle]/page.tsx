// force-dynamic ensures every request fetches fresh data from the DB.
// Without this, Next.js may cache the Supabase fetch and serve stale
// profile content after a save.
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/ProfileCard";
import { PrymaLogo } from "@/components/PrymaLogo";
import { DEFAULT_PROFILE, dbProfileToCard } from "@/lib/profile";
import type { ContextMode, DbProfile } from "@/types/profile";

interface Props {
  params: { handle: string };
  searchParams: { context?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("public_full_name, public_role_title, public_organization")
    .eq("handle", params.handle)
    .maybeSingle();

  if (!data && params.handle === "dom") {
    return {
      title: "Dominic Santalucia — Pryma",
      description: "Founder of Pryma. Internet-first contact.",
    };
  }

  if (!data) return { title: `@${params.handle} — Pryma` };

  const desc = [
    data.public_role_title,
    data.public_organization ? `at ${data.public_organization}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${data.public_full_name ?? params.handle} — Pryma`,
    description: desc || "View profile on Pryma.",
  };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { handle } = params;

  // Resolve context from query param; default to "public" for non-owners
  const initialContext: ContextMode =
    searchParams.context === "professional" ? "professional" : "public";

  // Resolve profile URL from request host
  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const profileUrl = `${protocol}://${host}/u/${handle}`;

  const supabase = createClient();

  // Fetch profile and current session in parallel
  const [
    { data: dbProfile, error: dbError },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("handle", handle).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  // Always surface DB errors in server/Vercel logs
  if (dbError) {
    console.error(
      `[/u/${handle}] DB query failed:`,
      dbError.message,
      dbError.code
    );
  }

  // DB record found — authoritative source for all real users
  if (dbProfile) {
    const profile = dbProfileToCard(dbProfile as DbProfile);
    // isOwner: authenticated user whose user_id matches the profile row
    const isOwner = !!user && user.id === (dbProfile as DbProfile).user_id;
    return (
      <main className="min-h-screen flex flex-col items-center py-12">
        <ProfileCard
          profile={profile}
          profileUrl={profileUrl}
          isOwner={isOwner}
          initialContext={initialContext}
        />
      </main>
    );
  }

  // No DB record — fall back to DEFAULT_PROFILE only for the "dom" handle.
  // Covers: (a) DB profile not yet created, (b) DB query error (logged above).
  // isOwner is never set for the fallback — ownership can't be confirmed without a DB row.
  if (handle === "dom") {
    return (
      <main className="min-h-screen flex flex-col items-center py-12">
        <ProfileCard
          profile={DEFAULT_PROFILE}
          profileUrl={profileUrl}
          initialContext={initialContext}
        />
      </main>
    );
  }

  // Handle not found and not the demo fallback
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
      <PrymaLogo size={24} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-medium text-sm text-secondary tracking-wide uppercase">
          Profile not found
        </p>
        <p className="font-light text-sm text-muted">
          No profile exists for{" "}
          <span className="text-secondary">@{handle}</span>
        </p>
      </div>
    </main>
  );
}
