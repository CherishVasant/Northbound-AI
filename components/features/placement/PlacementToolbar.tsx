'use client';

import { Search } from 'lucide-react';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { OPTED_FILTERS, YEARS, type OptedFilter, type OpportunityYear } from '@/lib/constants/placement';

interface PlacementToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  optedFilter: OptedFilter;
  onOptedFilterChange: (f: OptedFilter) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  year: OpportunityYear;
  onYearChange: (y: OpportunityYear) => void;
  counts: Record<OpportunityYear, number>;
  selectionMode: boolean;
  onSelectionModeChange: (val: boolean) => void;
}

export function PlacementToolbar({
  searchQuery,
  onSearchChange,
  optedFilter,
  onOptedFilterChange,
  allExpanded,
  onToggleExpandAll,
  year,
  onYearChange,
  counts,
  selectionMode,
  onSelectionModeChange,
}: PlacementToolbarProps) {
  return (
    <>
      {/* Track tabs sit above the other controls: they scope everything below,
          including which companies the stats strip counts. */}
      <div
        role="tablist"
        aria-label="Year"
        className="flex items-center gap-1 px-4 pb-3 sm:px-6"
      >
        {YEARS.map((t) => {
          const active = year === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onYearChange(t.value)}
              className={`flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[var(--nav-active-bg)] text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              {t.label}
              <span
                className={`font-mono text-[10px] ${
                  active ? 'text-primary/70' : 'text-muted-foreground/70'
                }`}
              >
                {counts[t.value]}
              </span>
            </button>
          );
        })}
      </div>

    <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search companies or roles..."
          aria-label="Search companies or roles"
          className="pill-soft w-full bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Segmented filter */}
      <div
        role="tablist"
        aria-label="Filter by opted-in state"
        className="pill-soft flex items-center gap-0.5 bg-card p-0.5"
      >
        {OPTED_FILTERS.map((f) => {
          const active = optedFilter === f.value;
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => onOptedFilterChange(f.value)}
              className={`rounded-[8px] px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? 'bg-[var(--nav-active-bg)] text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={() => onSelectionModeChange(!selectionMode)}
          className={`pill-soft pill-soft-interactive flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-all ${
            selectionMode
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          {selectionMode ? 'Cancel Selection' : 'Select'}
        </button>

        <button
          type="button"
          onClick={onToggleExpandAll}
          className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {allExpanded ? (
            <ChevronsDownUp className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3" />
          )}
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
    </div>
    </>
  );
}
