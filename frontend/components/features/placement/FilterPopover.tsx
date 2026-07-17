'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import {
  CURRENT_STAGES,
  STAGE_STATUSES,
  PRIORITIES,
  FINAL_RESULTS,
} from '@/lib/constants/placement';

export interface FilterState {
  jobRole: string;
  skills: string[];
  currentStage: string;
  stageStatus: string;
  priority: string;
  finalResult: string;
  location: string;
}

export const EMPTY_FILTER: FilterState = {
  jobRole: '',
  skills: [],
  currentStage: '',
  stageStatus: '',
  priority: '',
  finalResult: '',
  location: '',
};

interface FilterPopoverProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  jobRoleOptions: string[];
  locationOptions: string[];
  skillOptions: string[];
}

export function FilterPopover({
  filters,
  onChange,
  jobRoleOptions,
  locationOptions,
  skillOptions,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activeCount = [
    filters.jobRole,
    filters.currentStage,
    filters.stageStatus,
    filters.priority,
    filters.finalResult,
    filters.location,
    ...filters.skills,
  ].filter(Boolean).length;

  const set = (key: keyof FilterState, val: any) => onChange({ ...filters, [key]: val });

  const toggleSkill = (skill: string) => {
    const has = filters.skills.includes(skill);
    set('skills', has ? filters.skills.filter((s) => s !== skill) : [...filters.skills, skill]);
  };

  const clearAll = () => onChange(EMPTY_FILTER);

  const select = (key: keyof FilterState, options: string[]) => (
    <select
      value={(filters[key] as string) || ''}
      onChange={(e) => set(key, e.target.value)}
      className="w-full h-7 text-xs px-2 bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">All</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
          activeCount > 0
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        Filter
        {activeCount > 0 && (
          <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-2xl w-72 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Filters</span>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* Job Role */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Job Role</label>
            {select('jobRole', jobRoleOptions)}
          </div>

          {/* Current Stage */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Current Stage</label>
            {select('currentStage', CURRENT_STAGES)}
          </div>

          {/* Stage Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Stage Status</label>
            {select('stageStatus', STAGE_STATUSES)}
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Priority</label>
            {select('priority', PRIORITIES)}
          </div>

          {/* Final Result */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Final Result</label>
            {select('finalResult', FINAL_RESULTS)}
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Location</label>
            {select('location', locationOptions)}
          </div>

          {/* Skills — multi-select chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Skills</label>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {skillOptions.map((skill) => {
                const active = filters.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                      active
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
