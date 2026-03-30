import type { ResolvedContext } from "@/lib/profile";

export function generateVCF(
  handle: string,
  fields: ResolvedContext,
  profileUrl: string
): string {
  const nameParts = fields.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(fields.name)}`,
    `N:${esc(lastName)};${esc(firstName)};;;`,
    fields.role ? `TITLE:${esc(fields.role)}` : null,
    fields.organization ? `ORG:${esc(fields.organization)}` : null,
    fields.phone ? `TEL;type=CELL:${esc(fields.phone)}` : null,
    fields.email ? `EMAIL;type=INTERNET:${esc(fields.email)}` : null,
    fields.website ? `URL;type=WORK:${fields.website}` : null,
    fields.location ? `ADR;type=HOME:;;${esc(fields.location)};;;;` : null,
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
