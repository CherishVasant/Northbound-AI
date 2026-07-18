import Link from 'next/link'

interface NorthboundBrandProps {
  compact?: boolean
  className?: string
}

export function NorthboundBrand({ compact = false, className = '' }: NorthboundBrandProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/70">
        <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
          <defs>
            <linearGradient id="northbound-mark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--mint)" />
              <stop offset="35%" stopColor="var(--sky)" />
              <stop offset="70%" stopColor="var(--lavender)" />
              <stop offset="100%" stopColor="var(--pink)" />
            </linearGradient>
          </defs>
          <path d="M32 8L44 20H36V44H28V20H20L32 8Z" fill="url(#northbound-mark)" />
          <path d="M32 56L20 44H28V20H36V44H44L32 56Z" fill="url(#northbound-mark)" />
        </svg>
      </div>
      {!compact && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="aurora-text text-base font-semibold tracking-tight">Northbound</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Placement OS
          </span>
        </div>
      )}
    </Link>
  )
}
