/**
 * 필요한 아이콘만 인라인 SVG로 둔다. 아이콘 라이브러리를 통째로 넣을 만큼
 * 종류가 많지 않고, 번들과 의존성을 아끼는 편이 낫다.
 * 모두 24x24 stroke 기반이라 currentColor와 size prop으로 제어된다.
 */
interface IconProps {
  size?: number
  className?: string
}

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

export const LeafIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M5 21c.5-4.5 2.5-8 6-10" />
    <path d="M4 15c0-6 4-9 10-9 2 0 4-.3 5.5-1 .8 2 .5 4-.5 6.5C17 16 13 18 9 18c-2 0-4-1-5-3z" />
  </svg>
)

export const CirclesIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="9" cy="12" r="5" />
    <circle cx="15" cy="12" r="5" />
  </svg>
)

export const MapIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
    <path d="M9 4v13M15 6.5v13" />
  </svg>
)

export const ChartLineIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="m7 14 3.5-4 3 2.5L19 7" />
  </svg>
)

export const DatabaseIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </svg>
)

export const SettingsIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
)

export const ChevronLeftIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)
