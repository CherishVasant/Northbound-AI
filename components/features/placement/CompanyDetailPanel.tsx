'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  CalendarClock,
  GraduationCap,
  NotebookPen,
  Route,
} from 'lucide-react';
import type { PlacementCompany } from '@/lib/utils/storage';
import { STATE_LABEL, stateColorVar } from '@/lib/constants/placement';
import { InlineEdit } from './InlineEdit';

interface CompanyDetailPanelProps {
  company: PlacementCompany;
  onFieldChange: (patch: Partial<PlacementCompany>) => void;
  /** Index into the stored (oldest-first) history array. */
  onDeleteHistoryEntry: (index: number) => void;
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

/** "today", "3 days ago", "2 wks ago" — orients the timeline at a glance. */
function relativeDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - then.getTime()) /
      86_400_000,
  );
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 0) return `in ${Math.abs(days)}d`;
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} wks ago`;
  return `${Math.round(days / 30)} mo ago`;
}

/** A titled block, so the panel reads as grouped sections rather than one grid. */
function Section({
  icon: Icon,
  title,
  children,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-soft bg-card/60 p-4 ${className}`}>
      <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {title}
      </h4>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
        {label}
      </span>
      <div className="min-w-0 text-xs text-foreground">{children}</div>
    </div>
  );
}

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
          className="pill-soft min-w-0 flex-1 bg-secondary/40 px-2 py-1 font-mono text-[10px] text-foreground placeholder:text-muted-foreground"
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
      rows={4}
      placeholder="Interview feedback, referrals, prep reminders…"
      aria-label="Notes"
      className="pill-soft w-full resize-y bg-secondary/40 px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground"
    />
  );
}

export function CompanyDetailPanel({
  company,
  onFieldChange,
  onDeleteHistoryEntry,
}: CompanyDetailPanelProps) {
  // A company that isn't opted in has no pipeline. The log stays in storage so
  // re-opting in resumes where it left off, but it isn't shown.
  const timeline = company.optedIn ? [...(company.history ?? [])].reverse() : [];
  const skills = company.skills ?? [];

  return (
    <div className="flex flex-col gap-3 px-3 py-4 sm:px-5">
      {/* Row 1 — where it stands, and what's due */}
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <Section icon={Route} title="Pipeline">
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {company.optedIn
                ? 'No stages recorded yet — set the stage and state in the row above.'
                : 'Not applying to this company.'}
            </p>
          ) : (
            <ol className="relative flex flex-col gap-3">
              <span aria-hidden className="absolute left-[4px] top-2 bottom-2 w-px bg-border" />
              {timeline.map((entry, i) => {
                const color = `var(${stateColorVar(entry.stage, entry.status)})`;
                const isCurrent = i === 0;
                // Displayed newest-first; convert back to the stored index.
                const storedIndex = timeline.length - 1 - i;
                return (
                  <li key={`${entry.stage}-${entry.date}-${i}`} className="group/entry relative flex gap-3">
                    <span
                      className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: color,
                        // Only the newest entry is live; halo it so the current
                        // position is findable without reading dates.
                        boxShadow: isCurrent
                          ? `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)`
                          : undefined,
                      }}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5 pb-0.5">
                      <span className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-foreground">
                        {entry.stage}
                        {isCurrent && (
                          <span
                            className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide"
                            style={{
                              color,
                              backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                            }}
                          >
                            now
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color }}>
                        {STATE_LABEL[entry.status]}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatDate(entry.date)}
                        {relativeDate(entry.date) && (
                          <span className="text-muted-foreground/70">
                            {' · '}
                            {relativeDate(entry.date)}
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteHistoryEntry(storedIndex)}
                      title="Remove this entry"
                      aria-label={`Remove ${entry.stage} entry`}
                      className="ml-auto mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-100 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-2 sm:opacity-0 sm:group-hover/entry:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </Section>

        <Section icon={CalendarClock} title="Application">
          <div className="grid grid-cols-2 gap-3">
            {company.optedIn ? (
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
                <Field label="Registered">
                  <button
                    type="button"
                    onClick={() => onFieldChange({ registered: !company.registered })}
                    aria-pressed={company.registered}
                    className="pill-soft pill-soft-interactive w-full bg-secondary/50 px-2 py-1 text-[11px] font-medium text-foreground"
                  >
                    {company.registered ? 'Yes' : 'Not yet'}
                  </button>
                </Field>
              </>
            ) : (
              <div className="col-span-2">
                <Field label="Reason for not opting in">
                  <InlineEdit
                    value={company.reason ?? ''}
                    onCommit={(reason) => onFieldChange({ reason })}
                    ariaLabel="Reason for not opting in"
                    placeholder="e.g. Package below target"
                  />
                </Field>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Row 2 — the company's own facts */}
      <Section icon={Building2} title="Company details">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
          <Field label="Package (LPA)">
            <InlineEdit
              value={company.package ? String(company.package) : ''}
              // Blank or unparseable clears to 0 rather than storing NaN.
              onCommit={(v) => onFieldChange({ package: Number(v) || 0 })}
              ariaLabel="Package in LPA"
              placeholder="0"
              type="number"
              mono
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
        </div>
      </Section>

      {/* Row 3 — preparation */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Section icon={GraduationCap} title="Skills required">
          <SkillsEditor skills={skills} onChange={(s) => onFieldChange({ skills: s })} />
        </Section>

        <Section icon={NotebookPen} title="Notes">
          <NotesEditor value={company.notes ?? ''} onCommit={(notes) => onFieldChange({ notes })} />
        </Section>
      </div>
    </div>
  );
}
