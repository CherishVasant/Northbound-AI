import { LucideIcon } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { formatPercentage } from '@/lib/utils';

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  value: number;
  total: number;
  accentColor: string;
  accentBg: string;
  description?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  icon: Icon,
  value,
  total,
  accentColor,
  accentBg,
  description,
  onClick,
}: StatCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden card-soft card-soft-interactive bg-card p-6 cursor-pointer"
    >
      {/* Background accent */}
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${accentBg} opacity-10 transition-transform group-hover:scale-150`} />

      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`rounded-lg p-2.5 ${accentBg}`}>
            <Icon className="h-5 w-5" style={{ color: `var(${accentColor})` }} />
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold" style={{ color: `var(${accentColor})` }}>
              {value}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {formatPercentage(percentage)}% ({value}/{total})
            </span>
          </div>
          <ProgressBar value={percentage} accentColor={accentColor} showPercentage={false} />
        </div>
      </div>
    </div>
  );
}
