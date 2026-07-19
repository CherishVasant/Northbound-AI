'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Text/number field that commits on blur rather than per keystroke.
 *
 * Every commit goes through useLocalStorage, which persists AND schedules a
 * debounced backend sync — so writing on each character would fire a storage
 * write and re-render the whole list per letter typed. Enter commits, Escape
 * reverts, and an unmount cleanup catches the case where the row is collapsed
 * while the field still has focus (otherwise that edit is silently lost).
 */
interface InlineEditProps {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  ariaLabel: string;
  type?: 'text' | 'number';
  mono?: boolean;
  /** Rendered after the value, e.g. "LPA". */
  suffix?: string;
  /**
   * Table-cell styling: no pill background until hovered/focused, so a row of
   * these reads as text rather than a wall of input boxes.
   */
  bare?: boolean;
  className?: string;
}

export function InlineEdit({
  value,
  onCommit,
  placeholder = '—',
  ariaLabel,
  type = 'text',
  mono = false,
  suffix,
  bare = false,
  className = '',
}: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  const committedRef = useRef(value);

  draftRef.current = draft;

  // Adopt external changes (e.g. a sync landing) without clobbering typing.
  useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (draftRef.current !== committedRef.current) onCommit(draftRef.current);
    };
  }, [onCommit]);

  const commit = () => {
    if (draftRef.current === committedRef.current) return;
    committedRef.current = draftRef.current;
    onCommit(draftRef.current);
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type={type}
        size={1}
        inputMode={type === 'number' ? 'decimal' : undefined}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 0.1 : undefined}
        value={draft}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setDraft(committedRef.current);
            draftRef.current = committedRef.current;
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={
          bare
            ? `${suffix ? 'w-14 flex-none text-right' : 'w-full flex-1'} min-w-0 truncate rounded border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors hover:border-border hover:bg-secondary/40 focus:border-border focus:bg-secondary/50 ${
                mono ? 'font-mono' : ''
              } ${className}`
            : `pill-soft min-w-0 flex-1 bg-secondary/40 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 ${
                mono ? 'font-mono' : ''
              } ${className}`
        }
      />
      {suffix && (
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}
