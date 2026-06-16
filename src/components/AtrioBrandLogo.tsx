interface MarkProps {
  size?: number
  color?: string
}

export function AtriaMark({ size = 32, color = '#111111' }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer diamond */}
      <path d="M24 2L46 24L24 46L2 24Z" stroke={color} strokeWidth="3.5" strokeLinejoin="miter" />

      {/* Upper inner V — from top vertex to inner crossbar points */}
      <line x1="24" y1="2"  x2="13" y2="24" stroke={color} strokeWidth="2.5" />
      <line x1="24" y1="2"  x2="35" y2="24" stroke={color} strokeWidth="2.5" />

      {/* Horizontal shelves — from diamond vertices to inner points */}
      <line x1="2"  y1="24" x2="13" y2="24" stroke={color} strokeWidth="2.5" />
      <line x1="35" y1="24" x2="46" y2="24" stroke={color} strokeWidth="2.5" />

      {/* Lower A legs */}
      <line x1="13" y1="24" x2="18" y2="37" stroke={color} strokeWidth="2.5" />
      <line x1="35" y1="24" x2="30" y2="37" stroke={color} strokeWidth="2.5" />

      {/* Bottom arch — counter of the A */}
      <path
        d="M18 30H30V37L24 42L18 37Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AtrioBrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <AtriaMark size={28} color="#111111" />
      <span className="font-semibold tracking-widest uppercase text-sm text-gray-900">
        Atrio
      </span>
    </div>
  )
}
