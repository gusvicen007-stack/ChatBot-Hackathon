export default function EarthGlobe({ size = 480, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className={className} role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="oceanGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7ad4ff" />
          <stop offset="45%" stopColor="#1cb0f6" />
          <stop offset="100%" stopColor="#0e5f9e" />
        </radialGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#3ec1ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3ec1ff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx="200" cy="200" r="168" />
        </clipPath>
      </defs>

      <circle cx="200" cy="200" r="196" fill="url(#glowGrad)" />

      <ellipse
        cx="200"
        cy="200"
        rx="196"
        ry="60"
        fill="none"
        stroke="#7ad4ff"
        strokeOpacity="0.35"
        strokeWidth="2"
        transform="rotate(-18 200 200)"
      />

      <circle cx="200" cy="200" r="168" fill="url(#oceanGrad)" />

      <g clipPath="url(#globeClip)">
        <path
          d="M60 150 C50 190 70 220 60 260 C90 280 120 250 140 270 C160 250 150 210 170 190 C150 170 120 180 100 160 Z"
          fill="#58cc02"
          opacity="0.9"
        />
        <path
          d="M210 90 C230 100 260 90 280 110 C300 100 320 130 300 150 C310 170 290 190 260 180 C250 200 220 190 220 170 C200 160 200 130 210 90 Z"
          fill="#3fae0a"
          opacity="0.9"
        />
        <path
          d="M230 220 C260 215 290 235 280 265 C300 285 270 310 240 295 C220 310 200 290 210 270 C195 255 210 230 230 220 Z"
          fill="#58cc02"
          opacity="0.85"
        />
        <path d="M120 90 C140 85 155 100 145 115 C155 130 135 140 120 130 C105 135 100 115 115 105 Z" fill="#3fae0a" opacity="0.85" />
      </g>

      <circle cx="200" cy="200" r="168" fill="none" stroke="#0b3a63" strokeOpacity="0.25" strokeWidth="3" />
      <ellipse cx="150" cy="140" rx="70" ry="46" fill="#ffffff" opacity="0.18" />
    </svg>
  );
}
