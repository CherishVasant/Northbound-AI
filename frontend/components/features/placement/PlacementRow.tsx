'use client';

import { useState, useCallback } from 'react';
import { Trash2, FileText, Archive, ArchiveRestore } from 'lucide-react';
import { PlacementCompany, PlacementCustomOptions, PlacementNotes } from '@/lib/utils/storage';
import {
  CURRENT_STAGES,
  STAGE_STATUSES,
  NEXT_EVENTS,
  PREPARATION_STATUSES,
  PRIORITY_WEIGHT,
  getRowHighlightClass,
} from '@/lib/constants/placement';
import { PlacementCell } from './PlacementCell';
import { ToggleSwitch } from './ToggleSwitch';
import { PriorityBadge } from './PriorityBadge';
import { StageStatusBadge, FinalResultBadge } from './StatusBadge';
import { EditableDropdown } from './EditableDropdown';
import { MultiSelectChip } from './MultiSelectChip';
import { DateTimePicker } from './DateTimePicker';

interface PlacementRowProps {
  company: PlacementCompany;
  serialNumber: number;
  customOptions: PlacementCustomOptions;
  onUpdate: (updated: PlacementCompany) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (company: PlacementCompany) => void;
  onAddCustomOption: (type: 'jobRoles' | 'locations' | 'skills', val: string) => void;
}

export function PlacementRow({
  company,
  serialNumber,
  customOptions,
  onUpdate,
  onDelete,
  onOpenNotes,
  onAddCustomOption,
}: PlacementRowProps) {
  const [companyName, setCompanyName] = useState(company.company);
  const [packageVal, setPackageVal] = useState(
    company.packageCTC !== null ? String(company.packageCTC) : ''
  );
  const [reason, setReason] = useState(company.reason);

  const set = useCallback(
    <K extends keyof PlacementCompany>(key: K, val: PlacementCompany[K]) => {
      onUpdate({ ...company, [key]: val });
    },
    [company, onUpdate]
  );

  const highlightClass = getRowHighlightClass(company.currentStage, company.finalResult);

  const allJobRoles = ['SDE', 'Frontend Developer', 'AI Engineer', 'Data Analyst', ...customOptions.jobRoles];
  const allLocations = ['Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', ...customOptions.locations];
  const allSkills = [
    'DSA', 'Java', 'Python', 'C++', 'SQL', 'DBMS', 'OS', 'CN', 'OOP',
    'JavaScript', 'React', 'Node.js', 'ML', 'DL', 'NLP', 'LLM',
    'AWS', 'Docker', 'Git', 'Linux',
    ...customOptions.skills,
  ];

  const hasNotes = company.notes.content.trim().length > 0;

  return (
    <tr className={`group transition-colors ${highlightClass} ${company.archived ? 'opacity-60' : ''}`}>

      {/* 1. Serial Number — sticky col 1 */}
      <PlacementCell sticky left={0} zIndex={15} minWidth={48} isHeader={false} className="text-center">
        <span className="text-xs font-bold text-muted-foreground tabular-nums">{serialNumber}</span>
      </PlacementCell>

      {/* 2. Company — sticky col 2 */}
      <PlacementCell sticky left={48} zIndex={14} minWidth={160} isHeader={false}>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={() => set('company', companyName)}
          placeholder="Company name"
          className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none focus:bg-background/80 focus:ring-1 focus:ring-primary rounded px-1 -mx-1 py-0.5 placeholder:text-muted-foreground/50"
        />
      </PlacementCell>

      {/* 3. Job Role */}
      <PlacementCell minWidth={148}>
        <EditableDropdown
          value={company.jobRole}
          options={allJobRoles}
          onChange={(v) => set('jobRole', v)}
          allowCustom
          onAddCustom={(v) => onAddCustomOption('jobRoles', v)}
          placeholder="Select role…"
        />
      </PlacementCell>

      {/* 4. Skills Required */}
      <PlacementCell minWidth={200}>
        <MultiSelectChip
          selected={company.skillsRequired}
          options={allSkills}
          onChange={(v) => set('skillsRequired', v)}
          allowCustom
          onAddCustom={(v) => onAddCustomOption('skills', v)}
          placeholder="Add skill"
        />
      </PlacementCell>

      {/* 5. Package (CTC) */}
      <PlacementCell minWidth={100}>
        <input
          type="text"
          inputMode="decimal"
          value={packageVal}
          onChange={(e) => setPackageVal(e.target.value)}
          onBlur={() => {
            const n = parseFloat(packageVal);
            set('packageCTC', isNaN(n) ? null : n);
          }}
          placeholder="e.g. 12.5"
          className="w-full bg-transparent text-xs focus:outline-none focus:bg-background/80 focus:ring-1 focus:ring-primary rounded px-1 -mx-1 py-0.5 placeholder:text-muted-foreground/50"
        />
        {company.packageCTC !== null && (
          <span className="text-[10px] text-muted-foreground">LPA</span>
        )}
      </PlacementCell>

      {/* 6. Opted In (NeoPAT) */}
      <PlacementCell minWidth={72} className="text-center">
        <ToggleSwitch checked={company.optedIn} onChange={(v) => set('optedIn', v)} label="Opted In (NeoPAT)" />
      </PlacementCell>

      {/* 7. Registration Completed */}
      <PlacementCell minWidth={80} className="text-center">
        <ToggleSwitch checked={company.registrationCompleted} onChange={(v) => set('registrationCompleted', v)} label="Registration Completed" />
      </PlacementCell>

      {/* 8. Application Deadline */}
      <PlacementCell minWidth={160}>
        <DateTimePicker
          value={company.applicationDeadline}
          onChange={(v) => set('applicationDeadline', v)}
          placeholder="Set deadline…"
        />
      </PlacementCell>

      {/* 9. Current Stage */}
      <PlacementCell minWidth={160}>
        <EditableDropdown
          value={company.currentStage}
          options={CURRENT_STAGES}
          onChange={(v) => set('currentStage', v as typeof company.currentStage)}
          placeholder="Stage…"
        />
      </PlacementCell>

      {/* 10. Stage Status */}
      <PlacementCell minWidth={140}>
        <StageStatusBadge value={company.stageStatus} onChange={(v) => set('stageStatus', v)} />
      </PlacementCell>

      {/* 11. Next Event */}
      <PlacementCell minWidth={164}>
        <EditableDropdown
          value={company.nextEvent}
          options={NEXT_EVENTS}
          onChange={(v) => set('nextEvent', v as typeof company.nextEvent)}
          placeholder="Next event…"
        />
      </PlacementCell>

      {/* 12. Next Event Date & Time */}
      <PlacementCell minWidth={160}>
        <DateTimePicker
          value={company.nextEventDateTime}
          onChange={(v) => set('nextEventDateTime', v)}
          placeholder="Set date…"
        />
      </PlacementCell>

      {/* 13. Priority */}
      <PlacementCell minWidth={96} className="text-center">
        <PriorityBadge value={company.priority} onChange={(v) => set('priority', v)} />
      </PlacementCell>

      {/* 14. Preparation Status */}
      <PlacementCell minWidth={160}>
        <EditableDropdown
          value={company.preparationStatus}
          options={PREPARATION_STATUSES}
          onChange={(v) => set('preparationStatus', v as typeof company.preparationStatus)}
          placeholder="Prep status…"
        />
      </PlacementCell>

      {/* 15. Final Result */}
      <PlacementCell minWidth={120}>
        <FinalResultBadge value={company.finalResult} onChange={(v) => set('finalResult', v)} />
      </PlacementCell>

      {/* 16. Reason */}
      <PlacementCell minWidth={160}>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => set('reason', reason)}
          placeholder="Reason…"
          className="w-full bg-transparent text-xs focus:outline-none focus:bg-background/80 focus:ring-1 focus:ring-primary rounded px-1 -mx-1 py-0.5 placeholder:text-muted-foreground/50"
        />
      </PlacementCell>

      {/* 17. Notes */}
      <PlacementCell minWidth={80} className="text-center">
        <button
          onClick={() => onOpenNotes(company)}
          title={hasNotes ? 'View / Edit Notes' : 'Add Notes'}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
            hasNotes
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <FileText className="w-3 h-3" />
          {hasNotes ? 'Notes' : 'Add'}
        </button>
      </PlacementCell>

      {/* 18. Location */}
      <PlacementCell minWidth={128}>
        <EditableDropdown
          value={company.location}
          options={allLocations}
          onChange={(v) => set('location', v)}
          allowCustom
          onAddCustom={(v) => onAddCustomOption('locations', v)}
          placeholder="Location…"
        />
      </PlacementCell>

      {/* Actions */}
      <PlacementCell minWidth={72} className="text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => set('archived', !company.archived)}
            title={company.archived ? 'Unarchive' : 'Archive'}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            {company.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${company.company || 'this company'}"?`)) {
                onDelete(company.id);
              }
            }}
            title="Delete"
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </PlacementCell>
    </tr>
  );
}
