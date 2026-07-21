'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, ShieldCheck, X } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import { fetchRestorePoint, type RestorePoint } from '@/lib/utils/archiveClient';

interface RestoreBackupModalProps {
  company: PlacementCompany;
  onRestore: (snapshot: PlacementCompany) => void;
  onClose: () => void;
}

/** Fields worth naming in the summary, in the order they read most naturally. */
const FIELD_LABELS: Partial<Record<keyof PlacementCompany, string>> = {
  name: 'Name',
  role: 'Role',
  kind: 'Type',
  year: 'Year',
  compensation: 'Compensation',
  baseSalary: 'Base salary',
  stipendAmount: 'Stipend',
  joiningBonus: 'Joining bonus',
  relocationBonus: 'Relocation bonus',
  ctcDetails: 'CTC details',
  miscellaneousNotes: 'Miscellaneous notes',
  aboutCompany: 'About the company',
  jobDescription: 'Job description',
  registrationLink: 'Registration link',
  location: 'Location',
  skills: 'Skills',
  history: 'Journey',
  optedIn: 'Opted in',
  reason: 'Reason',
  deadlineDate: 'Deadline',
  deadlineTime: 'Deadline time',
  startDate: 'Start date',
  endDate: 'End date',
  durationMonths: 'Duration',
};

function render(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'empty';
  if (Array.isArray(value)) return value.length === 0 ? 'empty' : `${value.length} item(s)`;
  if (typeof value === 'object') {
    const c = value as { amount?: number; unit?: string };
    if (typeof c.amount === 'number') {
      return c.amount ? `${c.amount} ${c.unit === 'per-month' ? '/mo' : 'LPA'}` : 'empty';
    }
    return 'changed';
  }
  const s = String(value);
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

/**
 * Which fields a restore would actually change. Shown before the user commits
 * to it — "restore" is meaningless without saying restore *what*.
 */
function diffFields(current: PlacementCompany, backup: PlacementCompany) {
  const keys = new Set([...Object.keys(current), ...Object.keys(backup)]);
  const out: { label: string; from: string; to: string }[] = [];

  for (const key of keys) {
    if (key === 'id' || key === 'panelHeights' || key === 'schedule' || key === 'notes') continue;
    const a = (current as unknown as Record<string, unknown>)[key];
    const b = (backup as unknown as Record<string, unknown>)[key];
    if (JSON.stringify(a ?? null) === JSON.stringify(b ?? null)) continue;
    out.push({
      label: FIELD_LABELS[key as keyof PlacementCompany] ?? key,
      from: render(a),
      to: render(b),
    });
  }
  return out;
}

function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCountdown(ms: number) {
  const mins = Math.ceil(ms / 60_000);
  if (mins <= 1) return 'less than a minute';
  return `${mins} minutes`;
}

export function RestoreBackupModal({ company, onRestore, onClose }: RestoreBackupModalProps) {
  const [point, setPoint] = useState<RestorePoint | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchRestorePoint(company.id)
      .then((p) => {
        if (cancelled) return;
        setPoint(p);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [company.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changes = point?.snapshot ? diffFields(company, point.snapshot) : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      <div
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overlay-soft bg-card p-6 w-[min(540px,calc(100vw-2rem))] max-h-[80vh] flex flex-col z-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">Restore from backup</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {company.name || 'This company'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto -mx-1 px-1">
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground py-6 text-center">Checking the backup…</p>
          )}

          {status === 'error' && (
            <p className="text-sm text-destructive py-6 text-center">
              Couldn&apos;t reach the backup. Your data here is unaffected.
            </p>
          )}

          {status === 'ready' && !point && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No backup for this company yet. One is written a couple of seconds after your
              next edit.
            </p>
          )}

          {status === 'ready' && point && !point.differs && (
            <div className="py-6 text-center">
              <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-foreground">Backup matches your current data.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Everything up to {formatStamp(point.committedAt)} has settled — there is nothing
                to undo.
              </p>
            </div>
          )}

          {status === 'ready' && point && point.differs && (
            <>
              <div className="rounded-xl border border-border bg-[var(--surface-2)] px-3 py-2.5">
                <p className="text-xs text-foreground">
                  Backup taken{' '}
                  <span className="font-mono">{formatStamp(point.committedAt)}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Your current data replaces it in {formatCountdown(point.commitsInMs)} unless
                  you restore first.
                </p>
              </div>

              <p className="mt-4 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                {changes.length} field{changes.length === 1 ? '' : 's'} would change back
              </p>

              <ul className="flex flex-col gap-1.5">
                {changes.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-[var(--surface-2)] px-3 py-2 text-xs"
                  >
                    <span className="w-[40%] shrink-0 truncate font-semibold text-foreground">
                      {c.label}
                    </span>
                    <span className="truncate text-muted-foreground line-through">{c.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="truncate text-foreground">{c.to}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {status === 'ready' && point?.differs && point.snapshot && (
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="pill-soft pill-soft-interactive border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onRestore(point.snapshot as PlacementCompany);
                onClose();
              }}
              className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
          </div>
        )}
      </div>
    </>
  );
}
