'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ColorOption<T extends string> {
  value: T;
  label: string;
  /** CSS colour for the label, e.g. `var(--state-done)`. */
  color: string;
  /** Optional background-image, used for the Rejected gradient. */
  gradient?: string;
}

interface ColorSelectProps<T extends string> {
  value: T;
  options: ColorOption<T>[];
  onChange: (next: T) => void;
  ariaLabel: string;
  className?: string;
  /** Styles for the closed trigger. */
  triggerStyle?: React.CSSProperties;
}

/**
 * A dropdown that actually renders its options in colour.
 *
 * A native <select> cannot do this: browsers hand the open option list to the
 * operating system, and Windows ignores per-option colour entirely — so the
 * closed control was tinted while the list that opened from it was plain black
 * text. This renders the list itself, so each option carries its stage or state
 * colour (and Rejected can carry the gradient).
 *
 * The list is portalled to <body> and positioned from the trigger's rect: the
 * table scrolls horizontally, and an absolutely-positioned list would be
 * clipped by that container.
 */
export function ColorSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  triggerStyle,
}: ColorSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estimated = Math.min(options.length, 7) * 30 + 8;
    // Flip above when there isn't room below.
    const below = window.innerHeight - r.bottom;
    const top = below < estimated && r.top > estimated ? r.top - estimated - 4 : r.bottom + 4;
    setRect({ top, left: r.left, width: Math.max(r.width, 150) });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    // Reposition would drift with the row, so just close on scroll/resize.
    const onDismiss = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onDismiss);
    window.addEventListener('scroll', onDismiss, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onDismiss);
      window.removeEventListener('scroll', onDismiss, true);
    };
  }, [open]);

  const choose = (next: T) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[active].value);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        onKeyDown={onKeyDown}
        className={`pill-soft flex cursor-pointer items-center gap-1 px-2 py-1 text-[11px] font-semibold leading-none focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
        style={triggerStyle}
      >
        <span className="truncate">{selected?.label}</span>
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" aria-hidden>
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open &&
        rect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            className="overlay-soft fixed z-[60] overflow-hidden bg-popover py-1"
            style={{ top: rect.top, left: rect.left, minWidth: rect.width }}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] font-semibold transition-colors ${
                    i === active ? 'bg-secondary/70' : ''
                  }`}
                  style={{ color: o.gradient ? 'var(--foreground)' : o.color }}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={
                      o.gradient
                        ? { backgroundImage: o.gradient }
                        : { backgroundColor: o.color }
                    }
                  />
                  <span className="truncate">{o.label}</span>
                  {isSelected && <span className="ml-auto text-[10px] opacity-70">✓</span>}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
