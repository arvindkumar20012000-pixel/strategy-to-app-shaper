interface StudyByteLogoProps {
  className?: string;
  size?: number;
}

/**
 * StudyByte monogram — professional "SB" mark on a rounded gradient tile.
 * Fully themeable via the design system's `--primary` / `--secondary` tokens.
 */
export const StudyByteLogo = ({ className, size = 32 }: StudyByteLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="StudyByte logo"
    >
      <defs>
        <linearGradient id="sb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#sb-grad)" />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />

      {/* SB monogram */}
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontSize="30"
        letterSpacing="-0.5"
        fill="hsl(var(--primary-foreground))"
      >
        SB
      </text>

      {/* Underline accent */}
      <rect
        x="20"
        y="47"
        width="24"
        height="3"
        rx="1.5"
        fill="hsl(var(--primary-foreground))"
        opacity="0.7"
      />
    </svg>
  );
};
