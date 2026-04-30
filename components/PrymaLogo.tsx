interface PrymaLogoProps {
  size?: number;
}

export function PrymaLogo({ size = 24 }: PrymaLogoProps) {
  const width = size * 1.6;
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pryma"
      role="img"
    >
      <path
        d="M5.5 24C5.5 12.9543 13.7827 4 24 4C34.2173 4 42.5 12.9543 42.5 24"
        stroke="currentColor"
        strokeWidth="3.05"
        strokeLinecap="round"
      />
      <circle cx="24" cy="22" r="3.9" fill="currentColor" />
    </svg>
  );
}
