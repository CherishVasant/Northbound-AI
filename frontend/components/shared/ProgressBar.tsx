import { formatPercentage } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  accentColor?: string
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  size = 'md',
  accentColor = '--color-primary',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value))
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[size]

  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size]

  return (
    <div className="space-y-1">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <label className={`${textSizeClass} font-medium text-foreground`}>{label}</label>}
          {showPercentage && <span className={`${textSizeClass} text-muted-foreground`}>{formatPercentage(percentage)}%</span>}
        </div>
      )}
      <div className={`${heightClass} bg-muted rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: `var(${accentColor})` }}
        />
      </div>
    </div>
  )
}
