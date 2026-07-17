'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

interface EditableDropdownProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  onAddCustom?: (val: string) => void;
  /** Render as plain text, not a button-style cell */
  compact?: boolean;
}

export function EditableDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  allowCustom = false,
  onAddCustom,
  compact = false,
}: EditableDropdownProps) {
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

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const showAddOption =
    allowCustom &&
    search.trim() &&
    !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    onAddCustom?.(trimmed);
    onChange(trimmed);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1 w-full text-left transition-colors rounded ${
          compact
            ? 'text-xs text-foreground hover:text-primary'
            : 'px-2 py-1 text-xs hover:bg-accent rounded-md border border-transparent hover:border-border'
        }`}
      >
        <span className={`flex-1 truncate ${!value ? 'text-muted-foreground' : ''}`}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl w-48 max-h-56 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search */}
          <div className="p-1.5 border-b border-border shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-2 py-1 text-xs bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (showAddOption) handleAddCustom();
                  else if (filtered.length === 1) handleSelect(filtered[0]);
                }
                if (e.key === 'Escape') setOpen(false);
              }}
            />
          </div>

          {/* Options list */}
          <ul className="overflow-y-auto flex-1">
            {/* Clear option */}
            {value && (
              <li>
                <button
                  onClick={() => handleSelect('')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  <span className="italic">Clear</span>
                </button>
              </li>
            )}

            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors ${opt === value ? 'font-semibold text-primary' : 'text-foreground'}`}
                >
                  {opt === value && <Check className="w-3 h-3 shrink-0" />}
                  {opt !== value && <span className="w-3" />}
                  <span className="truncate">{opt}</span>
                </button>
              </li>
            ))}

            {/* Add custom option */}
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

            {filtered.length === 0 && !showAddOption && (
              <li className="px-3 py-2 text-xs text-muted-foreground">No options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
