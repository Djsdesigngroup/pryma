import { headers } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/ProfileCard";
import { PrymaLogo } from "@/components/PrymaLogo";
import { DEFAULT_PROFILE, dbProfileToCard } from "@/lib/profile";
import type { DbProfile } from "@/types/profile";

interface Props {
  params: { handle: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, role_title, organization")
    .eq("handle", params.handle)
    .maybeSingle();

  if (!data && params.handle === "dom") {
    return {
      title: "Dominic Santalucia — Pryma",
      description: "Founder of Pryma. Internet-first contact.",
    };
  }

  if (!data) return { title: `@${params.handle} — Pryma` };

  const desc = [data.role_title, data.organization ? `at ${data.organization}` : null]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${data.full_name} — Pryma`,
    description: desc || "View profile on Pryma.",
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = params;

  // Resolve profile URL from request host
  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const profileUrl = `${protocol}://${host}/u/${handle}`;

  const supabase = createClient();
  const { data: dbProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (dbProfile) {
    const profile = dbProfileToCard(dbProfile as DbProfile);
    return (
      <main className="min-h-screen flex flex-col items-center py-12">
        <ProfileCard profile={profile} profileUrl={profileUrl} />
      </main>
    );
  }

  // Demo fallback — always available without DB
  if (handle === "dom") {
    return (
      <main className="min-h-screen flex flex-col items-center py-12">
        <ProfileCard profile={DEFAULT_PROFILE} profileUrl={profileUrl} />
      </main>
    );
  }

  // Not found
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
