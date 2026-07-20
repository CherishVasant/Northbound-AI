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
  /**
   * Number fields only. Shown at rest INSTEAD of the raw value and suffix, so a
   * stipend can read "1.35L/mo" while still being edited as 135000. Focusing
   * swaps back to the raw number — reformatting under the cursor would fight
   * whoever is typing.
   */
  display?: string;
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
  display,
  bare = false,
  className = '',
}: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const draftRef = useRef(draft);
  const committedRef = useRef(value);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const numberRef = useRef<HTMLInputElement | null>(null);

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
    if (display && !focused) {
      return (
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => {
            setFocused(true);
            // The input only exists after this re-render.
            requestAnimationFrame(() => numberRef.current?.focus());
          }}
          className={`w-full text-left ${shared}`}
        >
          {display}
        </button>
      );
    }

    return (
      <div className="flex items-baseline gap-0.5">
        <input
          ref={numberRef}
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
          value={draft}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
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
          /*
           * Width tracks the digits actually typed, so the suffix sits beside
           * the number instead of at the far end of a fixed-width box — "0"
           * followed by 40px of nothing and then "LPA" read as two unrelated
           * things. `ch` is the width of a digit in the current font, and the
           * lower bound keeps an empty field clickable.
           */
          style={{ width: `${Math.max(2, draft.length + 0.5)}ch` }}
          className={`shrink-0 text-left ${shared}`}
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
