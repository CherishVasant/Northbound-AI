'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import type { PipelineStage, PipelineState } from '@/lib/constants/placement';
import { PlacementRow } from './PlacementRow';

interface PlacementTableProps {
  companies: PlacementCompany[];
  onStatusChange: (id: number, stage: PipelineStage, state: PipelineState) => void;
  onDeadlineChange: (id: number, date: string, time: string) => void;
  onOptedInChange: (id: number, optedIn: boolean) => void;
  onNotesChange: (id: number, notes: string) => void;
  onSkillsChange: (id: number, skills: string[]) => void;
  onRegisteredChange: (id: number, registered: boolean) => void;
  onDelete: (id: number) => void;
}

const HEADERS = ['', '#', 'Company', 'Role', 'Package', 'Status', 'Deadline', 'Opted In', ''];

/**
 * One row per company. Everything that used to live in extra columns or a
 * second side-scrolling table is behind the expandable row instead.
 */
export function PlacementTable({
  companies,
  onStatusChange,
  onDeadlineChange,
  onOptedInChange,
  onNotesChange,
  onSkillsChange,
  onRegisteredChange,
  onDelete,
}: PlacementTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (companies.length === 0) {
    return (
      <div className="card-soft mx-6 mb-6 flex flex-col items-center justify-center gap-2 bg-card px-6 py-16 text-center">
        <Building2 className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">No companies yet</p>
        <p className="text-xs text-muted-foreground">
          Add a company to start tracking its placement pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft mx-6 mb-6 overflow-hidden bg-card">
      {/* Horizontal scroll is a fallback for narrow screens only — the table is
          designed to fit without it. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map((h, i) => (
                <th
                  key={`${h}-${i}`}
                  scope="col"
                  className={`py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ${
                    i === 0 ? 'pl-4' : ''
                  } ${i === HEADERS.length - 1 ? 'pr-4' : 'pr-3'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <PlacementRow
                key={company.id}
                company={company}
                index={index}
                expanded={expandedId === company.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === company.id ? null : company.id))
                }
                onStatusChange={(stage, state) => onStatusChange(company.id, stage, state)}
                onDeadlineChange={(date, time) => onDeadlineChange(company.id, date, time)}
                onOptedInChange={(optedIn) => onOptedInChange(company.id, optedIn)}
                onNotesChange={(notes) => onNotesChange(company.id, notes)}
                onSkillsChange={(skills) => onSkillsChange(company.id, skills)}
                onRegisteredChange={(reg) => onRegisteredChange(company.id, reg)}
                onDelete={() => onDelete(company.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
