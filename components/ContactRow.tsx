"use client";

// ContactRow — minimal icon-only contact strip.
// Renders nothing if no items are present.
// Inline SVGs only, no icon library dependency.

interface ContactRowProps {
  phone?: string;
  email?: string;
  website?: string; // should already be normalized (https://)
}

type ContactItem = {
  key: string;
  href: string;
  label: string;
  external: boolean;
  icon: React.ReactNode;
};

export function ContactRow({ phone, email, website }: ContactRowProps) {
  const items: ContactItem[] = [
    ...(phone
      ? [
          {
            key: "phone",
            href: `tel:${phone}`,
            label: "Call",
            external: false,
            icon: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 15 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2.5 3.5a1 1 0 011-1H5l1 2.5-1.5 1.2c.7 1.4 1.8 2.5 3.3 3.3L9 8l2.5 1v1.5a1 1 0 01-1 1C5.5 11.5 2.5 8.5 2.5 5v-1.5z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(email
      ? [
          {
            key: "email",
            href: `mailto:${email}`,
            label: "Email",
            external: false,
            icon: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 15 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="1.5" y="3.5" width="12" height="8" rx="1" />
                <path d="M1.5 5l6 4 6-4" />
              </svg>
            ),
          },
        ]
      : []),
    ...(website
      ? [
          {
            key: "website",
            href: website,
            label: "Website",
            external: true,
            icon: (
              <svg
                width="17"
                height="17"
                viewBox="0 0 15 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="7.5" cy="7.5" r="5.5" />
                <path d="M7.5 2c-1.5 2-2 3.5-2 5.5s.5 3.5 2 5.5M7.5 2c1.5 2 2 3.5 2 5.5s-.5 3.5-2 5.5" />
                <path d="M2 7.5h11" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-8">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          aria-label={item.label}
          className="text-muted/50 hover:text-secondary transition-colors duration-200 ease-out"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}