'use client';

import { ChevronRight, Trash2, GripVertical } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import type { PipelineStage, PipelineState } from '@/lib/constants/placement';
import { ToggleSwitch } from './ToggleSwitch';
import { StatusSelects } from './StatusSelects';
import { DeadlineCell } from './DeadlineCell';
import { CompanyDetailPanel } from './CompanyDetailPanel';
import { InlineEdit } from './InlineEdit';

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
  onDelete: () => void;
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
  onDelete,
}: PlacementRowProps) {
  // Expanded rows keep the hover background so the pair reads as one unit.
  const rowBg = expanded ? 'bg-secondary/50' : 'hover:bg-secondary/50';

  return (
    <>
      <tr
        data-company-id={company.id}
        onPointerDown={onRowPointerDown}
        className={`group border-b border-border/60 transition-colors ${rowBg} ${
          dragging ? 'relative z-10 opacity-60 shadow-[var(--shadow-card-hover)]' : ''
        }`}
      >
        <td className="w-8 py-2.5 pl-3 pr-1 align-middle sm:pl-4">
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
        </td>

        <td className="w-12 py-2.5 pr-2 align-middle">
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
        </td>

        <td className="min-w-[120px] py-2.5 pr-3 align-middle">
          <InlineEdit
            value={company.name ?? ''}
            onCommit={(name) => onFieldChange({ name })}
            ariaLabel={`Company name for row ${serial}`}
            placeholder="Company name"
            bare
            className="text-sm font-semibold text-foreground"
          />
        </td>

        {/* Role is the bright identity field; package is deliberately muted. */}
        <td className="hidden min-w-[110px] py-2.5 pr-3 align-middle sm:table-cell">
          <InlineEdit
            value={company.role ?? ''}
            onCommit={(role) => onFieldChange({ role })}
            ariaLabel={`Role for row ${serial}`}
            placeholder="Role"
            bare
            className="text-xs font-medium text-primary"
          />
        </td>

        <td className="hidden w-24 py-2.5 pr-3 align-middle xl:table-cell">
          <InlineEdit
            value={company.package ? String(company.package) : ''}
            onCommit={(v) => onFieldChange({ package: Number(v) || 0 })}
            ariaLabel={`Package for row ${serial}`}
            placeholder="0"
            type="number"
            bare
            mono
            suffix="LPA"
            className="text-xs text-muted-foreground"
          />
        </td>

        <td className="py-2.5 pr-3 align-middle">
          {company.optedIn ? (
            <StatusSelects history={company.history} onChange={onStatusChange} />
          ) : (
            <span className="inline-flex items-center rounded-[20px] border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Not Applying
            </span>
          )}
        </td>

        <td className="hidden py-2.5 pr-3 align-middle lg:table-cell">
          <DeadlineCell
            optedIn={company.optedIn}
            deadlineDate={company.deadlineDate}
            deadlineTime={company.deadlineTime}
            reason={company.reason}
            onChange={onDeadlineChange}
          />
        </td>

        <td className="py-2.5 pr-3 align-middle">
          <ToggleSwitch
            checked={company.optedIn}
            onChange={onOptedInChange}
            label={company.optedIn ? 'Opted in' : 'Not opted in'}
          />
        </td>

        <td className="w-8 py-2.5 pr-3 align-middle sm:pr-4">
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${company.name || 'company'}`}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border/60 bg-secondary/50">
          <td colSpan={9} className="p-0">
            <CompanyDetailPanel company={company} onFieldChange={onFieldChange} />
          </td>
        </tr>
      )}
    </>
  );
}
