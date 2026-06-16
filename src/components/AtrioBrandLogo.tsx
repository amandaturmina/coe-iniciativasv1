interface MarkProps {
  size?: number
  color?: string
}

export function AtriaMark({ size = 32, color = 'currentColor' }: MarkProps) {
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
      <path d="M24 2L46 24L24 46L2 24Z" stroke={color} strokeWidth="3" strokeLinejoin="miter" />

      {/* Upper A — two inner diagonals from apex */}
      <line x1="24" y1="9"  x2="12" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="9"  x2="36" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* Horizontal shelves connecting diamond vertices to inner A */}
      <line x1="2"  y1="24" x2="12" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="24" x2="46" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* Lower A legs */}
      <line x1="12" y1="24" x2="18" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="24" x2="30" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* Bottom arch — counter of the A */}
      <path d="M18 31H30V37L24 41L18 37Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
}

export default function AtrioBrandLogo({ variant = 'dark', size = 'md' }: LogoProps) {
  const markSize   = size === 'sm' ? 24 : size === 'lg' ? 44 : 32
  const titleSize  = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const subtitleSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'
  const markColor  = variant === 'light' ? '#FFFFFF' : '#2B3147'
  const textColor  = variant === 'light' ? 'text-white' : 'text-atrio'
  const subColor   = variant === 'light' ? 'text-white/60' : 'text-gray-400'
  const accentColor = variant === 'light' ? '#FFFFFF' : '#BE3728'

  return (
    <div className="flex items-center gap-2.5">
      <AtriaMark size={markSize} color={markColor} />
      <div className="leading-none">
        <p className={`font-semibold tracking-widest uppercase ${titleSize} ${textColor}`}>
          Atrio
        </p>
        <p className={`tracking-[0.2em] uppercase ${subtitleSize} ${subColor}`}>
          Hotel{' '}
          <span style={{ color: accentColor }} className="font-medium">
            Management
          </span>
        </p>
      </div>
    </div>
  )
}
