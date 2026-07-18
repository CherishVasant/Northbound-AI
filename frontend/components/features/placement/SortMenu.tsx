'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import {
  SortField,
  SortDirection,
  SORT_FIELD_LABELS,
} from '@/lib/constants/placement';

interface SortMenuProps {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}

const SORT_FIELDS: SortField[] = [
  'serialNumber',
  'company',
  'applicationDeadline',
  'nextEventDateTime',
  'packageCTC',
  'priority',
];

export function SortMenu({ field, direction, onChange }: SortMenuProps) {
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

  const toggleDirection = () =>
    onChange(field, direction === 'asc' ? 'desc' : 'asc');

  const DirIcon = direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Sort field picker */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium pill-soft pill-soft-interactive hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronsUpDown className="w-3.5 h-3.5" />
        Sort: {SORT_FIELD_LABELS[field]}
      </button>

      {/* Direction toggle */}
      <button
        onClick={toggleDirection}
        className="flex items-center justify-center w-8 h-8 pill-soft pill-soft-interactive hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        title={direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        <DirIcon className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-popover overlay-soft w-48 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Sort by
          </p>
          {SORT_FIELDS.map((f) => (
            <button
              key={f}
              onClick={() => {
                onChange(f, f === field ? (direction === 'asc' ? 'desc' : 'asc') : 'asc');
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                f === field
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {f === field && <DirIcon className="w-3 h-3 shrink-0" />}
              {f !== field && <span className="w-3" />}
              {SORT_FIELD_LABELS[f]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
