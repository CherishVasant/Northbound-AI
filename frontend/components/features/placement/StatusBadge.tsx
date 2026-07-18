'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  StageStatus,
  STAGE_STATUSES,
  STAGE_STATUS_COLORS,
  FinalResult,
  FINAL_RESULTS,
  FINAL_RESULT_COLORS,
} from '@/lib/constants/placement';

// ─── Stage Status Badge ────────────────────────────────────────────────────

interface StageStatusBadgeProps {
  value: StageStatus;
  onChange: (val: StageStatus) => void;
}

export function StageStatusBadge({ value, onChange }: StageStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-80 ${STAGE_STATUS_COLORS[value]}`}
      >
        {value}
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover overlay-soft overflow-hidden min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
          {STAGE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold hover:bg-accent transition-colors ${s === value ? 'bg-accent/60' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Final Result Badge ────────────────────────────────────────────────────

interface FinalResultBadgeProps {
  value: FinalResult;
  onChange: (val: FinalResult) => void;
}

export function FinalResultBadge({ value, onChange }: FinalResultBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-80 ${FINAL_RESULT_COLORS[value]}`}
      >
        {value}
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover overlay-soft overflow-hidden min-w-[130px] animate-in fade-in slide-in-from-top-1 duration-150">
          {FINAL_RESULTS.map((r) => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold hover:bg-accent transition-colors ${r === value ? 'bg-accent/60' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
