'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { STORAGE_KEYS, type PlacementCompany } from '@/lib/utils/storage';
import {
  FIRST_STAGE,
  type OpportunityYear,
  type OpportunityKind,
  DEFAULT_KIND,
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
  orderJourney,
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
  // The tab is the year; a company's placement/internship kind is its own field.
  const [year, setYear] = useState<OpportunityYear>('fourth');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Several rows may stay open at once; expanding one no longer closes another.
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const handleSelectionModeChange = (val: boolean) => {
    setSelectionMode(val);
    if (!val) {
      setSelectedIds([]);
    }
  };

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
    let list = companies.filter((c) => c.year === year);

    if (optedFilter === 'in') list = list.filter((c) => c.optedIn);
    else if (optedFilter === 'out') list = list.filter((c) => !c.optedIn);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
      );
    }

    return list;
  }, [companies, year, optedFilter, searchQuery]);

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
        const matchIdx = history.findIndex((x) => x.stage === stage);

        if (matchIdx !== -1) {
          history[matchIdx] = { ...history[matchIdx], status: state, date: todayISO() };
        } else {
          history.push(makeStageEntry(stage, state));
        }

        const sorted = orderJourney(history);
        return { ...c, history: sorted };
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

  /**
   * Generic patch so every scalar field is editable through one path.
   *
   * Opting in seeds the first stage here rather than only in
   * handleOptedInChange, because the row's toggle is no longer the only way to
   * set it — the detail panel has one too (the column is dropped on narrow
   * screens), and the AI writes the field directly. Centralising it means a
   * company can't end up opted in with an empty journey depending on which
   * control was used.
   */
  const handleFieldChange = useCallback(
    (id: number, patch: Partial<PlacementCompany>) => {
      updateCompany(id, (c) => {
        const next = { ...c, ...patch };
        if (next.optedIn && next.history.length === 0) {
          next.history = [makeStageEntry(FIRST_STAGE, 'Preparing')];
        }
        return next;
      });
    },
    [updateCompany],
  );

  /**
   * Numbering restarts per year tab: 3rd Year runs 1..n and 4th Year runs 1..n
   * independently, since the two are separate records that never interleave.
   *
   * It is position within that year bucket — NOT within the filtered view — so
   * switching to "Not Opted" still shows each row's real number rather than
   * renumbering the visible subset 1,2,3.
   */
  const serialOf = useCallback(
    (id: number) => {
      const target = companies.find((c) => c.id === id);
      if (!target) return 0;
      return companies.filter((c) => c.year === target.year).findIndex((c) => c.id === id) + 1;
    },
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
          // New entries land in the tab being viewed; kind is the user's choice.
          year,
          kind: draft.kind,
          compensation: { amount: draft.amount, unit: draft.unit },
          startDate: '',
          endDate: '',
          durationMonths: 0,
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
          schedule: [],
        },
      ]);
      setShowAddModal(false);
    },
    [setCompanies],
  );

  return (
    <div className="min-h-full bg-background pb-6">
      <PageHeader
        title="Placement Tracker"
        icon={Building2}
        description="Track and manage your placement applications end-to-end."
        accentColor="--color-primary"
      />

      <div className="mx-auto max-w-[1500px] w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] mt-6 space-y-6">
        <PlacementStatsStrip companies={companies.filter((c) => c.year === year)} />

        <PlacementToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          optedFilter={optedFilter}
          onOptedFilterChange={setOptedFilter}
          year={year}
          onYearChange={(y) => {
            setYear(y);
            // Selections and open rows belong to the tab they were made in.
            setSelectedIds([]);
            setExpandedIds([]);
          }}
          counts={{
            third: companies.filter((c) => c.year === 'third').length,
            fourth: companies.filter((c) => c.year === 'fourth').length,
          }}
          allExpanded={allExpanded}
          onToggleExpandAll={() =>
            setExpandedIds(allExpanded ? [] : visibleCompanies.map((c) => c.id))
          }
          selectionMode={selectionMode}
          onSelectionModeChange={handleSelectionModeChange}
          onAddCompany={() => setShowAddModal(true)}
        />

        {selectedIds.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
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
          selectionMode={selectionMode}
        />
      </div>

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
        <AddCompanyModal
          defaultKind={DEFAULT_KIND} onCreate={handleCreate} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
