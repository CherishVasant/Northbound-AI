'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Plus, Building2, Link as LinkIcon, Route, Sparkles, Briefcase, ChevronUp, ChevronDown } from 'lucide-react';
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
import { ColorSelect, type ColorOption } from './ColorSelect';

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

function nextStage(history: StageEntry[]): PipelineStage {
  if (!history || history.length === 0) return PIPELINE_STAGES[0];
  const lastRound = history[history.length - 1];
  const lastIdx = PIPELINE_STAGES.indexOf(lastRound.stage);
  if (lastIdx === -1 || lastIdx >= PIPELINE_STAGES.length - 1) {
    return PIPELINE_STAGES[0];
  }
  return PIPELINE_STAGES[lastIdx + 1];
}

function ResizableTextarea({
  value,
  onChange,
  savedHeight,
  onHeightChange,
  placeholder,
  ariaLabel,
  rows = 4,
  minHeight = 80,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  savedHeight?: number;
  onHeightChange: (height: number) => void;
  placeholder?: string;
  ariaLabel?: string;
  rows?: number;
  minHeight?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const onHeightChangeRef = useRef(onHeightChange);
  const savedHeightRef = useRef(savedHeight);

  onHeightChangeRef.current = onHeightChange;
  savedHeightRef.current = savedHeight;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isInitial = true;

    const observer = new ResizeObserver((entries) => {
      if (isInitial) {
        isInitial = false;
        return;
      }
      const entry = entries[0];
      if (entry) {
        const height = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
        if (height && Math.abs(height - (savedHeightRef.current ?? 0)) > 2) {
          onHeightChangeRef.current(height);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      aria-label={ariaLabel}
      style={{
        height: savedHeight ? `${savedHeight}px` : undefined,
        minHeight: `${minHeight}px`,
      }}
      className={className}
    />
  );
}

function AutoExpandingTextarea({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(36, el.scrollHeight)}px`;
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={1}
      className={className}
    />
  );
}

export function CompanyDetailPanel({
  company,
  onFieldChange,
  onDeleteHistoryEntry,
  activeRoundIndex,
  onSelectRoundIndex,
}: CompanyDetailPanelProps) {
  const history = company.history ?? [];
  const timeline = history;
  const nowIndex = typeof activeRoundIndex === 'number' ? activeRoundIndex : currentRoundIndex(history);
  const skills = company.skills ?? [];
  const derivedMonths = monthsBetween(company.startDate ?? '', company.endDate ?? '');
  const [openNoteIndices, setOpenNoteIndices] = useState<Set<number>>(new Set());
  const [durationOpen, setDurationOpen] = useState(false);

  const updateHeight = (key: 'jobDescription' | 'aboutCompany' | 'miscellaneousNotes', height: number) => {
    onFieldChange({
      panelHeights: {
        ...company.panelHeights,
        [key]: height,
      },
    });
  };

  const updateRound = (index: number, patch: Partial<StageEntry>) =>
    onFieldChange({
      history: history.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    });

  const moveRoundUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index <= 0) return;
    const nextHistory = [...history];
    const temp = nextHistory[index];
    nextHistory[index] = nextHistory[index - 1];
    nextHistory[index - 1] = temp;
    onFieldChange({ history: nextHistory });
  };

  const moveRoundDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index >= history.length - 1) return;
    const nextHistory = [...history];
    const temp = nextHistory[index];
    nextHistory[index] = nextHistory[index + 1];
    nextHistory[index + 1] = temp;
    onFieldChange({ history: nextHistory });
  };

  const addRound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRound = makeRound(nextStage(history));
    onFieldChange({ optedIn: true, history: [...history, newRound] });
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="px-4 py-5 bg-[var(--surface)] rounded-b-xl border-t border-border/40 text-foreground"
    >
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        
        {/* Column 1: Journey */}
        <div className="flex flex-col gap-4 relative">
          {!company.optedIn && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                Reason for not opting in
              </label>
              <AutoExpandingTextarea
                value={company.reason ?? ''}
                onChange={(val) => onFieldChange({ reason: val, notes: val })}
                placeholder="e.g. Package below target"
                className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-2 text-[13px] text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-none overflow-hidden min-h-[36px] leading-relaxed"
              />
            </div>
          )}
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
                const isUnreachedPostRejection = timeline.slice(0, i).some((e) => e.status === 'Rejected');
                
                const stageVar = STAGE_COLOR_VAR[entry.stage];
                const stateVar = stateColorVar(entry.stage, entry.status);

                const stageOptions: ColorOption<PipelineStage>[] = PIPELINE_STAGES.map((st) => ({
                  value: st,
                  label: st,
                  color: `var(${STAGE_COLOR_VAR[st]})`,
                }));

                const stateOptions: ColorOption<PipelineState>[] = PIPELINE_STATES.map((st) => ({
                  value: st,
                  label: STATE_LABEL[st],
                  color: `var(${stateColorVar(entry.stage, st)})`,
                  gradient: st === 'Rejected' ? 'var(--aurora-solid)' : undefined,
                }));

                return (
                  <div
                    key={`${entry.stage}-${entry.date}-${i}`}
                    className={`relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-[var(--surface-2)] max-w-full overflow-hidden ${
                      isUnreachedPostRejection ? 'opacity-70' : ''
                    }`}
                  >
                    {/* Circle dot on the timeline line */}
                    <span
                      className="absolute left-[-21px] top-[24px] z-10 h-2 w-2 rounded-full cursor-pointer hover:scale-125 transition-transform"
                      onClick={() => onSelectRoundIndex?.(i)}
                      style={
                        rejected
                          ? { backgroundImage: 'var(--aurora-solid)' }
                          : isUnreachedPostRejection
                          ? { backgroundColor: 'var(--muted-foreground)' }
                          : { backgroundColor: color }
                      }
                    />

                    {/* Row 1 — Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <ColorSelect
                        value={entry.stage}
                        options={stageOptions}
                        onChange={(st) => updateRound(i, { stage: st })}
                        ariaLabel={`Stage for round ${i + 1}`}
                        triggerStyle={{
                          backgroundColor: tint(stageVar, 12),
                          borderColor: tint(stageVar, 35),
                          color: cssVar(stageVar),
                        }}
                      />

                      {isUnreachedPostRejection ? (
                        <span className="text-[10px] font-semibold text-muted-foreground/50 bg-secondary/40 px-2 py-0.5 rounded border border-border/40 select-none">
                          Not Reached
                        </span>
                      ) : (
                        <ColorSelect
                          value={entry.status}
                          options={stateOptions}
                          onChange={(st) => updateRound(i, { status: st })}
                          ariaLabel={`Status for round ${i + 1}`}
                          triggerStyle={
                            rejected
                              ? { backgroundImage: 'var(--aurora-soft)', color: 'var(--text)', border: 'none' }
                              : {
                                  backgroundColor: tint(stateVar, 12),
                                  borderColor: tint(stateVar, 35),
                                  color: cssVar(stateVar),
                                }
                          }
                        />
                      )}

                      {isCurrent && !isUnreachedPostRejection && (
                        <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                          NOW
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 ml-auto">
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => moveRoundUp(e, i)}
                          disabled={i === 0}
                          title="Move round up"
                          aria-label="Move round up"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => moveRoundDown(e, i)}
                          disabled={i === timeline.length - 1}
                          title="Move round down"
                          aria-label="Move round down"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryEntry(i);
                          }}
                          title="Remove this round"
                          aria-label={`Remove ${entry.stage} round`}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer ml-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2 — Timing & Optional Note Trigger */}
                    <div className="flex flex-wrap items-center gap-2 max-w-full overflow-hidden">
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateRound(i, { date: e.target.value })}
                        aria-label={`Date for round ${i + 1}`}
                        className="pill-soft bg-[var(--surface-2)] border border-border px-2 py-1 font-mono text-xs text-[var(--text)] rounded-md outline-none max-w-full shrink min-w-0"
                      />
                      <input
                        type="time"
                        value={entry.time ?? ''}
                        onChange={(e) => updateRound(i, { time: e.target.value })}
                        aria-label={`Time for round ${i + 1}`}
                        className="pill-soft bg-[var(--surface-2)] border border-border px-2 py-1 font-mono text-xs text-[var(--text)] rounded-md outline-none max-w-full shrink min-w-0"
                      />

                      {!Boolean(entry.notes && entry.notes.trim()) && !openNoteIndices.has(i) && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenNoteIndices((prev) => new Set([...prev, i]));
                          }}
                          title="Add note for this round"
                          className="pill-soft flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border/60 rounded-md"
                        >
                          <Plus className="h-3 w-3" />
                          Note
                        </button>
                      )}
                    </div>

                    {/* Auto-expanding notes textarea — renders only if notes exist or +Note clicked */}
                    {(Boolean(entry.notes && entry.notes.trim()) || openNoteIndices.has(i)) && (
                      <div className="relative flex items-start gap-1.5 w-full mt-1">
                        <AutoExpandingTextarea
                          value={entry.notes ?? ''}
                          onChange={(val) => updateRound(i, { notes: val })}
                          placeholder="Notes for this round..."
                          ariaLabel={`Notes for round ${i + 1}`}
                          className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none leading-relaxed resize-none overflow-hidden min-h-[38px]"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateRound(i, { notes: '' });
                            setOpenNoteIndices((prev) => {
                              const next = new Set(prev);
                              next.delete(i);
                              return next;
                            });
                          }}
                          title="Clear and remove note"
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => addRound(e)}
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
        </div>

        {/* Column 2: Job Description & Skills Required */}
        <div className="flex flex-col gap-4 xl:border-x xl:border-border/50 xl:px-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Job Description
            </h3>
            <ResizableTextarea
              value={company.jobDescription ?? ''}
              onChange={(val) => onFieldChange({ jobDescription: val })}
              savedHeight={company.panelHeights?.jobDescription}
              onHeightChange={(h) => updateHeight('jobDescription', h)}
              rows={8}
              minHeight={120}
              placeholder="Must be comfortable working with Gen AI and Agentic AI"
              className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] leading-relaxed text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-y"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Skills Required
            </h3>
            <SkillsEditor skills={skills} onChange={(s) => onFieldChange({ skills: s })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              Miscellaneous Notes
            </h3>
            <ResizableTextarea
              value={company.miscellaneousNotes ?? ''}
              onChange={(val) => onFieldChange({ miscellaneousNotes: val })}
              savedHeight={company.panelHeights?.miscellaneousNotes}
              onHeightChange={(h) => updateHeight('miscellaneousNotes', h)}
              rows={4}
              minHeight={90}
              placeholder="Any extra details, special eligibility rules, bonds, travel info, shift info, or notes that don't fit elsewhere..."
              className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] leading-relaxed text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-y"
            />
          </div>
        </div>

        {/* Column 3: About Company, Links, Details & Duration */}
        <div className="flex flex-col gap-4 xl:pl-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
              About the Company
            </h3>
            <ResizableTextarea
              value={company.aboutCompany ?? ''}
              onChange={(val) => onFieldChange({ aboutCompany: val })}
              savedHeight={company.panelHeights?.aboutCompany}
              onHeightChange={(h) => updateHeight('aboutCompany', h)}
              rows={3}
              minHeight={75}
              placeholder="Brief description of the company..."
              className="w-full bg-[var(--surface-2)] border border-border rounded-lg p-2.5 text-[13px] leading-relaxed text-[var(--text)] font-normal placeholder:text-[var(--text-dim)]/30 outline-none resize-y"
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
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                Details
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                  Opted In
                </span>
                <ToggleSwitch
                  checked={company.optedIn}
                  onChange={(optedIn) => onFieldChange({ optedIn })}
                  label=""
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 w-[140px] shrink-0">
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
              <div className="flex flex-col gap-1 flex-1 min-w-0">
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
            </div>
          </div>

          {/* Compensation Breakdown Card */}
          <div className="border border-border bg-[var(--surface-2)] rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)] flex items-center justify-between">
              <span>Compensation Breakdown</span>
              <span className="text-[9.5px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded capitalize">
                {company.kind === 'internship'
                  ? 'Internship Only'
                  : company.kind === 'internship_placement'
                  ? 'Internship + Placement'
                  : company.kind === 'internship_ppo'
                  ? 'Internship to Placement (PPO)'
                  : 'Placement Only'}
              </span>
            </h3>

            {/* General Primary Package Field (Table display) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  {company.kind === 'internship' ? 'Stipend (/month)' : 'Primary CTC / Salary'}
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={company.compensation?.amount ? String(company.compensation.amount) : ''}
                    onChange={(e) =>
                      onFieldChange({
                        compensation: {
                          amount: Number(e.target.value) || 0,
                          unit: company.compensation?.unit ?? (company.kind === 'internship' ? 'per-month' : 'LPA'),
                        },
                      })
                    }
                    placeholder={company.kind === 'internship' ? '40000' : '17.72'}
                    className="flex-1 bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none min-w-0"
                  />
                  <select
                    value={company.compensation?.unit ?? (company.kind === 'internship' ? 'per-month' : 'LPA')}
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

              {(company.kind === 'internship_placement' || company.kind === 'internship_ppo') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                    Internship Stipend
                  </label>
                  <input
                    type="number"
                    value={company.stipendAmount ? String(company.stipendAmount) : ''}
                    onChange={(e) => onFieldChange({ stipendAmount: Number(e.target.value) || 0 })}
                    placeholder="40000 (/mo)"
                    className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                  />
                </div>
              )}
            </div>

            {/* Joining Bonus & Base Salary details */}
            {(company.kind === 'placement' || company.kind === 'internship_placement' || company.kind === 'internship_ppo') && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                    Joining Bonus
                  </label>
                  <input
                    type="text"
                    value={company.joiningBonus ? String(company.joiningBonus) : ''}
                    onChange={(e) => onFieldChange({ joiningBonus: e.target.value })}
                    placeholder="e.g. ₹3 Lakhs"
                    className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                    Base Salary (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={company.baseSalary ? String(company.baseSalary) : ''}
                    onChange={(e) => onFieldChange({ baseSalary: Number(e.target.value) || 0 })}
                    placeholder="e.g. 14.72"
                    className="w-full bg-[var(--surface-2)] border border-border rounded-lg px-3 py-1.5 text-[13px] text-[var(--text)] font-normal outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Duration / Joining Date — collapsible pill */}
          {(() => {
            const hasDurationData = durationOpen || Boolean(
              (company.startDate && company.startDate.trim()) ||
              (company.endDate && company.endDate.trim()) ||
              (company.durationMonths && company.durationMonths > 0)
            );
            const durationLabel = company.kind === 'internship' ? 'Duration & Dates' : 'Joining / Start Date';

            return hasDurationData ? (
              <div className="border border-border bg-[var(--surface-2)] rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                  {durationLabel}
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
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDurationOpen(true)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="pill-soft flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border/60 rounded-xl w-fit"
              >
                <Plus className="h-3.5 w-3.5" />
                {durationLabel}
              </button>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
