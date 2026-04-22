interface StudyByteLogoProps {
  className?: string;
  size?: number;
}

/**
 * StudyByte mark — themeable SVG that adapts to light/dark mode
 * via the design system's `--primary` and `--secondary` HSL tokens.
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
      {/* Rounded square background using primary token */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="hsl(var(--primary))"
      />
      {/* Open book pages */}
      <path
        d="M14 22 C14 20.9 14.9 20 16 20 L30 20 C31.1 20 32 20.9 32 22 L32 46 C32 47.1 31.1 48 30 48 L16 48 C14.9 48 14 47.1 14 46 Z"
        fill="hsl(var(--primary-foreground))"
        opacity="0.95"
      />
      <path
        d="M32 22 C32 20.9 32.9 20 34 20 L48 20 C49.1 20 50 20.9 50 22 L50 46 C50 47.1 49.1 48 48 48 L34 48 C32.9 48 32 47.1 32 46 Z"
        fill="hsl(var(--primary-foreground))"
        opacity="0.85"
      />
      {/* Spine */}
      <rect
        x="31"
        y="20"
        width="2"
        height="28"
        fill="hsl(var(--primary))"
        opacity="0.5"
      />
      {/* Accent byte/spark dot in secondary color */}
      <circle cx="46" cy="18" r="6" fill="hsl(var(--secondary))" />
      <circle
        cx="46"
        cy="18"
        r="2.2"
        fill="hsl(var(--secondary-foreground))"
      />
    </svg>
  );
};
