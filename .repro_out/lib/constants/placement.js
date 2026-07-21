"use strict";
// All typed enum constants for the Placement Tracker
// Import from here — never use raw strings in components
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTED_FILTERS = exports.compensationSuffix = exports.formatCompensation = exports.COMPENSATION_UNITS = exports.DEFAULT_KIND = exports.KINDS = exports.YEARS = exports.STATE_LABEL = exports.PIPELINE_STATES = exports.STAGE_COLOR_VAR = exports.FIRST_STAGE = exports.PIPELINE_STAGES = exports.LOCATIONS_DEFAULT = exports.SKILLS_DEFAULT = exports.JOB_ROLES_DEFAULT = void 0;
exports.stateColorVar = stateColorVar;
exports.isRejected = isRejected;
exports.cssVar = cssVar;
exports.tint = tint;
exports.formatPackage = formatPackage;
exports.packageSuffix = packageSuffix;
exports.formatTime12h = formatTime12h;
// ─── Default option lists ───────────────────────────────────────────────────
exports.JOB_ROLES_DEFAULT = [
    'SDE',
    'Frontend Developer',
    'AI Engineer',
    'Data Analyst',
];
exports.SKILLS_DEFAULT = [
    'DSA', 'Java', 'Python', 'C++', 'SQL', 'DBMS', 'OS', 'CN', 'OOP',
    'JavaScript', 'React', 'Node.js', 'ML', 'DL', 'NLP', 'LLM',
    'AWS', 'Docker', 'Git', 'Linux',
];
exports.LOCATIONS_DEFAULT = [
    'Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi',
];
exports.PIPELINE_STAGES = [
    'Registration',
    'PPT',
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
exports.FIRST_STAGE = 'Resume/CGPA';
/** CSS custom property holding each stage's identity colour (theme-aware). */
exports.STAGE_COLOR_VAR = {
    Registration: '--stage-registration',
    PPT: '--stage-ppt',
    'Resume/CGPA': '--stage-resume',
    'Online Coding Round': '--stage-coding',
    'Group Discussion': '--stage-gd',
    'Technical Interview': '--stage-tech',
    'HR Interview': '--stage-hr',
    Offer: '--stage-offer',
};
exports.PIPELINE_STATES = [
    'Preparing',
    'Waiting',
    'Done',
    'Rejected',
];
/** Stored value → label shown in the UI. */
exports.STATE_LABEL = {
    Preparing: 'Preparing',
    Waiting: 'Waiting for Result',
    Done: 'Done',
    Rejected: 'Rejected',
};
const STATE_COLOR_VAR = {
    Preparing: '--state-preparing',
    Waiting: '--state-waiting',
    Done: '--state-done',
    Rejected: '--state-rejected',
};
/**
 * Colour for a (stage, state) pair. Offer + Done is the one combination that
 * overrides the state colour — it reads as "Offer Received", not merely "Done".
 */
function stateColorVar(stage, state) {
    if (stage === 'Offer' && state === 'Done')
        return '--state-offer';
    return STATE_COLOR_VAR[state];
}
/**
 * Rejected is rendered with the brand gradient rather than a state colour.
 * Callers need to branch on it because a gradient is a background-image, not a
 * colour, so it cannot flow through the usual `var(--token)` path.
 */
function isRejected(stage, state) {
    return state === 'Rejected';
}
/** Convenience for inline styles: `cssVar('--state-done')`. */
function cssVar(name) {
    return `var(${name})`;
}
/** Soft tint of a token, matching the app's pill treatment. */
function tint(name, percent = 12) {
    return `color-mix(in srgb, var(${name}) ${percent}%, transparent)`;
}
exports.YEARS = [
    { value: 'third', label: '3rd Year' },
    { value: 'fourth', label: '4th Year' },
];
exports.KINDS = [
    { value: 'placement', label: 'Placement' },
    { value: 'internship', label: 'Internship' },
    { value: 'internship_placement', label: 'Internship + Placement' },
    { value: 'internship_ppo', label: 'Internship to Placement (PPO)' },
];
/** New entries are placements unless said otherwise. */
exports.DEFAULT_KIND = 'placement';
exports.COMPENSATION_UNITS = [
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
function formatPackage(amount, unit) {
    if (!amount)
        return '';
    if (unit === 'LPA')
        return `${Number(amount.toFixed(2))} LPA`;
    if (amount >= 100000) {
        const lakhs = amount / 100000;
        return `${Number(lakhs.toFixed(2))}L/mo`;
    }
    return `${amount.toLocaleString('en-IN')}/mo`;
}
/** @deprecated Use {@link formatPackage}. */
exports.formatCompensation = formatPackage;
/** Short unit label for the inline editor's suffix. */
function packageSuffix(unit) {
    return unit === 'LPA' ? 'LPA' : '/mo';
}
/** @deprecated Use {@link packageSuffix}. */
exports.compensationSuffix = packageSuffix;
// ─── Time ───────────────────────────────────────────────────────────────────
/**
 * '14:00' → '2:00 PM'. Times are STORED 24-hour (that's what <input type=time>
 * round-trips) and DISPLAYED 12-hour, everywhere without exception.
 */
function formatTime12h(time) {
    if (!time)
        return '';
    const [hRaw, mRaw] = time.split(':');
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(h) || !Number.isFinite(m))
        return time;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}
exports.OPTED_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'in', label: 'Opted In' },
    { value: 'out', label: 'Not Opted' },
];
