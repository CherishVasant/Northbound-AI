'use client';

import { useMemo } from 'react';
import { PlacementCompany } from '@/lib/utils/storage';
import { Building2, Clock, Trophy, XCircle, CalendarClock, Users } from 'lucide-react';

interface PlacementSummaryStripProps {
  companies: PlacementCompany[];
}

const INTERVIEW_STAGES = new Set([
  'Aptitude Test',
  'Culture Test',
  'Online Assessment',
  'Group Discussion',
  'Hackathon',
  'Technical Interview',
  'HR Interview',
]);

export function PlacementSummaryStrip({ companies }: PlacementSummaryStripProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();

    let active = 0, waiting = 0, interviews = 0, offers = 0, rejected = 0, deadlinesToday = 0;

    for (const c of companies) {
      if (c.archived) continue;

      if (c.finalResult === 'Pending') active++;
      if (c.currentStage === 'Waiting for Shortlist') waiting++;
      if (INTERVIEW_STAGES.has(c.currentStage)) interviews++;
      if (c.currentStage === 'Offer' || c.finalResult === 'Selected') offers++;
      if (c.finalResult === 'Rejected') rejected++;
      if (c.applicationDeadline) {
        const d = new Date(c.applicationDeadline);
        if (!isNaN(d.getTime()) && d.toDateString() === todayStr) deadlinesToday++;
      }
    }

    return { total: companies.filter((c) => !c.archived).length, active, waiting, interviews, offers, rejected, deadlinesToday };
  }, [companies]);

  const items = [
    {
      label: 'Total',
      value: stats.total,
      icon: Building2,
      color: 'text-foreground',
      bg: 'bg-muted/50',
      border: 'border-border',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900/40',
    },
    {
      label: 'Waiting',
      value: stats.waiting,
      icon: Clock,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      border: 'border-violet-200 dark:border-violet-900/40',
    },
    {
      label: 'Interviews',
      value: stats.interviews,
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900/40',
    },
    {
      label: 'Offers',
      value: stats.offers,
      icon: Trophy,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/40',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/40',
    },
    {
      label: 'Due Today',
      value: stats.deadlinesToday,
      icon: CalendarClock,
      color: stats.deadlinesToday > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground',
      bg: stats.deadlinesToday > 0 ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-muted/50',
      border: stats.deadlinesToday > 0 ? 'border-orange-200 dark:border-orange-900/40' : 'border-border',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-border bg-background/50">
      {items.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bg} ${border} transition-colors`}
        >
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className={`text-lg font-bold leading-none ${color}`}>{value}</span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
