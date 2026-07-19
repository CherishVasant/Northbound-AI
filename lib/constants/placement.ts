// All typed enum constants for the Placement Tracker
// Import from here — never use raw strings in components

// ─── Default option lists ───────────────────────────────────────────────────

export const JOB_ROLES_DEFAULT = [
  'SDE',
  'Frontend Developer',
  'AI Engineer',
  'Data Analyst',
] as const;

export const SKILLS_DEFAULT = [
  'DSA', 'Java', 'Python', 'C++', 'SQL', 'DBMS', 'OS', 'CN', 'OOP',
  'JavaScript', 'React', 'Node.js', 'ML', 'DL', 'NLP', 'LLM',
  'AWS', 'Docker', 'Git', 'Linux',
] as const;

export const LOCATIONS_DEFAULT = [
  'Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi',
] as const;

// ─── Pipeline stages ────────────────────────────────────────────────────────
// Fixed list, in pipeline order. A company's progress is expressed purely as a
// history of (stage, state, date) entries — there is no separate current-stage
// field, and deliberately no priority concept anywhere in this feature.

export type PipelineStage =
  | 'Resume/CGPA'
  | 'Online Coding Round'
  | 'Group Discussion'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Offer';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Resume/CGPA',
  'Online Coding Round',
  'Group Discussion',
  'Technical Interview',
  'HR Interview',
  'Offer',
];

/** The stage a freshly opted-in company starts at. */
export const FIRST_STAGE: PipelineStage = 'Resume/CGPA';

/** CSS custom property holding each stage's identity colour (theme-aware). */
export const STAGE_COLOR_VAR: Record<PipelineStage, string> = {
  'Resume/CGPA': '--stage-resume',
  'Online Coding Round': '--stage-coding',
  'Group Discussion': '--stage-gd',
  'Technical Interview': '--stage-tech',
  'HR Interview': '--stage-hr',
  Offer: '--stage-offer',
};

// ─── Pipeline states ────────────────────────────────────────────────────────

export type PipelineState = 'Preparing' | 'Waiting' | 'Done' | 'Rejected';

export const PIPELINE_STATES: PipelineState[] = [
  'Preparing',
  'Waiting',
  'Done',
  'Rejected',
];

/** Stored value → label shown in the UI. */
export const STATE_LABEL: Record<PipelineState, string> = {
  Preparing: 'Preparing',
  Waiting: 'Waiting for Result',
  Done: 'Done',
  Rejected: 'Rejected',
};

const STATE_COLOR_VAR: Record<PipelineState, string> = {
  Preparing: '--state-preparing',
  Waiting: '--state-waiting',
  Done: '--state-done',
  Rejected: '--state-rejected',
};

/**
 * Colour for a (stage, state) pair. Offer + Done is the one combination that
 * overrides the state colour — it reads as "Offer Received", not merely "Done".
 */
export function stateColorVar(stage: PipelineStage, state: PipelineState): string {
  if (stage === 'Offer' && state === 'Done') return '--state-offer';
  return STATE_COLOR_VAR[state];
}

/**
 * Rejected is rendered with the brand gradient rather than a state colour.
 * Callers need to branch on it because a gradient is a background-image, not a
 * colour, so it cannot flow through the usual `var(--token)` path.
 */
export function isRejected(stage: PipelineStage, state: PipelineState): boolean {
  return state === 'Rejected';
}

/** Convenience for inline styles: `cssVar('--state-done')`. */
export function cssVar(name: string) {
  return `var(${name})`;
}

/** Soft tint of a token, matching the app's pill treatment. */
export function tint(name: string, percent = 12) {
  return `color-mix(in srgb, var(${name}) ${percent}%, transparent)`;
}

// ─── Opportunity track ──────────────────────────────────────────────────────
// Internships routinely convert to full-time offers, so this is a field on one
// shared list rather than a separate table — converting is a field change.

export type OpportunityTrack = 'placement' | 'internship';

export const TRACKS: { value: OpportunityTrack; label: string }[] = [
  { value: 'placement', label: 'Placements' },
  { value: 'internship', label: 'Internships' },
];

// ─── Compensation ───────────────────────────────────────────────────────────

export type CompensationUnit = 'LPA' | 'per-month';

export const COMPENSATION_UNITS: { value: CompensationUnit; label: string }[] = [
  { value: 'LPA', label: 'LPA' },
  { value: 'per-month', label: '/month' },
];

/**
 * Renders pay as stated, with no conversion between units.
 * `amount` is read in lakhs for LPA and in rupees for per-month, matching how
 * each is quoted.
 */
export function formatCompensation(amount: number, unit: CompensationUnit): string {
  if (!amount) return '';
  if (unit === 'LPA') return `${amount} LPA`;
  // 135000 -> "1.35L/mo"; smaller stipends stay in plain rupees.
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `${Number(lakhs.toFixed(2))}L/mo`;
  }
  return `${amount.toLocaleString('en-IN')}/mo`;
}

/** Short unit label for the inline editor's suffix. */
export function compensationSuffix(unit: CompensationUnit): string {
  return unit === 'LPA' ? 'LPA' : '/mo';
}

// ─── Filter tabs ────────────────────────────────────────────────────────────

export type OptedFilter = 'all' | 'in' | 'out';

export const OPTED_FILTERS: { value: OptedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Opted In' },
  { value: 'out', label: 'Not Opted' },
];
