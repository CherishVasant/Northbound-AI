'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface MultiSelectChipProps {
  selected: string[];
  options: string[];
  onChange: (vals: string[]) => void;
  allowCustom?: boolean;
  onAddCustom?: (val: string) => void;
  placeholder?: string;
}

export function MultiSelectChip({
  selected,
  options,
  onChange,
  allowCustom = false,
  onAddCustom,
  placeholder = 'Add skill…',
}: MultiSelectChipProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const remaining = options.filter(
    (o) => !selected.includes(o) && o.toLowerCase().includes(search.toLowerCase())
  );

  const showAddOption =
    allowCustom &&
    search.trim() &&
    !options.some((o) => o.toLowerCase() === search.trim().toLowerCase()) &&
    !selected.some((s) => s.toLowerCase() === search.trim().toLowerCase());

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const remove = (val: string) => {
    onChange(selected.filter((s) => s !== val));
  };

  const handleAddCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    onAddCustom?.(trimmed);
    onChange([...selected, trimmed]);
    setSearch('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex flex-wrap gap-1 items-center min-w-[120px]">
      {/* Existing chips */}
      {selected.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary pill-soft text-[10px] font-semibold"
        >
          {s}
          <button
            onClick={() => remove(s)}
            className="ml-0.5 hover:text-destructive transition-colors"
            title={`Remove ${s}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}

      {/* Add button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 border border-dashed border-border rounded text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        title={placeholder}
      >
        <Plus className="w-2.5 h-2.5" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover overlay-soft overflow-hidden w-52 max-h-60 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search */}
          <div className="p-1.5 border-b border-border shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills…"
              className="w-full px-2 py-1 text-xs bg-background pill-soft focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (showAddOption) handleAddCustom();
                  else if (remaining.length === 1) { toggle(remaining[0]); setSearch(''); }
                }
                if (e.key === 'Escape') setOpen(false);
              }}
            />
          </div>

          <ul className="overflow-y-auto flex-1">
            {/* Already selected (with check) */}
            {selected
              .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
              .map((s) => (
                <li key={s}>
                  <button
                    onClick={() => toggle(s)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent transition-colors"
                  >
                    <Check className="w-3 h-3 shrink-0" />
                    {s}
                  </button>
                </li>
              ))}

            {/* Remaining options */}
            {remaining.map((o) => (
              <li key={o}>
                <button
                  onClick={() => { toggle(o); setSearch(''); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                >
                  <span className="w-3" />
                  {o}
                </button>
              </li>
            ))}

            {/* Add custom */}
            {showAddOption && (
              <li>
                <button
                  onClick={handleAddCustom}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  Add "{search.trim()}"
                </button>
              </li>
            )}

            {remaining.length === 0 && selected.length === 0 && !showAddOption && (
              <li className="px-3 py-2 text-xs text-muted-foreground">No options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
