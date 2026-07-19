'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { STORAGE_KEYS, type PlacementCompany } from '@/lib/utils/storage';
import {
  FIRST_STAGE,
  type OptedFilter,
  type PipelineStage,
  type PipelineState,
} from '@/lib/constants/placement';
import {
  migratePlacementCompanies,
  needsMigration,
  nextCompanyId,
  makeStageEntry,
  todayISO,
} from '@/lib/utils/placementMigration';
import { PlacementStatsStrip } from '@/components/features/placement/PlacementStatsStrip';
import { PlacementToolbar } from '@/components/features/placement/PlacementToolbar';
import { PlacementTable } from '@/components/features/placement/PlacementTable';
import {
  AddCompanyModal,
  type NewCompanyDraft,
} from '@/components/features/placement/AddCompanyModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function PlacementPage() {
  // Raw persisted value — may still hold pre-redesign records, either on first
  // load or when a background MongoDB sync pushes an older array into state.
  const [stored, setStored] = useLocalStorage<unknown[]>(
    STORAGE_KEYS.PLACEMENT_COMPANIES,
    [],
  );

  /**
   * Migrate on READ, not in an effect. Effects run after render, so migrating
   * there would hand legacy records (no `history`, no `name`) to the components
   * for one paint and crash them. This guarantees the UI only ever sees the
   * current shape, whatever arrives from storage or sync.
   */
  const companies = useMemo(() => migratePlacementCompanies(stored), [stored]);

  /** Always writes the migrated shape back to storage. */
  const setCompanies = useCallback(
    (updater: (prev: PlacementCompany[]) => PlacementCompany[]) => {
      setStored((prev) => updater(migratePlacementCompanies(prev)));
    },
    [setStored],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [optedFilter, setOptedFilter] = useState<OptedFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Several rows may stay open at once; expanding one no longer closes another.
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Persist the migration once so the reshape survives a reload and reaches
  // MongoDB. Rendering already uses the migrated value regardless.
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    if (!needsMigration(stored)) return;
    migratedRef.current = true;
    setStored(migratePlacementCompanies(stored));
  }, [stored, setStored]);

  const visibleCompanies = useMemo(() => {
    let list = companies;

    if (optedFilter === 'in') list = list.filter((c) => c.optedIn);
    else if (optedFilter === 'out') list = list.filter((c) => !c.optedIn);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
      );
    }

    return list;
  }, [companies, optedFilter, searchQuery]);

  /** True only when every currently visible row is open. */
  const allExpanded =
    visibleCompanies.length > 0 &&
    visibleCompanies.every((c) => expandedIds.includes(c.id));

  const updateCompany = useCallback(
    (id: number, patch: (c: PlacementCompany) => PlacementCompany) => {
      setCompanies((prev) => prev.map((c) => (c.id === id ? patch(c) : c)));
    },
    [setCompanies],
  );

  /**
   * Same stage as the last entry → update it in place (the stage is just moving
   * Preparing → Waiting → Done). Different stage → push a new entry, because a
   * new pipeline step has started.
   */
  const handleStatusChange = useCallback(
    (id: number, stage: PipelineStage, state: PipelineState) => {
      updateCompany(id, (c) => {
        const history = [...c.history];
        const last = history[history.length - 1];

        if (last && last.stage === stage) {
          history[history.length - 1] = { ...last, status: state, date: todayISO() };
        } else {
          history.push(makeStageEntry(stage, state));
        }

        return { ...c, history };
      });
    },
    [updateCompany],
  );

  const handleDeadlineChange = useCallback(
    (id: number, deadlineDate: string, deadlineTime: string) => {
      updateCompany(id, (c) => ({ ...c, deadlineDate, deadlineTime }));
    },
    [updateCompany],
  );

  /**
   * Turning opted-in on seeds the starting entry if there's no history yet;
   * turning it off preserves history, so re-enabling resumes where they left off.
   */
  const handleOptedInChange = useCallback(
    (id: number, optedIn: boolean) => {
      updateCompany(id, (c) => ({
        ...c,
        optedIn,
        history:
          optedIn && c.history.length === 0
            ? [makeStageEntry(FIRST_STAGE, 'Preparing')]
            : c.history,
      }));
    },
    [updateCompany],
  );

  /** Generic patch so every scalar field is editable through one path. */
  const handleFieldChange = useCallback(
    (id: number, patch: Partial<PlacementCompany>) => {
      updateCompany(id, (c) => ({ ...c, ...patch }));
    },
    [updateCompany],
  );

  /**
   * Serial numbers reflect position in the FULL list, so filtering to
   * "Not Opted" shows 3,4,5 rather than renumbering them 1,2,3.
   */
  const serialOf = useCallback(
    (id: number) => companies.findIndex((c) => c.id === id) + 1,
    [companies],
  );

  /** Moves source to target's position in the full list, filtered view or not. */
  const handleReorder = useCallback(
    (sourceId: number, targetId: number) => {
      setCompanies((prev) => {
        const from = prev.findIndex((c) => c.id === sourceId);
        const to = prev.findIndex((c) => c.id === targetId);
        if (from === -1 || to === -1 || from === to) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
    [setCompanies],
  );

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  /**
   * Removes one logged stage. The row's selects follow whatever becomes the new
   * last entry, since they read from history rather than holding their own
   * committed state.
   */
  const handleDeleteHistoryEntry = useCallback(
    (id: number, index: number) => {
      updateCompany(id, (c) => ({
        ...c,
        history: c.history.filter((_, i) => i !== index),
      }));
    },
    [updateCompany],
  );

  /** Deletes every selected company. Only ever called from the confirm dialog. */
  const handleDeleteSelected = useCallback(() => {
    setCompanies((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setConfirmDelete(false);
  }, [setCompanies, selectedIds]);

  const handleCreate = useCallback(
    (draft: NewCompanyDraft) => {
      setCompanies((prev) => [
        ...prev,
        {
          id: nextCompanyId(prev),
          name: draft.name,
          role: draft.role,
          package: draft.package,
          location: draft.location,
          optedIn: draft.optedIn,
          registered: false,
          deadlineDate: draft.deadlineDate,
          deadlineTime: draft.deadlineTime,
          reason: draft.reason,
          skills: draft.skills,
          notes: draft.notes,
          // Seed a starting entry so an opted-in row isn't blank.
          history: draft.optedIn ? [makeStageEntry(FIRST_STAGE, 'Preparing')] : [],
        },
      ]);
      setShowAddModal(false);
    },
    [setCompanies],
  );

  return (
    <div className="min-h-full bg-background pb-6">
      {/* Page head */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-5 sm:px-6">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Placement Tracker
            </h1>
            <span className="text-xs font-medium text-muted-foreground">
              · {companies.length} compan{companies.length === 1 ? 'y' : 'ies'} tracked
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Track and manage your placement applications end-to-end.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Company
        </button>
      </div>

      <PlacementStatsStrip companies={companies} />

      <PlacementToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        optedFilter={optedFilter}
        onOptedFilterChange={setOptedFilter}
        allExpanded={allExpanded}
        onToggleExpandAll={() =>
          setExpandedIds(allExpanded ? [] : visibleCompanies.map((c) => c.id))
        }
      />

      {selectedIds.length > 0 && (
        <div className="mx-3 mb-2 flex flex-wrap items-center gap-2 px-1 sm:mx-6">
          <span className="text-xs font-semibold text-foreground">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      <PlacementTable
        companies={visibleCompanies}
        onStatusChange={handleStatusChange}
        onDeadlineChange={handleDeadlineChange}
        onOptedInChange={handleOptedInChange}
        onFieldChange={handleFieldChange}
        onDeleteHistoryEntry={handleDeleteHistoryEntry}
        serialOf={serialOf}
        onReorder={handleReorder}
        selectedIds={selectedIds}
        onSelectedChange={setSelectedIds}
        expandedIds={expandedIds}
        onToggleExpand={handleToggleExpand}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        isDestructive
        title={`Delete ${selectedIds.length} compan${selectedIds.length === 1 ? 'y' : 'ies'}?`}
        description={
          selectedIds.length === 1
            ? `"${companies.find((c) => c.id === selectedIds[0])?.name || 'This company'}" and its stage history will be permanently removed. This cannot be undone.`
            : `${selectedIds.length} companies and all their stage history will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />

      {showAddModal && (
        <AddCompanyModal onCreate={handleCreate} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
