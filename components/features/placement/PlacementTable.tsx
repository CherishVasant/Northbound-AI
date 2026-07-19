'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import type { PipelineStage, PipelineState } from '@/lib/constants/placement';
import { PlacementRow } from './PlacementRow';
import { useRowReorder } from './useRowReorder';

interface PlacementTableProps {
  companies: PlacementCompany[];
  onStatusChange: (id: number, stage: PipelineStage, state: PipelineState) => void;
  onDeadlineChange: (id: number, date: string, time: string) => void;
  onOptedInChange: (id: number, optedIn: boolean) => void;
  onFieldChange: (id: number, patch: Partial<PlacementCompany>) => void;
  onDelete: (id: number) => void;
  /** Position in the FULL list, so numbering survives filtering. */
  serialOf: (id: number) => number;
  onReorder: (sourceId: number, targetId: number) => void;
}

/**
 * `cls` must stay in lockstep with the matching <td> in PlacementRow — a header
 * hidden at a breakpoint where its cell is not (or vice versa) shifts the whole
 * row. Columns hidden on small screens remain editable in the detail panel.
 */
const HEADERS: { label: string; cls: string }[] = [
  { label: '', cls: '' },
  { label: '#', cls: '' },
  { label: 'Company', cls: '' },
  { label: 'Role', cls: 'hidden sm:table-cell' },
  { label: 'Package', cls: 'hidden xl:table-cell' },
  { label: 'Status', cls: '' },
  { label: 'Deadline', cls: 'hidden lg:table-cell' },
  { label: 'Opted In', cls: '' },
  { label: '', cls: '' },
];

/**
 * One row per company. Everything that used to live in extra columns or a
 * second side-scrolling table is behind the expandable row instead.
 */
export function PlacementTable({
  companies,
  onStatusChange,
  onDeadlineChange,
  onOptedInChange,
  onFieldChange,
  onDelete,
  serialOf,
  onReorder,
}: PlacementTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { draggingId, handlePointerDown, rowPointerDown } = useRowReorder(onReorder);

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
    <div className="card-soft mx-3 mb-6 overflow-hidden bg-card sm:mx-6">
      {/* Horizontal scroll is a fallback for narrow screens only — the table is
          designed to fit without it. */}
      <div className={`overflow-x-auto ${draggingId !== null ? "select-none" : ""}`}>
        <table className="w-full border-collapse text-left lg:min-w-[860px]">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map((h, i) => (
                <th
                  key={`${h.label}-${i}`}
                  scope="col"
                  className={`py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ${
                    i === 0 ? 'pl-3 sm:pl-4' : ''
                  } ${i === HEADERS.length - 1 ? 'pr-3 sm:pr-4' : 'pr-2 sm:pr-3'} ${h.cls}`}
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
                expanded={expandedId === company.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === company.id ? null : company.id))
                }
                onStatusChange={(stage, state) => onStatusChange(company.id, stage, state)}
                onDeadlineChange={(date, time) => onDeadlineChange(company.id, date, time)}
                onOptedInChange={(optedIn) => onOptedInChange(company.id, optedIn)}
                onFieldChange={(patch) => onFieldChange(company.id, patch)}
                onDelete={() => onDelete(company.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
