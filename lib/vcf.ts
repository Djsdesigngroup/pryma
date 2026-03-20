import { PrymaProfile } from "@/types/profile";

export function generateVCF(profile: PrymaProfile, profileUrl: string): string {
  const nameParts = profile.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(profile.name)}`,
    `N:${esc(lastName)};${esc(firstName)};;;`,
    profile.role ? `TITLE:${esc(profile.role)}` : null,
    profile.organization ? `ORG:${esc(profile.organization)}` : null,
    profile.website ? `URL;type=WORK:${profile.website}` : null,
    profile.location ? `ADR;type=HOME:;;${esc(profile.location)};;;;` : null,
    `URL;type=pryma:${profileUrl}`,
    `NOTE:Pryma — ${profileUrl}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines + "\r\n";
}

function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}
