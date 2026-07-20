'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import type { PipelineStage, PipelineState } from '@/lib/constants/placement';
import { packageSuffix, formatPackage } from '@/lib/constants/placement';
import { currentRoundIndex } from '@/lib/utils/placementMigration';
import { ToggleSwitch } from './ToggleSwitch';
import { StatusSelects } from './StatusSelects';
import { DeadlineCell } from './DeadlineCell';
import { CompanyDetailPanel } from './CompanyDetailPanel';
import { InlineEdit } from './InlineEdit';

interface NotesCellProps {
  value: string;
  onChange: (v: string) => void;
}

/** Two lines of text plus padding — the resting height of an empty note. */
const NOTES_MIN_HEIGHT = 46;

function NotesCell({ value, onChange }: NotesCellProps) {
  const [draft, setDraft] = useState(value);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  /**
   * Layout effect, not a plain effect: measuring in a passive effect meant the
   * box painted once at its collapsed height before being corrected, which is
   * why it opened looking like a sliver and only "found" its size after a
   * keystroke forced a second pass.
   *
   * `auto` (not `0px`) before reading scrollHeight is what lets it SHRINK.
   * scrollHeight never reports less than the element's current height, so
   * clearing the field while the box was still tall measured the tall box and
   * it stayed tall.
   */
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, NOTES_MIN_HEIGHT)}px`;
  }, [draft]);

  const commit = () => {
    if (draft !== value) {
      onChange(draft);
    }
  };

  return (
    <textarea
      ref={areaRef}
      rows={2}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          commit();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      placeholder="Notes for this round…"
      style={{ minHeight: NOTES_MIN_HEIGHT }}
      // Placeholder is a watermark, not content: it should be legible enough to
      // tell you the cell is editable and faint enough that a row of empty
      // notes doesn't read as a column full of text.
      className="w-full resize-none overflow-hidden rounded border border-transparent bg-secondary/20 px-2 py-1 text-xs leading-relaxed text-foreground outline-none transition-colors placeholder:italic placeholder:text-muted-foreground/25 hover:bg-secondary/40 focus:border-border focus:bg-secondary/50"
    />
  );
}

interface SkillsCellProps {
  value: string[];
  onChange: (next: string[]) => void;
}

function SkillsCell({ value, onChange }: SkillsCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.join(', '));
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value.join(', '));
  }, [value]);

  useEffect(() => {
    if (!editing) return;
    const el = areaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, editing]);

  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        commit();
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [editing, draft, value]);

  const commit = () => {
    if (draft !== value.join(', ')) {
      const next = draft
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      onChange(next);
    }
  };

  if (editing) {
    return (
      <div ref={containerRef} className="w-full">
        <textarea
          ref={areaRef}
          rows={1}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commit();
              setEditing(false);
            } else if (e.key === 'Escape') {
              setDraft(value.join(', '));
              setEditing(false);
            }
          }}
          placeholder="e.g. Python, SQL..."
          className="w-full min-h-[28px] resize-none overflow-hidden bg-secondary/20 hover:bg-secondary/40 focus:bg-secondary/50 rounded px-2 py-1 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/30 border border-transparent focus:border-border"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left flex flex-wrap gap-1 min-h-[28px] p-1 rounded hover:bg-secondary/40 transition-colors"
      title="Click to edit skills"
    >
      {value.length > 0 ? (
        value.map((s) => (
          <span
            key={s}
            className="inline-block rounded-full bg-primary/10 border border-primary/20 px-1.5 py-px text-[9px] font-medium text-primary"
          >
            {s}
          </span>
        ))
      ) : (
        <span className="text-xs text-muted-foreground/30 px-1">—</span>
      )}
    </button>
  );
}

interface PlacementRowProps {
  company: PlacementCompany;
  /** Position in the FULL list, so numbering survives filtering. */
  serial: number;
  dragging: boolean;
  /** Grip handle: mouse drags at once, touch long-presses. */
  onHandlePointerDown: (e: React.PointerEvent) => void;
  /** Anywhere on the row: touch long-press to pick it up. */
  onRowPointerDown: (e: React.PointerEvent) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (stage: PipelineStage, state: PipelineState) => void;
  onDeadlineChange: (date: string, time: string) => void;
  onOptedInChange: (optedIn: boolean) => void;
  onFieldChange: (patch: Partial<PlacementCompany>) => void;
  onDeleteHistoryEntry: (index: number) => void;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  selectionMode?: boolean;
  /** Column ids the table decided it can fit, in display order. */
  visibleIds: string[];
  /** Status column is too narrow for two dropdowns side by side. */
  stackStatus: boolean;
}

export function PlacementRow({
  company,
  serial,
  dragging,
  onHandlePointerDown,
  onRowPointerDown,
  expanded,
  onToggleExpand,
  onStatusChange,
  onDeadlineChange,
  onOptedInChange,
  onFieldChange,
  onDeleteHistoryEntry,
  selected,
  onSelectedChange,
  selectionMode = false,
  visibleIds,
  stackStatus,
}: PlacementRowProps) {
  const nowIndex = currentRoundIndex(company.history);

  // Expanded rows keep the hover background so the pair reads as one unit.
  const rowBg = expanded ? 'bg-secondary/50' : 'hover:bg-secondary/50';

  /**
   * Keyed by column id and rendered in the order the table planned, so a cell
   * can never land under the wrong header. Widths come from the table's
   * <colgroup> — cells carry padding only.
   */
  const cells: Record<string, { cls: string; content: React.ReactNode }> = {
    expand: {
      cls: 'py-2.5 pl-3 pr-2 align-middle sm:pl-4',
      content: (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
        </button>
      ),
    },

    serial: {
      cls: 'py-2.5 pl-2 pr-2 align-middle',
      content: (
        <div className="flex items-center gap-1">
          <span
            onPointerDown={onHandlePointerDown}
            role="button"
            tabIndex={-1}
            aria-label="Drag to reorder"
            title="Drag to reorder (on a phone, press and hold the row)"
            // touch-none stops the browser scrolling instead of dragging.
            className="cursor-grab touch-none text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{serial}</span>
        </div>
      ),
    },

    company: {
      cls: 'py-2.5 pl-4 pr-1 align-middle',
      content: (
        <>
          <InlineEdit
            value={company.name ?? ''}
            onCommit={(name) => onFieldChange({ name })}
            ariaLabel={`Company name for row ${serial}`}
            placeholder="Company name"
            bare
            className="text-sm font-semibold text-foreground"
          />
          {company.kind === 'internship' && (
            <span className="ml-1 inline-block rounded-full bg-accent/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-accent">
              Intern
            </span>
          )}
        </>
      ),
    },

    // Role is the bright identity field; package is deliberately muted.
    role: {
      cls: 'py-2.5 pl-1 pr-1 align-middle',
      content: (
        <InlineEdit
          value={company.role ?? ''}
          onCommit={(role) => onFieldChange({ role })}
          ariaLabel={`Role for row ${serial}`}
          placeholder="Role"
          bare
          className="text-xs font-medium text-primary"
        />
      ),
    },

    package: {
      cls: 'py-2.5 pr-6 align-middle',
      content: (
        <InlineEdit
          value={company.compensation?.amount ? String(company.compensation.amount) : ''}
          onCommit={(v) =>
            onFieldChange({
              compensation: {
                amount: Number(v) || 0,
                unit: company.compensation?.unit ?? 'LPA',
              },
            })
          }
          ariaLabel={`Package for row ${serial}`}
          placeholder="0"
          type="number"
          bare
          mono
          /*
           * Editing works on the raw number; at rest it reads as "1.35L/mo".
           * The em-dash fallback matters: formatPackage returns '' for an
           * unset package, and an empty display fell through to the raw input,
           * which showed a lone "0" placeholder stranded a fixed 44px away
           * from its "LPA" suffix.
           */
          display={
            formatPackage(
              company.compensation?.amount ?? 0,
              company.compensation?.unit ?? 'LPA',
            ) || '—'
          }
          suffix={packageSuffix(company.compensation?.unit ?? 'LPA')}
          className="text-xs text-muted-foreground"
        />
      ),
    },

    status: {
      cls: 'py-2.5 pl-2 pr-2 align-middle',
      content: company.optedIn ? (
        <StatusSelects history={company.history} onChange={onStatusChange} stacked={stackStatus} />
      ) : (
        <span className="inline-flex items-center rounded-[20px] border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Not Applying
        </span>
      ),
    },

    /**
     * Shows the CURRENT round's notes, not a company-level note. Notes belong
     * to a round — the same company has different things worth remembering
     * about its OA and its HR interview — so the column tracks whichever round
     * is live, and the rest are one click away in the journey.
     */
    notes: {
      cls: 'py-2.5 pl-2 pr-3 align-middle',
      content: company.optedIn && nowIndex >= 0 ? (
        <NotesCell
          value={company.history[nowIndex].notes ?? ''}
          onChange={(notes) =>
            onFieldChange({
              history: company.history.map((e, i) => (i === nowIndex ? { ...e, notes } : e)),
            })
          }
        />
      ) : (
        <span className="text-xs text-muted-foreground/30">—</span>
      ),
    },

    skills: {
      cls: 'py-2.5 pl-2 pr-3 align-middle',
      content: company.optedIn ? (
        <SkillsCell value={company.skills ?? []} onChange={(skills) => onFieldChange({ skills })} />
      ) : (
        <span className="text-xs text-muted-foreground/30">—</span>
      ),
    },

    deadline: {
      cls: 'py-2.5 pl-2 pr-3 align-middle',
      content: (
        <DeadlineCell
          optedIn={company.optedIn}
          deadlineDate={company.deadlineDate}
          deadlineTime={company.deadlineTime}
          reason={company.reason}
          onChange={onDeadlineChange}
        />
      ),
    },

    optedIn: {
      cls: 'py-2.5 pl-2 pr-3 align-middle',
      content: (
        <ToggleSwitch
          checked={company.optedIn}
          onChange={onOptedInChange}
          label={company.optedIn ? 'Opted in' : 'Not opted in'}
        />
      ),
    },

    select: {
      cls: 'py-2.5 pr-3 align-middle sm:pr-4',
      content: (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelectedChange(e.target.checked)}
          aria-label={`Select ${company.name || 'company'}`}
          className="h-3.5 w-3.5 cursor-pointer accent-[var(--primary)]"
        />
      ),
    },
  };

  return (
    <>
      <tr
        data-company-id={company.id}
        onPointerDown={onRowPointerDown}
        className={`group border-b border-border/60 transition-colors ${rowBg} ${
          dragging ? 'relative z-10 opacity-60 shadow-[var(--shadow-card-hover)]' : ''
        }`}
      >
        {visibleIds.map((id) => {
          const cell = cells[id];
          if (!cell) return null;
          return (
            <td key={id} className={`overflow-hidden ${cell.cls}`}>
              {cell.content}
            </td>
          );
        })}
      </tr>

      {expanded && (
        <tr className="border-b border-border/60 bg-secondary/50">
          <td colSpan={visibleIds.length} className="p-0">
            <CompanyDetailPanel
              company={company}
              onFieldChange={onFieldChange}
              onDeleteHistoryEntry={onDeleteHistoryEntry}
            />
          </td>
        </tr>
      )}
    </>
  );
}
