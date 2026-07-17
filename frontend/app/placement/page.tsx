'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { STORAGE_KEYS, PlacementCompany, PlacementCustomOptions } from '@/lib/utils/storage';
import {
  SortField,
  SortDirection,
  PRIORITY_WEIGHT,
} from '@/lib/constants/placement';
import { FilterState, EMPTY_FILTER } from '@/components/features/placement/FilterPopover';
import { PlacementSummaryStrip } from '@/components/features/placement/PlacementSummaryStrip';
import { PlacementToolbar } from '@/components/features/placement/PlacementToolbar';
import { PlacementTable } from '@/components/features/placement/PlacementTable';
import { NotesModal } from '@/components/features/placement/NotesModal';
import { PlacementNotes } from '@/lib/utils/storage';

const DEFAULT_CUSTOM_OPTIONS: PlacementCustomOptions = {
  jobRoles: [],
  locations: [],
  skills: [],
};

// Factory for a blank new company entry
function createBlankCompany(): PlacementCompany {
  return {
    id: crypto.randomUUID(),
    company: '',
    jobRole: '',
    skillsRequired: [],
    packageCTC: null,
    optedIn: false,
    registrationCompleted: false,
    applicationDeadline: null,
    currentStage: 'Application',
    stageStatus: 'Not Applied',
    nextEvent: '',
    nextEventDateTime: null,
    priority: 'Medium',
    preparationStatus: 'Not Started',
    finalResult: 'Pending',
    reason: '',
    notes: { content: '', lastEdited: null },
    location: '',
    archived: false,
    createdAt: new Date().toISOString(),
  };
}

export default function PlacementPage() {
  // ── Persistent state (auto-syncs to MongoDB via useLocalStorage) ──────────
  const [companies, setCompanies] = useLocalStorage<PlacementCompany[]>(
    STORAGE_KEYS.PLACEMENT_COMPANIES,
    []
  );
  const [customOptions, setCustomOptions] = useLocalStorage<PlacementCustomOptions>(
    STORAGE_KEYS.PLACEMENT_CUSTOM_OPTIONS,
    DEFAULT_CUSTOM_OPTIONS
  );

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER);
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showArchived, setShowArchived] = useState(false);
  const [notesCompany, setNotesCompany] = useState<PlacementCompany | null>(null);

  // ── Derived: filtered + sorted list ──────────────────────────────────────
  const processedCompanies = useMemo(() => {
    let list = companies.filter((c) => showArchived || !c.archived);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.company.toLowerCase().includes(q));
    }

    // Filters
    if (filters.jobRole)      list = list.filter((c) => c.jobRole === filters.jobRole);
    if (filters.currentStage) list = list.filter((c) => c.currentStage === filters.currentStage);
    if (filters.stageStatus)  list = list.filter((c) => c.stageStatus === filters.stageStatus);
    if (filters.priority)     list = list.filter((c) => c.priority === filters.priority);
    if (filters.finalResult)  list = list.filter((c) => c.finalResult === filters.finalResult);
    if (filters.location)     list = list.filter((c) => c.location === filters.location);
    if (filters.skills.length > 0) {
      list = list.filter((c) =>
        filters.skills.every((skill) => c.skillsRequired.includes(skill))
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'serialNumber':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'company':
          cmp = a.company.localeCompare(b.company);
          break;
        case 'applicationDeadline': {
          const da = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : Infinity;
          const db = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : Infinity;
          cmp = da - db;
          break;
        }
        case 'nextEventDateTime': {
          const da = a.nextEventDateTime ? new Date(a.nextEventDateTime).getTime() : Infinity;
          const db = b.nextEventDateTime ? new Date(b.nextEventDateTime).getTime() : Infinity;
          cmp = da - db;
          break;
        }
        case 'packageCTC':
          cmp = (a.packageCTC ?? -Infinity) - (b.packageCTC ?? -Infinity);
          break;
        case 'priority':
          cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [companies, searchQuery, filters, sortField, sortDirection, showArchived]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleAddCompany = useCallback(() => {
    setCompanies((prev) => [createBlankCompany(), ...prev]);
  }, [setCompanies]);

  const handleUpdate = useCallback(
    (updated: PlacementCompany) => {
      setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    },
    [setCompanies]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    },
    [setCompanies]
  );

  const handleSaveNotes = useCallback(
    (notes: PlacementNotes) => {
      if (!notesCompany) return;
      const updated = { ...notesCompany, notes };
      setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      // Keep modal open but update the ref so lastEdited shows correctly
      setNotesCompany(updated);
    },
    [notesCompany, setCompanies]
  );

  const handleAddCustomOption = useCallback(
    (type: 'jobRoles' | 'locations' | 'skills', val: string) => {
      setCustomOptions((prev) => {
        if (prev[type].includes(val)) return prev;
        return { ...prev, [type]: [...prev[type], val] };
      });
    },
    [setCustomOptions]
  );

  const handleSortChange = useCallback((field: SortField, dir: SortDirection) => {
    setSortField(field);
    setSortDirection(dir);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Page header */}
      <div className="px-6 pt-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Placement Tracker
          </h1>
          <span className="text-xs text-muted-foreground font-medium">
            {companies.filter((c) => !c.archived).length} compan{companies.filter((c) => !c.archived).length === 1 ? 'y' : 'ies'} tracked
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track and manage your placement applications end-to-end.
        </p>
      </div>

      {/* Summary strip */}
      <PlacementSummaryStrip companies={companies} />

      {/* Toolbar */}
      <PlacementToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddCompany={handleAddCompany}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((p) => !p)}
        filters={filters}
        onFilterChange={setFilters}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        customOptions={customOptions}
        totalVisible={processedCompanies.length}
        totalAll={companies.filter((c) => showArchived || !c.archived).length}
      />

      {/* Table — takes remaining height, scrolls horizontally and vertically */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <PlacementTable
          companies={processedCompanies}
          customOptions={customOptions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onOpenNotes={setNotesCompany}
          onAddCustomOption={handleAddCustomOption}
        />
      </div>

      {/* Notes Modal (portal-like overlay) */}
      {notesCompany && (
        <NotesModal
          company={notesCompany}
          onSave={handleSaveNotes}
          onClose={() => setNotesCompany(null)}
        />
      )}
    </div>
  );
}
