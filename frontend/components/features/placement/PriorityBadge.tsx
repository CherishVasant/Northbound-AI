'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Priority, PRIORITIES, PRIORITY_COLORS, PRIORITY_DOT } from '@/lib/constants/placement';

interface PriorityBadgeProps {
  value: Priority;
  onChange: (val: Priority) => void;
}

export function PriorityBadge({ value, onChange }: PriorityBadgeProps) {
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
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-80 ${PRIORITY_COLORS[value]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[value]}`} />
        {value}
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden min-w-[100px] animate-in fade-in slide-in-from-top-1 duration-150">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold hover:bg-accent transition-colors ${p === value ? 'bg-accent/60' : ''}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[p]}`} />
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
