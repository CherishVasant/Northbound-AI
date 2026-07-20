'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { X, Plus, Building2, Link as LinkIcon, Route, Sparkles } from 'lucide-react';
import type { PlacementCompany, StageEntry } from '@/lib/utils/storage';
import {
  STATE_LABEL,
  stateColorVar,
  isRejected,
  COMPENSATION_UNITS,
  KINDS,
  PIPELINE_STAGES,
  PIPELINE_STATES,
  STAGE_COLOR_VAR,
  formatTime12h,
  type CompensationUnit,
  type OpportunityKind,
  type PipelineStage,
  type PipelineState,
} from '@/lib/constants/placement';
import {
  makeRound,
  orderJourney,
  monthsBetween,
  currentRoundIndex,
} from '@/lib/utils/placementMigration';
import { InlineEdit } from './InlineEdit';
import { ToggleSwitch } from './ToggleSwitch';

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

/**
 * Which entry is happening NOW.
 *
 * Not simply the last one: the journey holds announced-but-unreached rounds
 * alongside finished ones, so the newest entry is often something that hasn't
 * started. The current round is the latest one that isn't still 'Preparing' —
 * failing that, the earliest 'Preparing' round, i.e. what's up next.
 */
/**
 * Notes for one round of the journey. Auto-grows so a long note is readable
 * without scrolling inside a small box, and commits on blur rather than per
 * keystroke — every commit persists and schedules a backend sync.
 */
function RoundNotes({
  value,
  onCommit,
  label,
}: {
  value: string;
  onCommit: (next: string) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(value);
  const [lastSeen, setLastSeen] = useState(value);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  if (value !== lastSeen) {
    setLastSeen(value);
    setDraft(value);
  }

  // `auto` before reading scrollHeight is what lets it shrink again:
  // scrollHeight never reports less than the element's current height.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 30)}px`;
  }, [draft]);

  return (
    <textarea
      ref={areaRef}
      rows={1}
      value={draft}
      aria-label={label}
      placeholder="Notes for this round…"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      className="mt-1 w-full resize-none overflow-hidden rounded border-l-2 border-primary/30 bg-secondary/30 px-2 py-1 font-sans text-[11px] leading-relaxed text-muted-foreground outline-none transition-colors placeholder:italic placeholder:text-muted-foreground/25 focus:bg-secondary/50 focus:text-foreground"
    />
  );
}

/** Guesses the stage a newly added round is for: the one after the furthest reached. */
function nextStage(history: StageEntry[]): PipelineStage {
  const furthest = history.reduce(
    (max, e) => Math.max(max, PIPELINE_STAGES.indexOf(e.stage)),
    -1,
  );
  return PIPELINE_STAGES[Math.min(furthest + 1, PIPELINE_STAGES.length - 1)];
}

export function CompanyDetailPanel({
  company,
  onFieldChange,
  onDeleteHistoryEntry,
}: CompanyDetailPanelProps) {
  // A company that isn't opted in has no pipeline. The log stays in storage so
  // re-opting in resumes where it left off, but it isn't shown.
  const history = company.history ?? [];
  const timeline = company.optedIn ? history : [];
  const nowIndex = currentRoundIndex(history);
  const skills = company.skills ?? [];
  const derivedMonths = monthsBetween(company.startDate ?? '', company.endDate ?? '');

  /**
   * Edits re-sort the journey, since changing a date can move a round past its
   * neighbours. Indices are therefore only valid within a single call.
   */
  const updateRound = (index: number, patch: Partial<StageEntry>) =>
    onFieldChange({
      history: orderJourney(history.map((e, i) => (i === index ? { ...e, ...patch } : e))),
    });

  const addRound = () =>
    onFieldChange({ history: [...history, makeRound(nextStage(history))] });

  return (
    <div className="px-3 py-4 sm:px-5">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {/* Column 1: Journey */}
        <div className="md:col-span-2 xl:col-span-1">
          <Section icon={Route} title="Journey">
            {timeline.length === 0 ? (
              <p className="mb-2 text-xs text-muted-foreground">
                {company.optedIn
                  ? 'No rounds yet — add one below, or set the stage in the row above.'
                  : 'Not applying to this company.'}
              </p>
            ) : (
              <ol className="relative mb-3 flex flex-col gap-3">
                <span aria-hidden className="absolute left-[4px] top-2 bottom-2 w-px bg-border" />
                {timeline.map((entry, i) => {
                  const color = `var(${stateColorVar(entry.stage, entry.status)})`;
                  const rejected = isRejected(entry.stage, entry.status);
                  const isCurrent = i === nowIndex;
                  return (
                    <li
                      key={`${entry.stage}-${entry.date}-${i}`}
                      // Rounds that aren't the live one are dimmed rather than
                      // greyed out — still fully legible, just clearly not the
                      // thing demanding attention right now.
                      className={`group/entry relative flex gap-3 transition-opacity ${
                        isCurrent ? '' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          ...(rejected
                            ? { backgroundImage: 'var(--aurora-solid)' }
                            : { backgroundColor: color }),
                          boxShadow: isCurrent
                            ? `0 0 0 3px color-mix(in srgb, ${
                                rejected ? 'var(--lavender)' : color
                              } 25%, transparent)`
                            : undefined,
                        }}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            aria-label={`Stage for round ${i + 1}`}
                            value={entry.stage}
                            onChange={(e) =>
                              updateRound(i, { stage: e.target.value as PipelineStage })
                            }
                            className="pill-soft cursor-pointer bg-secondary/40 px-1.5 py-0.5 text-[11px] font-semibold"
                            style={{ color: `var(${STAGE_COLOR_VAR[entry.stage]})` }}
                          >
                            {PIPELINE_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
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
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            aria-label={`Status for round ${i + 1}`}
                            value={entry.status}
                            onChange={(e) =>
                              updateRound(i, { status: e.target.value as PipelineState })
                            }
                            className={`pill-soft cursor-pointer bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium ${
                              rejected ? 'aurora-text' : ''
                            }`}
                            style={rejected ? undefined : { color }}
                          >
                            {PIPELINE_STATES.map((st) => (
                              <option key={st} value={st}>
                                {STATE_LABEL[st]}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => updateRound(i, { date: e.target.value })}
                            aria-label={`Date for round ${i + 1}`}
                            className="pill-soft bg-secondary/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                          />
                          <input
                            type="time"
                            value={entry.time ?? ''}
                            onChange={(e) => updateRound(i, { time: e.target.value })}
                            aria-label={`Time for round ${i + 1}`}
                            className="pill-soft bg-secondary/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                          />
                        </div>

                        <span className="font-mono text-[10px] text-muted-foreground">
                          {entry.date ? formatDate(entry.date) : 'Date to be announced'}
                          {entry.time && (
                            <span className="text-muted-foreground/70">
                              {' · '}
                              {formatTime12h(entry.time)}
                            </span>
                          )}
                          {entry.date && relativeDate(entry.date) && (
                            <span className="text-muted-foreground/70">
                              {' · '}
                              {relativeDate(entry.date)}
                            </span>
                          )}
                        </span>

                        {/* Notes belong to the round, not the company: what
                            you want to remember about the OA is different from
                            what you want to remember about the HR round. */}
                        <RoundNotes
                          value={entry.notes ?? ''}
                          onCommit={(notes) => updateRound(i, { notes })}
                          label={`Notes for the ${entry.stage} round`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteHistoryEntry(i)}
                        title="Remove this round"
                        aria-label={`Remove ${entry.stage} round`}
                        className="ml-auto mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-100 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-2 sm:opacity-0 sm:group-hover/entry:opacity-100 sm:focus-visible:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}

            {company.optedIn && (
              <button
                type="button"
                onClick={addRound}
                className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-secondary/60 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add round
              </button>
            )}
          </Section>
        </div>

        {/* Column 2: About the Company & Skills Required */}
        <div>
          <Section icon={Building2} title="About the Company">
            <textarea
              value={company.aboutCompany ?? ''}
              onChange={(e) => onFieldChange({ aboutCompany: e.target.value })}
              rows={8}
              placeholder="Brief description of the company..."
              className="pill-soft max-h-64 w-full resize-y overflow-y-auto bg-secondary/40 px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground"
            />
          </Section>

          <div className="mt-3">
            <Section icon={Building2} title="Job Description / Role">
              <textarea
                value={company.jobDescription ?? ''}
                onChange={(e) => onFieldChange({ jobDescription: e.target.value })}
                rows={6}
                placeholder="Details about the job role, responsibilities, what they will be doing..."
                className="pill-soft max-h-48 w-full resize-y overflow-y-auto bg-secondary/40 px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground"
              />
            </Section>
          </div>

          <div className="mt-3">
            <Section icon={Sparkles} title="Skills Required">
              <SkillsEditor skills={skills} onChange={(s) => onFieldChange({ skills: s })} />
            </Section>
          </div>
        </div>

        {/* Column 3: Registration Link, Details & Duration */}
        <div>
          <Section icon={LinkIcon} title="Registration / Apply Link">
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <InlineEdit
                  value={company.registrationLink ?? ''}
                  onCommit={(link) => onFieldChange({ registrationLink: link })}
                  ariaLabel="Registration link"
                  placeholder="e.g. https://careers.company.com/..."
                />
              </div>
              {company.registrationLink && (
                <a
                  href={
                    company.registrationLink.startsWith('http')
                      ? company.registrationLink
                      : `https://${company.registrationLink}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill-soft pill-soft-interactive flex items-center justify-center bg-primary/10 px-3 text-xs font-bold text-primary"
                >
                  Visit
                </a>
              )}
            </div>
          </Section>

          <div className="mt-3">
            <Section icon={Building2} title="Details">
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
                
                <Field label="Package">
                  <div className="flex items-center gap-1.5">
                    <InlineEdit
                      value={company.compensation?.amount ? String(company.compensation.amount) : ''}
                      onCommit={(v) =>
                        onFieldChange({
                          compensation: {
                            amount: Number(v) || 0,
                            unit: company.compensation?.unit ?? 'LPA',
                          },
                        })
                      }
                      ariaLabel="Package amount"
                      placeholder="0"
                      type="number"
                      mono
                    />
                    <select
                      aria-label="Package unit"
                      value={company.compensation?.unit ?? 'LPA'}
                      onChange={(e) =>
                        onFieldChange({
                          compensation: {
                            amount: company.compensation?.amount ?? 0,
                            unit: e.target.value as CompensationUnit,
                          },
                        })
                      }
                      className="pill-soft shrink-0 cursor-pointer bg-secondary/40 px-1.5 py-1 font-mono text-[10px] text-foreground"
                    >
                      {COMPENSATION_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>

                <Field label="Opted In">
                  <ToggleSwitch
                    checked={company.optedIn}
                    onChange={(optedIn) => onFieldChange({ optedIn })}
                    label={company.optedIn ? 'Opted in' : 'Not opted in'}
                  />
                </Field>

                {!company.optedIn && (
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

          <div className="mt-3">
            <Section icon={Building2} title="Duration">
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
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
