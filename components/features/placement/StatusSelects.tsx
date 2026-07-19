'use client';

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
 * The Status cell for an opted-in company: two adjacent selects driven entirely
 * by the last history entry. This is the only way status is ever edited — there
 * is no separate edit mode or dialog.
 */
export function StatusSelects({ history, onChange }: StatusSelectsProps) {
  const entries = Array.isArray(history) ? history : [];
  const last = entries.length ? entries[entries.length - 1] : null;
  const stage: PipelineStage = last?.stage ?? FIRST_STAGE;
  const state: PipelineState = last?.status ?? 'Preparing';

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
        className={selectBase}
        value={stage}
        onChange={(e) => onChange(e.target.value as PipelineStage, state)}
        style={{
          color: `var(${stageVar})`,
          backgroundColor: tint(stageVar),
          ...chevron,
        }}
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
        className={selectBase}
        value={state}
        onChange={(e) => onChange(stage, e.target.value as PipelineState)}
        style={{
          color: `var(${stateVar})`,
          backgroundColor: tint(stateVar),
          ...chevron,
        }}
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
    </div>
  );
}
