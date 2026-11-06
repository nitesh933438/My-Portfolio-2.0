import React, { useId } from 'react';

interface NKLogoProps {
  className?: string;
  size?: number;
  showGlow?: boolean;
  animated?: boolean;
}

export const NKLogo: React.FC<NKLogoProps> = ({
  className = 'w-10 h-10',
  size = 40,
  showGlow = false,
  animated = false,
}) => {
  // Unique ID prefix to prevent SVG defs collision across multiple instances (LoadingScreen, Navbar, Footer)
  const uniqueId = useId().replace(/:/g, '');
  const bgGradId = `nk-bg-${uniqueId}`;
  const borderGradId = `nk-border-${uniqueId}`;
  const brandGradId = `nk-brand-${uniqueId}`;
  const cyanGradId = `nk-cyan-${uniqueId}`;
  const shadowFilterId = `nk-shadow-${uniqueId}`;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-blue-600/40 to-violet-600/40 blur-md pointer-events-none -z-10" />
      )}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full block ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
        aria-label="NK Monogram - Nitesh Kumar"
      >
        <defs>
          {/* Outer container linear gradient */}
          <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B1120" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#090D1A" />
          </linearGradient>

          {/* Border subtle glow gradient */}
          <linearGradient id={borderGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
          </linearGradient>

          {/* Monogram primary gradient: Cyan -> Electric Blue -> Violet */}
          <linearGradient id={brandGradId} x1="10%" y1="10%" x2="95%" y2="90%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Secondary highlight gradient for the upper K branch */}
          <linearGradient id={cyanGradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>

          {/* Subtle drop shadow */}
          <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Squircle Background Badge */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="24"
          fill={`url(#${bgGradId})`}
          stroke={`url(#${borderGradId})`}
          strokeWidth="2.5"
        />

        {/* Monogram Symbol Group */}
        <g filter={`url(#${shadowFilterId})`}>
          {/* N Left Vertical Pillar */}
          <rect
            x="22"
            y="23"
            width="11"
            height="54"
            rx="5.5"
            fill={`url(#${brandGradId})`}
          />

          {/* N Diagonal connecting stroke */}
          <path
            d="M 27.5 24 L 52 74 C 54.5 78 60 76.5 60 72 L 60 48"
            stroke={`url(#${brandGradId})`}
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Shared Central Stem */}
          <rect
            x="51"
            y="23"
            width="11"
            height="54"
            rx="5.5"
            fill={`url(#${brandGradId})`}
          />

          {/* K Top Diagonal Branch */}
          <path
            d="M 57 48.5 L 77.5 26"
            stroke={`url(#${cyanGradId})`}
            strokeWidth="10.5"
            strokeLinecap="round"
          />

          {/* K Bottom Diagonal Branch */}
          <path
            d="M 56.5 49 L 78.5 74"
            stroke={`url(#${brandGradId})`}
            strokeWidth="10.5"
            strokeLinecap="round"
          />

          {/* Cyan accent center diamond */}
          <circle cx="56.5" cy="48.5" r="3.2" fill="#22D3EE" />
        </g>
      </svg>
    </div>
  );
};
