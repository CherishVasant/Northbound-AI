'use client';

import { useRef } from 'react';
import { Search, Plus, Archive } from 'lucide-react';
import { FilterPopover, FilterState } from './FilterPopover';
import { SortMenu } from './SortMenu';
import { SortField, SortDirection } from '@/lib/constants/placement';
import { PlacementCustomOptions } from '@/lib/utils/storage';

interface PlacementToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddCompany: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, dir: SortDirection) => void;
  customOptions: PlacementCustomOptions;
  totalVisible: number;
  totalAll: number;
}

export function PlacementToolbar({
  searchQuery,
  onSearchChange,
  onAddCompany,
  showArchived,
  onToggleArchived,
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  customOptions,
  totalVisible,
  totalAll,
}: PlacementToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  const allJobRoles = [
    'SDE', 'Frontend Developer', 'AI Engineer', 'Data Analyst',
    ...customOptions.jobRoles,
  ];
  const allLocations = [
    'Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi',
    ...customOptions.locations,
  ];
  const allSkills = [
    'DSA', 'Java', 'Python', 'C++', 'SQL', 'DBMS', 'OS', 'CN', 'OOP',
    'JavaScript', 'React', 'Node.js', 'ML', 'DL', 'NLP', 'LLM',
    'AWS', 'Docker', 'Git', 'Linux',
    ...customOptions.skills,
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-border bg-background/80 sticky top-0 z-30 backdrop-blur-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search companies…"
          className="w-full h-8 pl-8 pr-3 text-xs bg-background pill-soft focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter */}
      <FilterPopover
        filters={filters}
        onChange={onFilterChange}
        jobRoleOptions={allJobRoles}
        locationOptions={allLocations}
        skillOptions={allSkills}
      />

      {/* Sort */}
      <SortMenu
        field={sortField}
        direction={sortDirection}
        onChange={onSortChange}
      />

      {/* Archive toggle */}
      <button
        onClick={onToggleArchived}
        className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium pill-soft pill-soft-interactive transition-colors ${
          showArchived
            ? 'bg-muted text-foreground ring-1 ring-primary/50'
            : 'hover:bg-accent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Archive className="w-3.5 h-3.5" />
        {showArchived ? 'Archived Shown' : 'Archived'}
      </button>

      {/* Result count */}
      <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
        {totalVisible} of {totalAll}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Add Company */}
      <button
        onClick={onAddCompany}
        className="flex items-center gap-1.5 h-8 px-4 text-xs font-semibold pill-soft pill-soft-interactive bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Company
      </button>
    </div>
  );
}
