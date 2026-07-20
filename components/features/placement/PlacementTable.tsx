'use client';

import { Building2 } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import type { PipelineStage, PipelineState } from '@/lib/constants/placement';
import { PlacementRow } from './PlacementRow';
import { useRowReorder } from './useRowReorder';
import { useTableColumns, STATUS_STACK_BELOW } from './useTableColumns';

interface PlacementTableProps {
  companies: PlacementCompany[];
  onStatusChange: (id: number, stage: PipelineStage, state: PipelineState) => void;
  onDeadlineChange: (id: number, date: string, time: string) => void;
  onOptedInChange: (id: number, optedIn: boolean) => void;
  onFieldChange: (id: number, patch: Partial<PlacementCompany>) => void;
  onDeleteHistoryEntry: (id: number, index: number) => void;
  selectedIds: number[];
  onSelectedChange: (ids: number[]) => void;
  expandedIds: number[];
  onToggleExpand: (id: number) => void;
  serialOf: (id: number) => number;
  onReorder: (sourceId: number, targetId: number) => void;
  selectionMode?: boolean;
}

/**
 * One row per company. Everything that doesn't fit is behind the expandable
 * row, never behind a horizontal scrollbar — the table is sized to its own
 * container (see useTableColumns) and drops columns rather than overflowing.
 */
export function PlacementTable({
  companies,
  onStatusChange,
  onDeadlineChange,
  onOptedInChange,
  onFieldChange,
  onDeleteHistoryEntry,
  selectedIds,
  onSelectedChange,
  serialOf,
  onReorder,
  expandedIds,
  onToggleExpand,
  selectionMode = false,
}: PlacementTableProps) {
  const { draggingId, handlePointerDown, rowPointerDown } = useRowReorder(onReorder);
  const { ref: shellRef, columns, widths, statusWidth } = useTableColumns(selectionMode);
  const visibleIds = columns.map((c) => c.id);
  const stackStatus = statusWidth > 0 && statusWidth < STATUS_STACK_BELOW;

  if (companies.length === 0) {
    return (
      <div className="card-soft mx-3 mb-6 flex flex-col items-center justify-center gap-2 bg-card px-6 py-16 text-center sm:mx-6">
        <Building2 className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">No companies yet</p>
        <p className="text-xs text-muted-foreground">
          Add a company to start tracking its placement pipeline.
        </p>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="card-soft mx-3 mb-6 overflow-hidden bg-card sm:mx-6">
      {/* No overflow-x anywhere on this path, by design. Columns are chosen to
          fit the measured width, so there is never anything to scroll to. */}
      <div className={draggingId !== null ? 'select-none' : ''}>
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            {columns.map((c, i) => (
              <col key={c.id} style={{ width: widths[i] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              {columns.map((h, i) => (
                <th
                  key={h.id}
                  scope="col"
                  className={`overflow-hidden truncate py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ${
                    i === 0 ? 'pl-3 sm:pl-4' : ''
                  } ${i === columns.length - 1 ? 'pr-3 sm:pr-4' : 'pr-2 sm:pr-3'}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <PlacementRow
                key={company.id}
                company={company}
                serial={serialOf(company.id)}
                dragging={draggingId === company.id}
                onHandlePointerDown={(e) => handlePointerDown(e, company.id)}
                onRowPointerDown={(e) => rowPointerDown(e, company.id)}
                expanded={expandedIds.includes(company.id)}
                onToggleExpand={() => onToggleExpand(company.id)}
                onStatusChange={(stage, state) => onStatusChange(company.id, stage, state)}
                onDeadlineChange={(date, time) => onDeadlineChange(company.id, date, time)}
                onOptedInChange={(optedIn) => onOptedInChange(company.id, optedIn)}
                onFieldChange={(patch) => onFieldChange(company.id, patch)}
                onDeleteHistoryEntry={(i) => onDeleteHistoryEntry(company.id, i)}
                selected={selectedIds.includes(company.id)}
                onSelectedChange={(sel) =>
                  onSelectedChange(
                    sel
                      ? [...selectedIds, company.id]
                      : selectedIds.filter((x) => x !== company.id),
                  )
                }
                selectionMode={selectionMode}
                visibleIds={visibleIds}
                stackStatus={stackStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
