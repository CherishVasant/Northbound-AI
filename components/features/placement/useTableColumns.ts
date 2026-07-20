'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Which columns fit, decided from the table's MEASURED width rather than from
 * viewport media queries.
 *
 * Media queries were the wrong instrument here: the table doesn't live at the
 * viewport's width. Opening the AI panel takes 420px away from it while every
 * `min-width` breakpoint keeps reporting the old, larger screen, so columns
 * stayed visible in a container that could no longer hold them and the row
 * spilled sideways. Measuring the container removes the whole class of bug —
 * the panel needs no special case, and neither would a sidebar, a zoom level,
 * or a split window.
 */

export interface ColumnSpec {
  id: string;
  label: string;
  /** Narrowest width at which the column is still readable. */
  min: number;
  /**
   * 0 = structural, never dropped. Higher numbers are dropped sooner, so this
   * is the reverse of importance: 1 is the first thing added back.
   */
  priority: number;
  /** Share of leftover space. Omit for columns that gain nothing from extra width. */
  flex?: number;
}

/**
 * Order in this array is DISPLAY order; `priority` is the independent order in
 * which columns come back as the table widens:
 *
 *   always            company, role, status  (plus the chevron and row number)
 *   1. a bit wider    Deadline
 *   2. wider          Notes
 *   3. wider          Skills
 *   4. widest         Package
 *   5. widest         Opted In
 *
 * Structural columns are never dropped. The row number counts as structural
 * rather than as information: at 34px it costs almost nothing, and a row you
 * can't cite by number is harder to talk about. Everything genuinely absent
 * from the row is reachable in the expanded panel, which holds every field.
 */
export const COLUMN_SPECS: ColumnSpec[] = [
  { id: 'expand', label: '', min: 28, priority: 0 },
  { id: 'serial', label: '#', min: 34, priority: 0 },
  { id: 'company', label: 'Company', min: 96, priority: 0, flex: 1 },
  { id: 'role', label: 'Role', min: 84, priority: 0, flex: 1 },
  { id: 'package', label: 'Package', min: 74, priority: 4 },
  { id: 'status', label: 'Status', min: 124, priority: 0, flex: 1.6 },
  { id: 'notes', label: 'Notes', min: 128, priority: 2, flex: 2.2 },
  { id: 'skills', label: 'Skills Required', min: 112, priority: 3, flex: 1.4 },
  { id: 'deadline', label: 'Deadline', min: 100, priority: 1 },
  { id: 'optedIn', label: 'Opted In', min: 64, priority: 5 },
  { id: 'select', label: '', min: 30, priority: 0 },
];

/** Below this the Status cell stacks its two dropdowns instead of sitting them side by side. */
export const STATUS_STACK_BELOW = 175;

export interface ColumnPlan {
  columns: ColumnSpec[];
  /** Percentage width per visible column, index-aligned with `columns`. */
  widths: string[];
  /** Resolved px width of the Status column, so the cell can pick its layout. */
  statusWidth: number;
  /** False until the first measurement lands. */
  measured: boolean;
}

function plan(width: number, selectionMode: boolean): ColumnPlan {
  const available = COLUMN_SPECS.filter((c) => c.id !== 'select' || selectionMode);
  const required = available.filter((c) => c.priority === 0);
  const optional = available
    .filter((c) => c.priority > 0)
    .sort((a, b) => a.priority - b.priority);

  const chosen = new Set(required.map((c) => c.id));
  let used = required.reduce((sum, c) => sum + c.min, 0);

  /**
   * Take a PREFIX of the priority order and stop at the first column that
   * doesn't fit — deliberately not a greedy "skip it and try the next one".
   *
   * Greedy packs the row slightly tighter but isn't monotonic in width: at one
   * size Package fits where Serial doesn't, and a few pixels later they swap.
   * Dragging the window then makes columns trade places instead of simply
   * appearing, which reads as the table rearranging itself at random. A prefix
   * can only ever grow as the table gets wider, so widening always adds and
   * narrowing always removes.
   */
  for (const col of optional) {
    if (used + col.min > width) break;
    chosen.add(col.id);
    used += col.min;
  }

  const columns = available.filter((c) => chosen.has(c.id));
  const slack = Math.max(0, width - used);
  const totalFlex = columns.reduce((sum, c) => sum + (c.flex ?? 0), 0);

  const px = columns.map(
    (c) => c.min + (totalFlex > 0 ? (slack * (c.flex ?? 0)) / totalFlex : 0),
  );
  const total = px.reduce((a, b) => a + b, 0) || 1;

  return {
    columns,
    // Percentages, not pixels: they always sum to 100% of whatever the table
    // actually gets, so the layout cannot overflow even mid-resize — and on a
    // screen too narrow even for the structural columns, they share the space
    // proportionally and squeeze below their min rather than spilling sideways.
    widths: px.map((w) => `${((w / total) * 100).toFixed(4)}%`),
    statusWidth: px[columns.findIndex((c) => c.id === 'status')] ?? 0,
    measured: true,
  };
}

export function useTableColumns(
  ref: RefObject<HTMLElement | null>,
  selectionMode: boolean,
): ColumnPlan {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measure synchronously on mount so the first paint is already correct;
    // waiting for the observer's first callback shows a wrong layout for a frame.
    setWidth(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      // Sub-pixel churn during the panel's slide transition would otherwise
      // re-plan on every animation frame.
      setWidth((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  if (width === 0) {
    // Pre-measurement: structural columns only. Rendering the full set and
    // pulling columns away a frame later is a visible flicker; this way the
    // table only ever grows into place.
    const columns = COLUMN_SPECS.filter(
      (c) => c.priority === 0 && (c.id !== 'select' || selectionMode),
    );
    const each = `${(100 / columns.length).toFixed(4)}%`;
    return {
      columns,
      widths: columns.map(() => each),
      statusWidth: 0,
      measured: false,
    };
  }

  return plan(width, selectionMode);
}
