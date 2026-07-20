'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  CalendarClock,
  CalendarRange,
  GraduationCap,
  NotebookPen,
  Route,
  Timer,
} from 'lucide-react';
import type { PlacementCompany, ScheduledEvent } from '@/lib/utils/storage';
import {
  STATE_LABEL,
  stateColorVar,
  isRejected,
  COMPENSATION_UNITS,
  KINDS,
  YEARS,
  PIPELINE_STAGES,
  STAGE_COLOR_VAR,
  type CompensationUnit,
  type OpportunityKind,
  type OpportunityYear,
  type PipelineStage,
} from '@/lib/constants/placement';
import { makeScheduledEvent, monthsBetween } from '@/lib/utils/placementMigration';
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
  const derivedMonths = monthsBetween(company.startDate ?? '', company.endDate ?? '');

  const updateEvent = (id: string, patch: Partial<ScheduledEvent>) =>
    onFieldChange({
      schedule: (company.schedule ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });

  return (
    <div className="flex flex-col gap-3 px-3 py-4 sm:px-5">
      {/* Row 1 — where it stands, and what's due */}
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <Section icon={Route} title="Journey">
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
                const rejected = isRejected(entry.stage, entry.status);
                const isCurrent = i === 0;
                // Displayed newest-first; convert back to the stored index.
                const storedIndex = timeline.length - 1 - i;
                return (
                  <li key={`${entry.stage}-${entry.date}-${i}`} className="group/entry relative flex gap-3">
                    <span
                      className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        ...(rejected
                          ? { backgroundImage: 'var(--aurora-solid)' }
                          : { backgroundColor: color }),
                        // Only the newest entry is live; halo it so the current
                        // position is findable without reading dates.
                        boxShadow: isCurrent
                          ? `0 0 0 3px color-mix(in srgb, ${
                              rejected ? 'var(--lavender)' : color
                            } 25%, transparent)`
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
                      {rejected ? (
                        <span className="aurora-text text-[11px] font-semibold">
                          {STATE_LABEL[entry.status]}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium" style={{ color }}>
                          {STATE_LABEL[entry.status]}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatDate(entry.date)}
                        {relativeDate(entry.date) && (
                          <span className="text-muted-foreground/70">
                            {' · '}
                            {relativeDate(entry.date)}
                          </span>
                        )}
                      </span>
                      {entry.notes && (
                        <p className="mt-1 max-w-[280px] sm:max-w-md rounded bg-secondary/30 px-2 py-1 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap border-l-2 border-primary/30 font-sans">
                          {entry.notes}
                        </p>
                      )}
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

        <Section icon={CalendarRange} title="Scheduled rounds">
          {(company.schedule ?? []).length === 0 ? (
            <p className="mb-2 text-xs text-muted-foreground">
              Nothing scheduled yet. Add a round once they give you a date.
            </p>
          ) : (
            <ul className="mb-2 flex flex-col gap-2">
              {(company.schedule ?? []).map((ev) => (
                <li key={ev.id} className="flex flex-wrap items-center gap-1.5">
                  <select
                    aria-label="Stage for scheduled round"
                    value={ev.stage}
                    onChange={(e) => updateEvent(ev.id, { stage: e.target.value as PipelineStage })}
                    className="pill-soft cursor-pointer bg-secondary/40 px-1.5 py-1 text-[10px] font-semibold"
                    style={{ color: `var(${STAGE_COLOR_VAR[ev.stage]})` }}
                  >
                    {PIPELINE_STAGES.map((st) => (
                      <option key={st} value={st} style={{ color: `var(${STAGE_COLOR_VAR[st]})` }}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={ev.date}
                    onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                    aria-label="Scheduled date"
                    className="pill-soft bg-secondary/40 px-1.5 py-1 font-mono text-[10px] text-foreground"
                  />
                  <input
                    type="time"
                    value={ev.time}
                    onChange={(e) => updateEvent(ev.id, { time: e.target.value })}
                    aria-label="Scheduled time"
                    className="pill-soft bg-secondary/40 px-1.5 py-1 font-mono text-[10px] text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onFieldChange({
                        schedule: (company.schedule ?? []).filter((x) => x.id !== ev.id),
                      })
                    }
                    aria-label="Remove scheduled round"
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() =>
              onFieldChange({ schedule: [...(company.schedule ?? []), makeScheduledEvent()] })
            }
            className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-secondary/60 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add round
          </button>
        </Section>
      </div>

      {/* Row 2 — Skills and Details */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Section icon={GraduationCap} title="Skills required">
          <SkillsEditor skills={skills} onChange={(s) => onFieldChange({ skills: s })} />
        </Section>

        <Section icon={Building2} title="Details & Duration">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <InlineEdit
                value={company.location ?? ''}
                onCommit={(location) => onFieldChange({ location })}
                ariaLabel="Location"
                placeholder="e.g. Bangalore"
              />
            </Field>
            <Field label="Type">
              <select
                aria-label="Opportunity type"
                value={company.kind ?? 'placement'}
                onChange={(e) => onFieldChange({ kind: e.target.value as OpportunityKind })}
                className="pill-soft w-full cursor-pointer bg-secondary/40 px-2 py-1 text-xs text-foreground"
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            {company.optedIn ? (
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

          <div className="mt-4 border-t border-border/60 pt-4">
            <h5 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Duration
            </h5>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Start">
                <input
                  type="date"
                  value={company.startDate ?? ''}
                  onChange={(e) => onFieldChange({ startDate: e.target.value })}
                  aria-label="Start date"
                  className="pill-soft w-full bg-secondary/40 px-2 py-1 font-mono text-xs text-foreground"
                />
              </Field>
              <Field label="End">
                <input
                  type="date"
                  value={company.endDate ?? ''}
                  onChange={(e) => onFieldChange({ endDate: e.target.value })}
                  aria-label="End date"
                  className="pill-soft w-full bg-secondary/40 px-2 py-1 font-mono text-xs text-foreground"
                />
              </Field>
              <Field label="Months">
                <InlineEdit
                  value={
                    derivedMonths
                      ? String(derivedMonths)
                      : company.durationMonths
                        ? String(company.durationMonths)
                        : ''
                  }
                  onCommit={(v) => onFieldChange({ durationMonths: Number(v) || 0 })}
                  ariaLabel="Duration in months"
                  placeholder="0"
                  type="number"
                  mono
                />
              </Field>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
