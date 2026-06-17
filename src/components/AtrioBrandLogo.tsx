interface MarkProps {
  size?: number
  color?: string
}

export function AtriaMark({ size = 36, color = '#1a1917' }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M40 5L75 40L40 75L5 40L40 5Z" stroke={color} strokeWidth="5" fill="none"/>
      <path d="M40 18L62 40L40 62L18 40L40 18Z" stroke={color} strokeWidth="4" fill="none"/>
      <path d="M28 40L40 20L52 40" stroke={color} strokeWidth="4" fill="none"/>
      <path d="M32 40H48V58H32V40Z" stroke={color} strokeWidth="4" fill="none"/>
    </svg>
  )
}

export default function AtrioBrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <AtriaMark size={30} color="#1a1917" />
      <div className="leading-none">
        <p className="font-bold text-[13px] text-[#1a1917] tracking-wide whitespace-nowrap">COE SYSTEM ATRIO</p>
        <p className="text-[9px] text-[#6b6966] tracking-wide whitespace-nowrap">Hotel Management</p>
      </div>
    </div>
  )
}
