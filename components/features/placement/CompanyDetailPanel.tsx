'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { X, Plus, Building2, Link as LinkIcon, Route, Sparkles, Briefcase } from 'lucide-react';
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
  tint,
  cssVar,
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
import { ToggleSwitch } from './ToggleSwitch';

interface CompanyDetailPanelProps {
  company: PlacementCompany;
  onFieldChange: (patch: Partial<PlacementCompany>) => void;
  /** Index into the stored (oldest-first) history array. */
  onDeleteHistoryEntry: (index: number) => void;
  activeRoundIndex?: number;
  onSelectRoundIndex?: (index: number) => void;
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
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-sans text-xs border"
              style={{
                backgroundColor: tint('--lavender', 12),
                borderColor: tint('--lavender', 35),
                color: cssVar('--lavender'),
              }}
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(skills.filter((x) => x !== s))}
                aria-label={`Remove ${s}`}
                className="text-muted-foreground hover:text-foreground text-[10px] font-bold cursor-pointer ml-1"
              >
                ×
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
          placeholder="Add a skill..."
          aria-label="Add a skill"
          style={{ border: '1px dashed rgba(255, 255, 255, 0.14)' }}
          className="w-full bg-[var(--surface-2)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-dim)] rounded-lg px-3 py-1.5 outline-none"
        />
      </div>
    </div>
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
  activeRoundIndex,
  onSelectRoundIndex,
}: CompanyDetailPanelProps) {
  const history = company.history ?? [];
  const timeline = company.optedIn ? history : [];
  const nowIndex = typeof activeRoundIndex === 'number' ? activeRoundIndex : currentRoundIndex(history);
  const skills = company.skills ?? [];
  const derivedMonths = monthsBetween(company.startDate ?? '', company.endDate ?? '');

  const updateRound = (index: number, patch: Partial<StageEntry>) =>
    onFieldChange({
      history: orderJourney(history.map((e, i) => (i === index ? { ...e, ...patch } : e))),
    });

  const addRound = () =>
    onFieldChange({ history: [...history, makeRound(nextStage(history))] });

  return (
    <div className="px-4 py-5 bg-[var(--surface)] rounded-b-xl border-t border-border/40 text-foreground">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        
        {/* Column 1: Journey */}
        <div className="flex flex-col gap-4 relative">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
            Journey
          </h3>

          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {company.optedIn
                ? 'No rounds yet — add one below, or set the stage in the row above.'
                : 'Not applying to this company.'}
            </p>
          ) : (
            <div className="relative flex flex-col gap-6 pl-5">
              {/* Connecting line */}
              <span aria-hidden className="absolute left-[4px] top-2 bottom-2 w-px bg-border" />
              
              {timeline.map((entry, i) => {
                const isCurrent = i === nowIndex;
                const color = `var(${stateColorVar(entry.stage, entry.status)})`;
                const rejected = isRejected(entry.stage, entry.status);
                
                return (
                  <div
                    key={`${entry.stage}-${entry.date}-${i}`}
                    className="relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-[var(--surface-2)]"
                  >
                    {/* Circle dot on the timeline line */}
                    <span
                      className="absolute left-[-21px] top-[24px] z-10 h-2 w-2 rounded-full cursor-pointer hover:scale-125 transition-transform"
                      onClick={() => onSelectRoundIndex?.(i)}
                      style={
                        rejected
                          ? { backgroundImage: 'var(--aurora-solid)' }
                          : { backgroundColor: color }
                      }
                    />

                    {/* Row 1 — Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Stage for round ${i + 1}`}
                        value={entry.stage}
                        onChange={(e) =>
                          updateRound(i, { stage: e.target.value as PipelineStage })
                        }
                        className="pill-soft cursor-pointer font-semibold px-2 py-1 text-xs rounded-md outline-none border"
                        style={{
                          backgroundColor: tint(STAGE_COLOR_VAR[entry.stage], 12),
                          borderColor: tint(STAGE_COLOR_VAR[entry.stage], 35),
                          color: cssVar(STAGE_COLOR_VAR[entry.stage]),
                        }}
                      >
                        {PIPELINE_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label={`Status for round ${i + 1}`}
                        value={entry.status}
                        onChange={(e) =>
                          updateRound(i, { status: e.target.value as PipelineState })
                        }
                        className="pill-soft cursor-pointer font-semibold px-2 py-1 text-xs rounded-md outline-none border"
                        style={
                          rejected
                            ? { backgroundImage: 'var(--aurora-soft)', color: 'var(--text)', border: 'none' }
                            : {
                                backgroundColor: tint(stateColorVar(entry.stage, entry.status), 12),
                                borderColor: tint(stateColorVar(entry.stage, entry.status), 35),
                                color: cssVar(stateColorVar(entry.stage, entry.status)),
                              }
                        }
                      >
                        {PIPELINE_STATES.map((st) => (
                          <option key={st} value={st}>
                            {STATE_LABEL[st]}
                          </option>
                        ))}
                      </select>

                      {isCurrent && (
                        <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                          NOW
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteHistoryEntry(i)}
                        title="Remove this round"
                        aria-label={`Remove ${entry.stage} round`}
                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded cursor-pointer ml-auto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Row 2 — Timing */}
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateRound(i, { date: e.target.value })}
                        aria-label={`Date for round ${i + 1}`}
                        className="pill-soft bg-[var(--surface-2)] border border-border px-2 py-1 font-mono text-xs text-[var(--text)] rounded-md outline-none"
                      />
                      <input
                        type="time"
                        value={entry.time ?? ''}
                        onChange={(e) => updateRound(i, { time: e.target.value })}
                        aria-label={`Time for round ${i + 1}`}
                        className="pill-soft bg-[var(--surface-2)] border border-border px-2 py-1 font-mono text-xs text-[var(--text)] rounded-md outline-none"
                      />
                    </div>

                    {/* Notes textarea below */}
                    <textarea
                      value={entry.notes ?? ''}
                      onChange={(e) => updateRound(i, { notes: e.target.value })}
                      placeholder="Notes for this round..."
                      aria-label={`Notes for round ${i + 1}`}
                      className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-none overflow-y-auto min-h-[50px] max-h-[100px] leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {company.optedIn && (
            <button
              type="button"
              onClick={addRound}
              style={{
                borderColor: tint('--sky', 35),
                color: cssVar('--sky'),
                borderStyle: 'dashed',
                borderWidth: '1px',
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold hover:opacity-80 cursor-pointer mt-2 bg-transparent w-full"
            >
              <Plus className="h-3 w-3" />
              Add round
            </button>
          )}
        </div>

        {/* Column 2: Role / Job Description & Skills Required */}
        <div className="flex flex-col gap-4 xl:border-x xl:border-border/50 xl:px-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Role / Job Description
            </h3>
            <textarea
              value={company.jobDescription ?? ''}
              onChange={(e) => onFieldChange({ jobDescription: e.target.value })}
              rows={8}
              placeholder="Must be comfortable working with Gen AI and Agentic AI"
              className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] leading-relaxed text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-y min-h-[120px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Skills Required
            </h3>
            <SkillsEditor skills={skills} onChange={(s) => onFieldChange({ skills: s })} />
          </div>
        </div>

        {/* Column 3: About Company, Links, Details & Duration */}
        <div className="flex flex-col gap-4 xl:pl-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              About the Company
            </h3>
            <textarea
              value={company.aboutCompany ?? ''}
              onChange={(e) => onFieldChange({ aboutCompany: e.target.value })}
              rows={3}
              placeholder="Brief description of the company..."
              className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] leading-relaxed text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-y min-h-[75px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Registration / Apply Link
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={company.registrationLink ?? ''}
                onChange={(e) => onFieldChange({ registrationLink: e.target.value })}
                placeholder="e.g. https://careers.company.com/..."
                className="flex-1 bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none"
              />
              <a
                href={
                  company.registrationLink
                    ? company.registrationLink.startsWith('http')
                      ? company.registrationLink
                      : `https://${company.registrationLink}`
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!company.registrationLink) e.preventDefault();
                }}
                style={{
                  backgroundColor: tint('--pink', 12),
                  borderColor: tint('--pink', 35),
                  color: cssVar('--pink'),
                }}
                className={`flex items-center justify-center rounded-md border px-4 text-xs font-semibold hover:opacity-85 transition-all ${
                  !company.registrationLink ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                Visit
              </a>
            </div>
          </div>

          {/* Details Card */}
          <div className="border border-border bg-[var(--surface-2)] rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Details
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  Location
                </label>
                <input
                  type="text"
                  value={company.location ?? ''}
                  onChange={(e) => onFieldChange({ location: e.target.value })}
                  placeholder="Pune / Hyderabad"
                  className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  Type
                </label>
                <select
                  value={company.kind ?? 'placement'}
                  onChange={(e) => onFieldChange({ kind: e.target.value as OpportunityKind })}
                  className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal cursor-pointer outline-none"
                >
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  Package
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={company.compensation?.amount ? String(company.compensation.amount) : ''}
                    onChange={(e) =>
                      onFieldChange({
                        compensation: {
                          amount: Number(e.target.value) || 0,
                          unit: company.compensation?.unit ?? 'LPA',
                        },
                      })
                    }
                    placeholder="50000"
                    className="flex-1 bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none min-w-0"
                  />
                  <select
                    value={company.compensation?.unit ?? 'LPA'}
                    onChange={(e) =>
                      onFieldChange({
                        compensation: {
                          amount: company.compensation?.amount ?? 0,
                          unit: e.target.value as CompensationUnit,
                        },
                      })
                    }
                    className="bg-[var(--surface-2)] border border-border rounded-lg px-2 py-1.5 text-[11px] text-[var(--text)] font-normal cursor-pointer outline-none shrink-0"
                  >
                    {COMPENSATION_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  Opted In
                </label>
                <div className="h-8 flex items-center">
                  <ToggleSwitch
                    checked={company.optedIn}
                    onChange={(optedIn) => onFieldChange({ optedIn })}
                    label=""
                  />
                </div>
              </div>

              {!company.optedIn && (
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                    Reason for not opting in
                  </label>
                  <input
                    type="text"
                    value={company.reason ?? ''}
                    onChange={(e) => onFieldChange({ reason: e.target.value })}
                    placeholder="e.g. Package below target"
                    className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Duration Card */}
          <div className="border border-border bg-[var(--surface-2)] rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              {company.kind === 'internship' ? 'Duration' : 'Joining Date'}
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  Start
                </label>
                <input
                  type="date"
                  value={company.startDate ?? ''}
                  onChange={(e) => onFieldChange({ startDate: e.target.value })}
                  className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                />
              </div>
              {company.kind === 'internship' && (
                <>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                      End
                    </label>
                    <input
                      type="date"
                      value={company.endDate ?? ''}
                      onChange={(e) => onFieldChange({ endDate: e.target.value })}
                      className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                    />
                  </div>
                  <div className="w-16 flex flex-col gap-1 shrink-0">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)] text-center">
                      Months
                    </label>
                    <input
                      type="number"
                      value={derivedMonths || company.durationMonths || ''}
                      onChange={(e) => onFieldChange({ durationMonths: Number(e.target.value) || 0 })}
                      placeholder="6"
                      className="w-full text-center bg-[var(--surface-2)] border border-border rounded-lg py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
