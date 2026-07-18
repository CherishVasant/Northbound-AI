'use client';

import { useMemo } from 'react';
import type { PlacementCompany } from '@/lib/utils/storage';

/** Last history entry is the current status — see StageEntry. */
function latest(c: PlacementCompany) {
  const h = c.history ?? [];
  return h.length ? h[h.length - 1] : null;
}

function hasOffer(c: PlacementCompany) {
  return (c.history ?? []).some((h) => h.stage === 'Offer' && h.status === 'Done');
}

export function PlacementStatsStrip({ companies }: { companies: PlacementCompany[] }) {
  const stats = useMemo(() => {
    // Every stat except Total counts opted-in companies only.
    const opted = companies.filter((c) => c.optedIn);

    return [
      { label: 'Total', value: companies.length, color: '--text-dim' },
      {
        label: 'Active',
        value: opted.filter((c) => {
          const l = latest(c);
          if (!l) return true;
          return l.status !== 'Rejected' && !(l.stage === 'Offer' && l.status === 'Done');
        }).length,
        color: '--state-done',
      },
      {
        label: 'Waiting',
        value: opted.filter((c) => latest(c)?.status === 'Waiting').length,
        color: '--state-waiting',
      },
      {
        label: 'Interviews',
        value: opted.filter((c) =>
          (c.history ?? []).some((h) => h.stage.includes('Interview') || h.stage.includes('Discussion')),
        ).length,
        color: '--stage-tech',
      },
      {
        label: 'Offers',
        value: opted.filter(hasOffer).length,
        color: '--state-offer',
      },
      {
        label: 'Rejected',
        value: opted.filter((c) => latest(c)?.status === 'Rejected').length,
        color: '--state-rejected',
      },
    ];
  }, [companies]);

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="pill-soft flex items-center gap-2 bg-card px-3 py-1.5"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: `var(${s.color})` }}
          />
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
          <span className="font-mono text-xs font-bold text-foreground">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
