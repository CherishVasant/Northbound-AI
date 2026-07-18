'use client';

import { useEffect, useRef, useState } from 'react';

interface DeadlineCellProps {
  optedIn: boolean;
  deadlineDate: string;
  deadlineTime: string;
  reason: string;
  onChange: (deadlineDate: string, deadlineTime: string) => void;
}

/** '2026-07-26' + '17:00' → '26 Jul, 5:00 PM' */
export function formatDeadline(date: string, time: string) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  const datePart = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (!time) return datePart;

  const [hh, mm] = time.split(':').map(Number);
  if (Number.isNaN(hh)) return datePart;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${datePart}, ${h12}:${String(mm ?? 0).padStart(2, '0')} ${suffix}`;
}

/**
 * Deadline and reason-for-not-opting-in are mutually exclusive and share this
 * one cell: opted-in rows get an editable date+time, opted-out rows get the
 * reason in muted italics.
 */
export function DeadlineCell({
  optedIn,
  deadlineDate,
  deadlineTime,
  reason,
  onChange,
}: DeadlineCellProps) {
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape so the row doesn't stay stuck in edit mode.
  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setEditing(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [editing]);

  if (!optedIn) {
    return (
      <span className="text-xs italic text-muted-foreground">
        {reason?.trim() ? reason : '—'}
      </span>
    );
  }

  if (editing) {
    return (
      <div ref={wrapRef} className="flex items-center gap-1.5">
        <input
          type="date"
          autoFocus
          value={deadlineDate}
          onChange={(e) => onChange(e.target.value, deadlineTime)}
          className="pill-soft bg-secondary/40 px-1.5 py-1 text-[11px] font-mono text-foreground"
        />
        <input
          type="time"
          value={deadlineTime}
          onChange={(e) => onChange(deadlineDate, e.target.value)}
          className="pill-soft bg-secondary/40 px-1.5 py-1 text-[11px] font-mono text-foreground"
        />
      </div>
    );
  }

  const label = formatDeadline(deadlineDate, deadlineTime);

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit deadline"
      className="rounded px-1 py-0.5 text-xs font-mono text-foreground hover:bg-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
    >
      {label || <span className="text-muted-foreground">—</span>}
    </button>
  );
}
