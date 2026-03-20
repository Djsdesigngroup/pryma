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
      {/*
        Half-dome arc
        strokeWidth: 2.5 → 3.05  (+22.0% exact)
        Path unchanged — same A20 24 ellipse, apex at y=4, endpoints at (4,28) and (44,28)
      */}
      <path
        d="M4 28 A20 24 0 0 1 44 28"
        stroke="#f5f5f5"
        strokeWidth="3.05"
        strokeLinecap="round"
        fill="none"
      />

      {/*
        Horizon line
        strokeWidth matched to arch (3.05) for visual weight parity
      */}
      <line
        x1="1"
        y1="28"
        x2="47"
        y2="28"
        stroke="#f5f5f5"
        strokeWidth="3.05"
        strokeLinecap="round"
      />

      {/*
        Rising dot
        r: 3.5 → 3.89  (+11.1% exact, ⌀7.0 → 7.78)
        cy: 28 → 25.0
          – spacing reduction: gap 18.585 → 16.35 (−12.0%)
          – optical centering: +0.75px lift applied after spacing calc
        Dot bottom at y=28.89 — intentionally embeds into horizon line,
        reading as a form rising from the ground plane.
      */}
      <circle cx="24" cy="25" r="3.89" fill="#f5f5f5" />
    </svg>
  );
}
