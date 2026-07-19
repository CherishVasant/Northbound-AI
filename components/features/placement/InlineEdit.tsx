'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Inline field that commits on blur rather than per keystroke.
 *
 * Every commit goes through useLocalStorage, which persists AND schedules a
 * debounced backend sync, so writing per character would fire a storage write
 * and re-render the list on every letter. Enter commits, Escape reverts, and an
 * unmount cleanup catches the row being collapsed while the field still has
 * focus — otherwise that edit is silently lost.
 *
 * Text fields render as an auto-growing <textarea>, not an <input>: an input
 * can only scroll its content horizontally, so a long value is forced to an
 * ellipsis. A textarea wraps onto another line inside the same row instead.
 * Numbers stay an <input> — they never need to wrap, and type=number gives the
 * right mobile keyboard.
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
  /** Table-cell styling: no visible box until hovered or focused. */
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
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Grow to fit wrapped content. Layout effect so the row never paints at the
  // wrong height first.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // offsetHeight - clientHeight is the border height; scrollHeight omits it.
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
  }, [draft]);

  const commit = () => {
    if (draftRef.current === committedRef.current) return;
    committedRef.current = draftRef.current;
    onCommit(draftRef.current);
  };

  const revert = () => {
    setDraft(committedRef.current);
    draftRef.current = committedRef.current;
  };

  const boxed = bare
    ? 'rounded border border-transparent bg-transparent hover:border-border hover:bg-secondary/40 focus:border-border focus:bg-secondary/50'
    : 'pill-soft bg-secondary/40';

  const shared = `min-w-0 px-1 py-0.5 outline-none transition-colors ${boxed} ${
    mono ? 'font-mono' : ''
  } ${className}`;

  if (type === 'number') {
    return (
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
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
              revert();
              (e.target as HTMLInputElement).blur();
            }
          }}
          // Sized to the value and right-aligned so the unit sits beside the
          // digits rather than at the far edge of the cell.
          className={`w-14 shrink-0 text-right ${shared}`}
        />
        {suffix && (
          <span className="shrink-0 font-mono text-[10px] leading-none text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <textarea
      ref={areaRef}
      rows={1}
      value={draft}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        // Enter commits rather than inserting a newline: wrapping is automatic,
        // so a manual break in a company or role name is never wanted.
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          (e.target as HTMLTextAreaElement).blur();
        } else if (e.key === 'Escape') {
          revert();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      className={`w-full resize-none overflow-hidden break-words ${shared}`}
    />
  );
}
