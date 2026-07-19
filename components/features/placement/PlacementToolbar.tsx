'use client';

import { Search } from 'lucide-react';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { OPTED_FILTERS, type OptedFilter } from '@/lib/constants/placement';

interface PlacementToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  optedFilter: OptedFilter;
  onOptedFilterChange: (f: OptedFilter) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
}

export function PlacementToolbar({
  searchQuery,
  onSearchChange,
  optedFilter,
  onOptedFilterChange,
  allExpanded,
  onToggleExpandAll,
}: PlacementToolbarProps) {
  return (
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

      <button
        type="button"
        onClick={onToggleExpandAll}
        className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground sm:ml-auto"
      >
        {allExpanded ? (
          <ChevronsDownUp className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3" />
        )}
        {allExpanded ? 'Collapse all' : 'Expand all'}
      </button>
    </div>
  );
}
