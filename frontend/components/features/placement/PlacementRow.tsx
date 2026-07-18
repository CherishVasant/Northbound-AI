'use client';

import { ChevronRight, Trash2 } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import type { PipelineStage, PipelineState } from '@/lib/constants/placement';
import { ToggleSwitch } from './ToggleSwitch';
import { StatusSelects } from './StatusSelects';
import { DeadlineCell } from './DeadlineCell';
import { CompanyDetailPanel } from './CompanyDetailPanel';

interface PlacementRowProps {
  company: PlacementCompany;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (stage: PipelineStage, state: PipelineState) => void;
  onDeadlineChange: (date: string, time: string) => void;
  onOptedInChange: (optedIn: boolean) => void;
  onNotesChange: (notes: string) => void;
  onSkillsChange: (skills: string[]) => void;
  onRegisteredChange: (registered: boolean) => void;
  onDelete: () => void;
}

export function PlacementRow({
  company,
  index,
  expanded,
  onToggleExpand,
  onStatusChange,
  onDeadlineChange,
  onOptedInChange,
  onNotesChange,
  onSkillsChange,
  onRegisteredChange,
  onDelete,
}: PlacementRowProps) {
  // Expanded rows keep the hover background so the pair reads as one unit.
  const rowBg = expanded ? 'bg-secondary/50' : 'hover:bg-secondary/50';

  return (
    <>
      <tr className={`group border-b border-border/60 transition-colors ${rowBg}`}>
        <td className="w-8 py-2.5 pl-4 pr-1 align-middle">
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

        <td
          onClick={onToggleExpand}
          className="w-10 cursor-pointer py-2.5 pr-2 align-middle font-mono text-[11px] text-muted-foreground"
        >
          {index + 1}
        </td>

        <td
          onClick={onToggleExpand}
          title={expanded ? 'Hide details' : 'Show details, skills and notes'}
          className="cursor-pointer py-2.5 pr-3 align-middle"
        >
          <span className="text-sm font-semibold text-foreground">
            {company.name?.trim() || <span className="text-muted-foreground">Untitled</span>}
          </span>
        </td>

        {/* Role is the bright identity field; package is deliberately muted. */}
        <td
          onClick={onToggleExpand}
          className="cursor-pointer py-2.5 pr-3 align-middle"
        >
          <span className="text-xs font-medium text-primary">{company.role?.trim() || '—'}</span>
        </td>

        <td
          onClick={onToggleExpand}
          className="cursor-pointer py-2.5 pr-3 align-middle"
        >
          <span className="font-mono text-xs text-muted-foreground">
            {company.package ? `${company.package} LPA` : '—'}
          </span>
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

        <td className="py-2.5 pr-3 align-middle">
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

        <td className="w-8 py-2.5 pr-4 align-middle">
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${company.name || 'company'}`}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border/60 bg-secondary/50">
          <td colSpan={9} className="p-0">
            <CompanyDetailPanel
              company={company}
              onNotesChange={onNotesChange}
              onSkillsChange={onSkillsChange}
              onRegisteredChange={onRegisteredChange}
            />
          </td>
        </tr>
      )}
    </>
  );
}
