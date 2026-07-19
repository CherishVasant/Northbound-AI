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
  tint,
  type PipelineStage,
  type PipelineState,
} from '@/lib/constants/placement';

interface StatusSelectsProps {
  history: StageEntry[];
  onChange: (stage: PipelineStage, state: PipelineState) => void;
}

/**
 * The Status cell for an opted-in company: two adjacent selects.
 *
 * Changing a select stages a PENDING selection rather than writing to history
 * immediately. Nothing is logged until the tick is pressed, so browsing the
 * dropdowns to see what a stage looks like can't leave a trail of entries
 * behind. The undo arrow drops the pending change and snaps back to what is
 * actually recorded.
 */
export function StatusSelects({ history, onChange }: StatusSelectsProps) {
  const entries = Array.isArray(history) ? history : [];
  const last = entries.length ? entries[entries.length - 1] : null;
  const committedStage: PipelineStage = last?.stage ?? FIRST_STAGE;
  const committedState: PipelineState = last?.status ?? 'Preparing';

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

  const selectBase =
    'pill-soft appearance-none cursor-pointer text-[11px] font-semibold ' +
    'px-2 py-1 pr-5 leading-none focus-visible:outline-2 focus-visible:outline-offset-2';

  // Native chevron is hidden by `appearance-none`; this redraws it in the
  // current text colour so it tracks the stage/state tint.
  const chevron = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 4px center',
    backgroundSize: '11px 11px',
  } as const;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
      <select
        aria-label="Pipeline stage"
        className={`${selectBase} ${dirty ? 'ring-1 ring-primary/50' : ''}`}
        value={stage}
        onChange={(e) => setStage(e.target.value as PipelineStage)}
        style={{ color: `var(${stageVar})`, backgroundColor: tint(stageVar), ...chevron }}
      >
        {PIPELINE_STAGES.map((s) => (
          <option
            key={s}
            value={s}
            // Per-option colour so the stage stays recognisable in the open list.
            style={{ color: `var(${STAGE_COLOR_VAR[s]})`, backgroundColor: 'var(--surface)' }}
          >
            {s}
          </option>
        ))}
      </select>

      <select
        aria-label="Stage status"
        className={`${selectBase} ${dirty ? 'ring-1 ring-primary/50' : ''}`}
        value={state}
        onChange={(e) => setState(e.target.value as PipelineState)}
        style={{ color: `var(${stateVar})`, backgroundColor: tint(stateVar), ...chevron }}
      >
        {PIPELINE_STATES.map((s) => (
          <option
            key={s}
            value={s}
            style={{
              color: `var(${stateColorVar(stage, s)})`,
              backgroundColor: 'var(--surface)',
            }}
          >
            {STATE_LABEL[s]}
          </option>
        ))}
      </select>

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
