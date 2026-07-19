'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import { STATE_LABEL, stateColorVar } from '@/lib/constants/placement';
import { InlineEdit } from './InlineEdit';

interface CompanyDetailPanelProps {
  company: PlacementCompany;
  onFieldChange: (patch: Partial<PlacementCompany>) => void;
}

/** '2026-07-26' → '26 Jul 2026' */
function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 text-xs text-foreground">{children}</div>
    </div>
  );
}

/** Editable tag chips. Enter or + commits; × removes. */
function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    // Case-insensitive dedupe so "java" can't sit next to "Java".
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...skills, value]);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2">
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className="pill-soft inline-flex items-center gap-1 bg-secondary/60 py-0.5 pl-2 pr-1 font-mono text-[10px] text-foreground"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(skills.filter((x) => x !== s))}
                aria-label={`Remove ${s}`}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a skill…"
          aria-label="Add a skill"
          className="pill-soft min-w-0 flex-1 bg-secondary/40 px-2 py-1 font-mono text-[10px] text-foreground placeholder:text-muted-foreground sm:max-w-40"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label="Add skill"
          className="pill-soft pill-soft-interactive flex h-6 w-6 shrink-0 items-center justify-center bg-secondary/60 text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/** Notes commit on blur; see InlineEdit for why not per keystroke. */
function NotesEditor({ value, onCommit }: { value: string; onCommit: (next: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [lastSeen, setLastSeen] = useState(value);

  // Adopt external updates without interrupting typing.
  if (value !== lastSeen) {
    setLastSeen(value);
    setDraft(value);
  }

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      rows={3}
      placeholder="No notes yet."
      aria-label="Notes"
      className="card-soft w-full resize-y bg-secondary/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
    />
  );
}

export function CompanyDetailPanel({ company, onFieldChange }: CompanyDetailPanelProps) {
  // Most recent first — the log is stored oldest-first.
  const timeline = company.optedIn ? [...(company.history ?? [])].reverse() : [];
  const skills = company.skills ?? [];

  return (
    <div className="grid gap-6 px-4 py-5 sm:px-6 md:grid-cols-2">
      {/* ── Stage history ───────────────────────────────────────────────── */}
      <div className="min-w-0">
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Stage History
        </h4>

        {timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {company.optedIn ? 'No stage history yet' : 'Not applying — no stages'}
          </p>
        ) : (
          <ol className="relative flex flex-col gap-3">
            <span aria-hidden className="absolute left-[3.5px] top-1.5 bottom-1.5 w-px bg-border" />
            {timeline.map((entry, i) => {
              const color = `var(${stateColorVar(entry.stage, entry.status)})`;
              return (
                <li key={`${entry.stage}-${entry.date}-${i}`} className="relative flex gap-3">
                  <span
                    className="relative z-10 mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {entry.stage}
                      <span className="text-muted-foreground"> — </span>
                      <span style={{ color }}>{STATE_LABEL[entry.status]}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* ── Details: every field here is editable ───────────────────────── */}
      <div className="flex min-w-0 flex-col gap-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Details
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company">
            <InlineEdit
              value={company.name ?? ''}
              onCommit={(name) => onFieldChange({ name })}
              ariaLabel="Company name"
              placeholder="Company name"
            />
          </Field>

          <Field label="Role">
            <InlineEdit
              value={company.role ?? ''}
              onCommit={(role) => onFieldChange({ role })}
              ariaLabel="Role"
              placeholder="e.g. SDE"
            />
          </Field>

          <Field label="Package">
            <InlineEdit
              value={company.package ? String(company.package) : ''}
              // Blank or unparseable clears back to 0 rather than storing NaN.
              onCommit={(v) => onFieldChange({ package: Number(v) || 0 })}
              ariaLabel="Package in LPA"
              placeholder="0"
              type="number"
              mono
              suffix="LPA"
            />
          </Field>

          <Field label="Location">
            <InlineEdit
              value={company.location ?? ''}
              onCommit={(location) => onFieldChange({ location })}
              ariaLabel="Location"
              placeholder="e.g. Bangalore"
            />
          </Field>

          {company.optedIn && (
            <>
              <Field label="Deadline date">
                <input
                  type="date"
                  value={company.deadlineDate ?? ''}
                  onChange={(e) => onFieldChange({ deadlineDate: e.target.value })}
                  aria-label="Deadline date"
                  className="pill-soft w-full bg-secondary/40 px-2 py-1 font-mono text-xs text-foreground"
                />
              </Field>

              <Field label="Deadline time">
                <input
                  type="time"
                  value={company.deadlineTime ?? ''}
                  onChange={(e) => onFieldChange({ deadlineTime: e.target.value })}
                  aria-label="Deadline time"
                  className="pill-soft w-full bg-secondary/40 px-2 py-1 font-mono text-xs text-foreground"
                />
              </Field>
            </>
          )}

          <Field label="Registered">
            {!company.optedIn ? (
              <span className="text-muted-foreground">No</span>
            ) : (
              <button
                type="button"
                onClick={() => onFieldChange({ registered: !company.registered })}
                className="pill-soft pill-soft-interactive self-start bg-secondary/50 px-2 py-1 text-[11px] font-medium text-foreground"
                aria-pressed={company.registered}
              >
                {company.registered ? 'Yes' : 'Not yet'}
              </button>
            )}
          </Field>

          {/* Only meaningful when the company was skipped. */}
          {!company.optedIn && (
            <Field label="Reason for not opting in">
              <InlineEdit
                value={company.reason ?? ''}
                onCommit={(reason) => onFieldChange({ reason })}
                ariaLabel="Reason for not opting in"
                placeholder="e.g. Low package"
              />
            </Field>
          )}

          <div className="sm:col-span-2">
            <Field label="Skills Required">
              <SkillsEditor skills={skills} onChange={(s) => onFieldChange({ skills: s })} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Notes">
              <NotesEditor
                value={company.notes ?? ''}
                onCommit={(notes) => onFieldChange({ notes })}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
