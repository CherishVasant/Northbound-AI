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
  | 'Registration'
  | 'Resume/CGPA'
  | 'Online Coding Round'
  | 'Group Discussion'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Offer';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Registration',
  'Resume/CGPA',
  'Online Coding Round',
  'Group Discussion',
  'Technical Interview',
  'HR Interview',
  'Offer',
];

/**
 * The stage a freshly opted-in company starts at.
 *
 * Deliberately NOT 'Registration'. Opting in happens on the college's portal;
 * registering separately on the company's own site is a real step but not a
 * universal one. Companies that need it get a Registration round added ahead of
 * this one; companies that don't start here and never show an empty step.
 */
export const FIRST_STAGE: PipelineStage = 'Resume/CGPA';

/** CSS custom property holding each stage's identity colour (theme-aware). */
export const STAGE_COLOR_VAR: Record<PipelineStage, string> = {
  Registration: '--stage-registration',
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

// ─── Year bucket and opportunity kind ───────────────────────────────────────
// These are two independent axes. The tab is the YEAR the drive happened in;
// the KIND says whether that particular company came for a placement or an
// internship. A 4th-year internship (UBS, say) therefore belongs in the 4th
// Year tab marked as an internship — not shuffled into the 3rd Year tab.

export type OpportunityYear = 'third' | 'fourth';

export const YEARS: { value: OpportunityYear; label: string }[] = [
  { value: 'third', label: '3rd Year' },
  { value: 'fourth', label: '4th Year' },
];

export type OpportunityKind = 'placement' | 'internship';

export const KINDS: { value: OpportunityKind; label: string }[] = [
  { value: 'placement', label: 'Placement' },
  { value: 'internship', label: 'Internship' },
];

/** New entries are placements unless said otherwise. */
export const DEFAULT_KIND: OpportunityKind = 'placement';

// ─── Package ────────────────────────────────────────────────────────────────
// Called "package" everywhere the user can see it — never "compensation" or
// "salary". The stored field name stays `compensation` only because renaming it
// would invalidate every record already in localStorage and Mongo.

export type CompensationUnit = 'LPA' | 'per-month';

export const COMPENSATION_UNITS: { value: CompensationUnit; label: string }[] = [
  { value: 'LPA', label: 'LPA' },
  { value: 'per-month', label: '/month' },
];

/**
 * Renders pay as stated, with no conversion between units. `amount` is read in
 * lakhs for LPA and in rupees for per-month, matching how each is quoted.
 *
 * Six-figure monthly stipends are re-expressed in lakhs because "135000/mo"
 * takes a beat to parse and "1.35L/mo" doesn't. The number is unchanged — only
 * the scale it's written at.
 */
export function formatPackage(amount: number, unit: CompensationUnit): string {
  if (!amount) return '';
  if (unit === 'LPA') return `${Number(amount.toFixed(2))} LPA`;
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `${Number(lakhs.toFixed(2))}L/mo`;
  }
  return `${amount.toLocaleString('en-IN')}/mo`;
}

/** @deprecated Use {@link formatPackage}. */
export const formatCompensation = formatPackage;

/** Short unit label for the inline editor's suffix. */
export function packageSuffix(unit: CompensationUnit): string {
  return unit === 'LPA' ? 'LPA' : '/mo';
}

/** @deprecated Use {@link packageSuffix}. */
export const compensationSuffix = packageSuffix;

// ─── Time ───────────────────────────────────────────────────────────────────

/**
 * '14:00' → '2:00 PM'. Times are STORED 24-hour (that's what <input type=time>
 * round-trips) and DISPLAYED 12-hour, everywhere without exception.
 */
export function formatTime12h(time: string): string {
  if (!time) return '';
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ─── Filter tabs ────────────────────────────────────────────────────────────

export type OptedFilter = 'all' | 'in' | 'out';

export const OPTED_FILTERS: { value: OptedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Opted In' },
  { value: 'out', label: 'Not Opted' },
];
