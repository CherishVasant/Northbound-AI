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

// ─── Typed enums (string unions) ────────────────────────────────────────────

export type CurrentStage =
  | 'Application'
  | 'Waiting for Shortlist'
  | 'Aptitude Test'
  | 'Culture Test'
  | 'Online Assessment'
  | 'Group Discussion'
  | 'Hackathon'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Offer'
  | 'Completed';

export const CURRENT_STAGES: CurrentStage[] = [
  'Application',
  'Waiting for Shortlist',
  'Aptitude Test',
  'Culture Test',
  'Online Assessment',
  'Group Discussion',
  'Hackathon',
  'Technical Interview',
  'HR Interview',
  'Offer',
  'Completed',
];

export type StageStatus =
  | 'Not Applied'
  | 'Scheduled'
  | 'Completed'
  | 'Awaiting Result'
  | 'Cleared'
  | 'Rejected'
  | 'Cancelled';

export const STAGE_STATUSES: StageStatus[] = [
  'Not Applied',
  'Scheduled',
  'Completed',
  'Awaiting Result',
  'Cleared',
  'Rejected',
  'Cancelled',
];

export type NextEvent =
  | 'Application Deadline'
  | 'Shortlist'
  | 'Aptitude Test'
  | 'Culture Test'
  | 'Online Assessment'
  | 'Group Discussion'
  | 'Hackathon'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Offer'
  | 'Joining'
  | 'Other';

export const NEXT_EVENTS: NextEvent[] = [
  'Application Deadline',
  'Shortlist',
  'Aptitude Test',
  'Culture Test',
  'Online Assessment',
  'Group Discussion',
  'Hackathon',
  'Technical Interview',
  'HR Interview',
  'Offer',
  'Joining',
  'Other',
];

export type Priority = 'High' | 'Medium' | 'Low';
export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export type PreparationStatus =
  | 'Not Started'
  | 'Started'
  | 'Preparing'
  | 'Revision'
  | 'Mock Test Completed'
  | 'Ready'
  | 'Completed';

export const PREPARATION_STATUSES: PreparationStatus[] = [
  'Not Started',
  'Started',
  'Preparing',
  'Revision',
  'Mock Test Completed',
  'Ready',
  'Completed',
];

export type FinalResult =
  | 'Pending'
  | 'Selected'
  | 'Rejected'
  | 'Waitlisted'
  | "Didn't Apply"
  | 'Withdrawn';

export const FINAL_RESULTS: FinalResult[] = [
  'Pending',
  'Selected',
  'Rejected',
  'Waitlisted',
  "Didn't Apply",
  'Withdrawn',
];

// ─── Badge color maps ────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<Priority, string> = {
  High:   'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
  Low:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/50',
};

export const PRIORITY_DOT: Record<Priority, string> = {
  High:   'bg-red-500',
  Medium: 'bg-amber-500',
  Low:    'bg-green-500',
};

export const STAGE_STATUS_COLORS: Record<StageStatus, string> = {
  'Not Applied':    'bg-muted text-muted-foreground border border-border',
  'Scheduled':      'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
  'Completed':      'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/50',
  'Awaiting Result':'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50',
  'Cleared':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
  'Rejected':       'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50',
  'Cancelled':      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
};

export const FINAL_RESULT_COLORS: Record<FinalResult, string> = {
  'Pending':      'bg-muted text-muted-foreground border border-border',
  'Selected':     'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
  'Rejected':     'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50',
  'Waitlisted':   'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
  "Didn't Apply": 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
  'Withdrawn':    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
};

// ─── Row highlight classes ───────────────────────────────────────────────────

export const ROW_HIGHLIGHT = {
  offer:     'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
  rejected:  'bg-red-50/50 dark:bg-red-950/15 hover:bg-red-50/80 dark:hover:bg-red-950/25',
  waiting:   'bg-blue-50/50 dark:bg-blue-950/15 hover:bg-blue-50/80 dark:hover:bg-blue-950/25',
  interview: 'bg-violet-50/50 dark:bg-violet-950/15 hover:bg-violet-50/80 dark:hover:bg-violet-950/25',
  default:   'hover:bg-muted/40 dark:hover:bg-muted/20',
} as const;

// Derive which highlight to use for a given company's stage/result
export function getRowHighlightClass(
  currentStage: CurrentStage,
  finalResult: FinalResult
): string {
  if (currentStage === 'Offer' || finalResult === 'Selected') return ROW_HIGHLIGHT.offer;
  if (finalResult === 'Rejected') return ROW_HIGHLIGHT.rejected;
  if (currentStage === 'Waiting for Shortlist') return ROW_HIGHLIGHT.waiting;
  if (
    currentStage === 'Technical Interview' ||
    currentStage === 'HR Interview' ||
    currentStage === 'Group Discussion' ||
    currentStage === 'Online Assessment' ||
    currentStage === 'Hackathon' ||
    currentStage === 'Aptitude Test' ||
    currentStage === 'Culture Test'
  ) return ROW_HIGHLIGHT.interview;
  return ROW_HIGHLIGHT.default;
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export type SortField =
  | 'serialNumber'
  | 'company'
  | 'applicationDeadline'
  | 'nextEventDateTime'
  | 'packageCTC'
  | 'priority';

export type SortDirection = 'asc' | 'desc';

export const SORT_FIELD_LABELS: Record<SortField, string> = {
  serialNumber:      'Serial #',
  company:           'Company',
  applicationDeadline: 'Application Deadline',
  nextEventDateTime: 'Next Event Date',
  packageCTC:        'Package (CTC)',
  priority:          'Priority',
};
