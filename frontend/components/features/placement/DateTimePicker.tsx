'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

// ─── Countdown helper ────────────────────────────────────────────────────────

function getCountdown(isoString: string): { label: string; colorClass: string } {
  const target = new Date(isoString);
  const now = new Date();
  // Normalise to start-of-day for day-level comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = targetStart.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const datePart = target.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (diffDays < 0) {
    return {
      label: `${datePart} • ${Math.abs(diffDays)}d ago`,
      colorClass: 'text-destructive bg-destructive/10 border-destructive/20',
    };
  }
  if (diffDays === 0) {
    return {
      label: `Today • Due today`,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    };
  }
  if (diffDays <= 2) {
    return {
      label: `${datePart} • ${diffDays}d left`,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    };
  }
  return {
    label: `${datePart} • ${diffDays}d left`,
    colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
}

export function DateTimePicker({ value, onChange, placeholder = 'Set date…' }: DateTimePickerProps) {
  const [editing, setEditing] = useState(false);

  // Convert ISO to datetime-local input format (YYYY-MM-DDTHH:mm)
  const toInputValue = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw ? new Date(raw).toISOString() : null);
  };

  const countdown = value ? getCountdown(value) : null;

  if (editing) {
    return (
      <input
        type="datetime-local"
        defaultValue={toInputValue(value)}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        autoFocus
        className="w-full text-xs bg-background border border-primary rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex flex-col items-start gap-0.5 w-full text-left group"
      title="Click to edit date"
    >
      {countdown ? (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold leading-tight ${countdown.colorClass}`}
        >
          <Calendar className="w-2.5 h-2.5 shrink-0" />
          {countdown.label}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {placeholder}
        </span>
      )}
    </button>
  );
}
