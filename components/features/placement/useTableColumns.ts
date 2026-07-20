'use client';

import { useCallback, useRef, useState } from 'react';

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
   * Widest width the column's content can actually use. Growth stops here and
   * the space goes to a column that can still use it.
   */
  max?: number;
  /**
   * 0 = structural, never dropped. Higher numbers are dropped sooner, so this
   * is the reverse of importance: 1 is the first thing added back.
   */
  priority: number;
  /** Relative rate of growth between min and max. */
  flex: number;
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
 *
 * `max` is what stops the row from spreading itself thin. Without it, every
 * column carrying `flex` swallowed an equal share of ALL the leftover space
 * while every column without it stayed pinned at its minimum forever — so on a
 * wide screen Company sat at 292px holding the word "UBS" and Deadline stayed
 * at 100px trying to render "26 Jul, 5:00 PM". Growth now stops at the width
 * the content can actually use, and what remains goes to a column that can
 * still use it.
 *
 * Every column has a max, including Notes — leaving one uncapped absorber made
 * it 709px on a wide screen, which is the same "short text marooned in a huge
 * cell" problem one column over. When the container is wider than every column
 * can use, the TABLE stops growing (see `maxWidth`) rather than stretching
 * columns past the point where extra width helps.
 */
export const COLUMN_SPECS: ColumnSpec[] = [
  { id: 'expand', label: '', min: 36, max: 40, priority: 0, flex: 0 },
  { id: 'serial', label: '#', min: 44, max: 54, priority: 0, flex: 0.2 },
  { id: 'company', label: 'Company', min: 100, max: 140, priority: 0, flex: 1 },
  { id: 'role', label: 'Role', min: 90, max: 130, priority: 0, flex: 1 },
  { id: 'package', label: 'Package', min: 80, max: 110, priority: 4, flex: 0.5 },
  { id: 'status', label: 'Status', min: 130, max: 200, priority: 0, flex: 1.5 },
  { id: 'notes', label: 'Notes', min: 120, max: 320, priority: 2, flex: 2.5 },
  { id: 'skills', label: 'Skills Required', min: 110, max: 240, priority: 3, flex: 1.5 },
  { id: 'deadline', label: 'Deadline', min: 120, max: 170, priority: 1, flex: 1.2 },
  { id: 'optedIn', label: 'Opted In', min: 70, max: 90, priority: 5, flex: 0.3 },
  { id: 'select', label: '', min: 30, max: 34, priority: 0, flex: 0 },
];

/** Below this the Status cell stacks its two dropdowns instead of sitting them side by side. */
export const STATUS_STACK_BELOW = 175;

export interface ColumnPlan {
  /** Attach to the element whose width the columns should fit. */
  ref: (node: HTMLElement | null) => void;
  columns: ColumnSpec[];
  /** Percentage width per visible column, index-aligned with `columns`. */
  widths: string[];
  /** Resolved px width of the Status column, so the cell can pick its layout. */
  statusWidth: number;
  /**
   * Widest the table should ever draw itself: the sum of every visible column's
   * ceiling. Past this the container has more room than the content can use, so
   * the table stops rather than stretching columns into whitespace.
   */
  maxWidth: number;
  /** False until the first measurement lands. */
  measured: boolean;
}

/**
 * The width at which every column has stopped growing.
 *
 * A zero-flex column never leaves its min, so summing `max` across the board
 * overshoots by however much those columns were nominally allowed — and the
 * table would then stretch a few pixels past what the layout can actually
 * reach, scaling every column just over its ceiling.
 */
function saturatedWidth(columns: ColumnSpec[]): number {
  const rawSum = columns.reduce((sum, c) => sum + (c.flex > 0 ? (c.max ?? c.min) : c.min), 0);
  return Math.min(rawSum, 1500);
}

function plan(width: number, selectionMode: boolean): Omit<ColumnPlan, 'ref'> {
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
  const px = columns.map((c) => c.min);

  /**
   * Water-filling: hand out the leftover space in proportion to flex, but stop
   * each column at its max and redistribute what it couldn't take. A single
   * proportional pass would park space in columns that have no use for it while
   * a starved column two positions over still needs it.
   *
   * Bounded iterations because each pass either caps at least one column or
   * exhausts the remainder; the loop guard is belt-and-braces, not a real bound.
   */
  let remaining = Math.max(0, width - used);
  for (let pass = 0; pass < columns.length + 1 && remaining > 0.5; pass++) {
    const growable = columns
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => c.flex > 0 && px[i] < (c.max ?? Infinity) - 0.01);
    if (growable.length === 0) break;

    const totalFlex = growable.reduce((sum, { c }) => sum + c.flex, 0);
    const before = remaining;
    for (const { c, i } of growable) {
      const share = (before * c.flex) / totalFlex;
      const room = (c.max ?? Infinity) - px[i];
      const give = Math.min(share, room);
      px[i] += give;
      remaining -= give;
    }
    // Everything hit its ceiling this pass; nothing left to hand the rest to.
    if (before - remaining < 0.01) break;
  }

  const total = px.reduce((a, b) => a + b, 0) || 1;

  return {
    columns,
    // Percentages, not pixels: they always sum to 100% of whatever the table
    // actually gets, so the layout cannot overflow even mid-resize — and on a
    // screen too narrow even for the structural columns, they share the space
    // proportionally and squeeze below their min rather than spilling sideways.
    widths: px.map((w) => `${((w / total) * 100).toFixed(4)}%`),
    statusWidth: px[columns.findIndex((c) => c.id === 'status')] ?? 0,
    maxWidth: saturatedWidth(columns),
    measured: true,
  };
}

export function useTableColumns(selectionMode: boolean): ColumnPlan {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  /**
   * A CALLBACK ref, not useLayoutEffect over a RefObject.
   *
   * The effect version ran once on mount and never again, because a ref object
   * is stable and can't be a dependency that changes. On the first render the
   * company list is still empty (localStorage hasn't been read yet), so the
   * table renders its empty state and the measured element does not exist —
   * the effect found `ref.current === null`, returned early, and no observer
   * was ever attached. Width stayed 0 for the lifetime of the page, which is
   * the pre-measurement fallback: structural columns only, on any screen.
   *
   * A callback ref fires whenever the node itself appears or disappears, so it
   * attaches at the moment the real table replaces the empty state.
   */
  const measuredRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    // Measure immediately so the first paint with data is already correct.
    setWidth(Math.min(node.clientWidth, 1500));

    const observer = new ResizeObserver((entries) => {
      const next = Math.min(entries[0]?.contentRect.width ?? 0, 1500);
      // Sub-pixel churn during the AI panel's slide transition would otherwise
      // re-plan on every animation frame.
      setWidth((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  if (width === 0) {
    // Pre-measurement: structural columns only. Rendering the full set and
    // pulling columns away a frame later is a visible flicker; this way the
    // table only ever grows into place.
    const columns = COLUMN_SPECS.filter(
      (c) => c.priority === 0 && (c.id !== 'select' || selectionMode),
    );
    const each = `${(100 / columns.length).toFixed(4)}%`;
    return {
      ref: measuredRef,
      columns,
      widths: columns.map(() => each),
      statusWidth: 0,
      maxWidth: Math.min(saturatedWidth(columns), 1500),
      measured: false,
    };
  }

  return { ref: measuredRef, ...plan(Math.min(width, 1500), selectionMode) };
}
