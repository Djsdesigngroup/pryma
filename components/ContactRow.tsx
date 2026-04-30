"use client";

// ContactRow — minimal icon-only contact strip.
// Renders nothing if no items are present.
// Inline SVGs only, no icon library dependency.
// Icons: 16px inside 28x28 container, strokeWidth 1.75, optical translateY(1px) default.

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

// Shared icon props — normalized stroke weight and size
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 15 15",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
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
              <svg {...iconProps}>
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
              <svg {...iconProps}>
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
              <svg {...iconProps}>
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
          className="w-7 h-7 flex items-center justify-center text-secondary opacity-70 hover:opacity-[0.95] hover:-translate-y-px active:scale-[0.96] transition-[opacity,transform] duration-[120ms] ease-out"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
