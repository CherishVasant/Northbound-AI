import { LucideIcon } from 'lucide-react'
import { ProgressBar } from './ProgressBar'

interface PageHeaderProps {
  title: string
  icon?: LucideIcon
  description?: string
  progressValue?: number
  progressLabel?: string
  accentColor?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  icon: Icon,
  description,
  progressValue,
  progressLabel,
  accentColor = '--color-primary',
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-gradient-to-r from-card to-card/50 p-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-4">
          {Icon && (
            <div className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `var(${accentColor}20)` }}>
              <Icon className="h-6 w-6" style={{ color: `var(${accentColor})` }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        {progressValue !== undefined && (
          <div className="max-w-xs">
            <ProgressBar value={progressValue} label={progressLabel} size="lg" accentColor={accentColor} />
          </div>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0 self-start mt-2 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  )
}
