'use client';

import { useEffect, useState } from 'react';
import { Check, Undo2 } from 'lucide-react';
import type { StageEntry } from '@/lib/utils/storage';
import {
  PIPELINE_STAGES,
  PIPELINE_STATES,
  STAGE_COLOR_VAR,
  STATE_LABEL,
  FIRST_STAGE,
  stateColorVar,
  isRejected,
  tint,
  type PipelineStage,
  type PipelineState,
} from '@/lib/constants/placement';
import { ColorSelect, type ColorOption } from './ColorSelect';

interface StatusSelectsProps {
  history: StageEntry[];
  onChange: (stage: PipelineStage, state: PipelineState) => void;
  /**
   * Stack the two dropdowns vertically instead of side by side. Set by the
   * table when the column is too narrow to seat them in a row — squeezing them
   * horizontally truncates both labels to uselessness, whereas stacking keeps
   * each one fully readable at the cost of a taller row.
   */
  stacked?: boolean;
  activeRoundIndex?: number;
}

const AURORA = 'var(--aurora-solid)';

/**
 * The Status cell for an opted-in company: two adjacent dropdowns.
 *
 * Changing one stages a PENDING selection rather than writing to history
 * immediately. Nothing is logged until the tick is pressed, so browsing the
 * options to see what a stage looks like can't leave a trail of entries behind.
 * The undo arrow drops the pending change and snaps back to what is recorded.
 *
 * These are ColorSelect rather than native <select> because a native option
 * list is drawn by the operating system, which discards per-option colour — the
 * closed control was tinted while the list that opened from it was plain text.
 */
export function StatusSelects({ history, onChange, stacked = false, activeRoundIndex }: StatusSelectsProps) {
  const entries = Array.isArray(history) ? history : [];
  const activeIdx = typeof activeRoundIndex === 'number' && activeRoundIndex >= 0 && activeRoundIndex < entries.length
    ? activeRoundIndex
    : entries.length - 1;
  const activeEntry = entries[activeIdx] ?? null;
  const committedStage: PipelineStage = activeEntry?.stage ?? FIRST_STAGE;
  const committedState: PipelineState = activeEntry?.status ?? 'Preparing';

  const [stage, setStage] = useState<PipelineStage>(committedStage);
  const [state, setState] = useState<PipelineState>(committedState);

  // Re-sync when the record changes underneath us — a committed log entry, a
  // deleted one, or a sync landing.
  useEffect(() => {
    setStage(committedStage);
    setState(committedState);
  }, [committedStage, committedState]);

  const dirty = stage !== committedStage || state !== committedState;
  // With no history at all there is nothing recorded yet, so even the default
  // selection is worth offering to log.
  const canLog = dirty || entries.length === 0;

  const stageVar = STAGE_COLOR_VAR[stage];
  const stateVar = stateColorVar(stage, state);
  const rejected = isRejected(stage, state);

  const stageOptions: ColorOption<PipelineStage>[] = PIPELINE_STAGES.map((s) => ({
    value: s,
    label: s,
    color: `var(${STAGE_COLOR_VAR[s]})`,
  }));

  const stateOptions: ColorOption<PipelineState>[] = PIPELINE_STATES.map((s) => ({
    value: s,
    label: STATE_LABEL[s],
    color: `var(${stateColorVar(stage, s)})`,
    // Rejected carries the brand gradient rather than a flat colour.
    gradient: s === 'Rejected' ? AURORA : undefined,
  }));

  const ring = dirty ? 'ring-1 ring-primary/50' : '';

  const fill = stacked ? 'w-full' : '';

  const isUnreachedPostRejection = entries.slice(0, activeIdx).some((e) => e.status === 'Rejected');

  return (
    <div
      className={`flex min-w-0 gap-1.5 ${
        stacked ? 'flex-col items-stretch' : 'flex-wrap items-center'
      }`}
    >
      <ColorSelect
        value={stage}
        options={stageOptions}
        onChange={setStage}
        ariaLabel="Pipeline stage"
        className={`${ring} ${fill}`}
        triggerStyle={{ color: `var(${stageVar})`, backgroundColor: tint(stageVar) }}
      />

      {entries.length > 1 && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/40 border border-border/40">
          {entries.map((entry, idx) => {
            const isCurr = idx === activeIdx;
            const dotColor = `var(${stateColorVar(entry.stage, entry.status)})`;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setStage(entry.stage);
                  setState(entry.status);
                }}
                title={`Round ${idx + 1}: ${entry.stage} (${entry.status}) — Click to view NOW status`}
                className={`h-2.5 w-2.5 rounded-full transition-all border-0 outline-none ${
                  isCurr
                    ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[var(--surface-1)] scale-125 shadow-sm shadow-indigo-500/50'
                    : 'opacity-50 hover:opacity-100 hover:scale-110'
                }`}
                style={{ backgroundColor: dotColor }}
              />
            );
          })}
        </div>
      )}

      {isUnreachedPostRejection ? (
        <span className="text-[10px] font-semibold text-muted-foreground/50 bg-secondary/40 px-2 py-0.5 rounded border border-border/40 select-none">
          Not Reached
        </span>
      ) : (
        <ColorSelect
          value={state}
          options={stateOptions}
          onChange={setState}
          ariaLabel="Stage status"
          className={`${ring} ${fill}`}
          triggerStyle={
            rejected
              ? {
                  backgroundImage: 'var(--aurora-soft)',
                  backgroundSize: 'cover',
                  color: 'var(--foreground)',
                  fontWeight: 700,
                }
              : { color: `var(${stateVar})`, backgroundColor: tint(stateVar) }
          }
        />
      )}

      {canLog && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(stage, state)}
            title="Log this stage to the history"
            aria-label="Log this stage to the history"
            className="pill-soft pill-soft-interactive flex h-6 w-6 items-center justify-center bg-primary/15 text-primary"
          >
            <Check className="h-3 w-3" />
          </button>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setStage(committedStage);
                setState(committedState);
              }}
              title="Discard this change"
              aria-label="Discard this change"
              className="pill-soft pill-soft-interactive flex h-6 w-6 items-center justify-center bg-secondary/60 text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
