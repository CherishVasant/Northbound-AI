import { formatPercentage } from '@/lib/utils'

interface ReadinessGaugeProps {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ReadinessGauge({
  score,
  label = 'Readiness',
  size = 'md',
}: ReadinessGaugeProps) {
  const percentage = Math.min(100, Math.max(0, score))
  const circumference = 2 * Math.PI * 45

  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const radius = size === 'sm' ? 30 : size === 'lg' ? 60 : 45

  const getColor = () => 'url(#auroraGradient)'

  const getLabel = (percent: number) => {
    if (percent >= 90) return 'Excellent'
    if (percent >= 75) return 'Very Good'
    if (percent >= 60) return 'Good'
    if (percent >= 45) return 'Fair'
    return 'Needs Work'
  }

  const sizeClass =
    size === 'sm' ? 'w-24 h-24' : size === 'lg' ? 'w-48 h-48' : 'w-40 h-40'
  const textSizeClass =
    size === 'sm' ? 'text-lg font-bold' : size === 'lg' ? 'text-3xl font-bold' : 'text-2xl font-bold'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${sizeClass}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--mint)" />
              <stop offset="35%" stopColor="var(--sky)" />
              <stop offset="70%" stopColor="var(--lavender)" />
              <stop offset="100%" stopColor="var(--pink)" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="var(--color-muted)" strokeWidth="4" />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSizeClass} text-foreground`}>{formatPercentage(percentage)}%</span>
          <span className="text-xs text-muted-foreground">{getLabel(percentage)}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-center text-foreground">{label}</p>
    </div>
  )
}
