"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migratePlacementCompanies = migratePlacementCompanies;
exports.needsMigration = needsMigration;
exports.monthsBetween = monthsBetween;
exports.makeRound = makeRound;
exports.orderJourney = orderJourney;
exports.currentRoundIndex = currentRoundIndex;
exports.nextCompanyId = nextCompanyId;
exports.makeStageEntry = makeStageEntry;
exports.todayISO = todayISO;
const placement_1 = require("@/lib/constants/placement");
/**
 * Converts pre-redesign placement records into the current shape.
 *
 * The old model spread progress across `currentStage` / `stageStatus` /
 * `nextEvent` / `finalResult` / `priority`; the new one keeps a single ordered
 * `history` log whose last entry IS the current status. Existing records are
 * rewritten in place on load, so nothing is lost and nothing needs a DB script.
 *
 * Must stay idempotent — it runs on every load.
 */
const LEGACY_STAGE_MAP = {
    Application: 'Resume/CGPA',
    'Waiting for Shortlist': 'Resume/CGPA',
    'Aptitude Test': 'Online Coding Round',
    'Culture Test': 'Online Coding Round',
    'Online Assessment': 'Online Coding Round',
    Hackathon: 'Online Coding Round',
    'Group Discussion': 'Group Discussion',
    'Technical Interview': 'Technical Interview',
    'HR Interview': 'HR Interview',
    Offer: 'Offer',
    Completed: 'Offer',
};
const LEGACY_STATUS_MAP = {
    'Not Applied': 'Preparing',
    Scheduled: 'Preparing',
    Completed: 'Done',
    'Awaiting Result': 'Waiting',
    Cleared: 'Done',
    Rejected: 'Rejected',
    Cancelled: 'Rejected',
};
function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
/** Splits a stored ISO datetime into the date + time pair the inputs use. */
function splitDeadline(iso) {
    if (typeof iso !== 'string' || !iso.trim())
        return { deadlineDate: '', deadlineTime: '' };
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return { deadlineDate: '', deadlineTime: '' };
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    // Midnight almost always means "date only, no time was ever set".
    return { deadlineDate: date, deadlineTime: time === '00:00' ? '' : time };
}
function isAlreadyMigrated(rec) {
    return (rec &&
        typeof rec.name === 'string' &&
        Array.isArray(rec.history) &&
        typeof rec.optedIn === 'boolean' &&
        !('company' in rec) &&
        // Post-track shape: compensation replaced the bare `package` number.
        rec.compensation != null &&
        typeof rec.year === 'string' &&
        typeof rec.kind === 'string');
}
/** Everything recorded before internships existed was a full-time placement. */
function coerceCompensation(rec) {
    const c = rec?.compensation;
    if (c && typeof c === 'object' && Number.isFinite(Number(c.amount))) {
        return {
            amount: Number(c.amount) || 0,
            unit: c.unit === 'per-month' ? 'per-month' : 'LPA',
        };
    }
    // Legacy: a bare number that always meant LPA.
    const legacy = Number(rec?.package ?? rec?.packageCTC ?? 0) || 0;
    return { amount: legacy, unit: 'LPA' };
}
function coerceYear(rec) {
    if (rec?.year === 'third' || rec?.year === 'fourth')
        return rec.year;
    // Legacy: the 29 imported internships were the 3rd-year season.
    return rec?.track === 'internship' ? 'third' : 'fourth';
}
function coerceKind(rec) {
    if (rec?.kind === 'internship' ||
        rec?.kind === 'placement' ||
        rec?.kind === 'internship_placement' ||
        rec?.kind === 'internship_ppo') {
        return rec.kind;
    }
    return rec?.track === 'internship' ? 'internship' : 'placement';
}
/**
 * Legacy `schedule` entries become ordinary journey entries. An announced round
 * is a stage the company hasn't reached yet, which is exactly 'Preparing'.
 */
function scheduleAsHistory(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((e) => e && typeof e === 'object')
        .map((e) => ({
        stage: (placement_1.PIPELINE_STAGES.includes(e.stage) ? e.stage : placement_1.FIRST_STAGE),
        status: 'Preparing',
        date: typeof e.date === 'string' ? e.date : '',
        time: typeof e.time === 'string' ? e.time : '',
        notes: typeof e.note === 'string' ? e.note : '',
    }));
}
/**
 * Journey order is by date, undated entries last — a round announced for next
 * week must not sort ahead of one that already happened just because it was
 * typed in first. Ties keep their existing relative order.
 *
 * Registration is the one exception and always sorts first. It is usually
 * undated (the old boolean field recorded that it happened, never when), and
 * the undated-last rule would otherwise push the step that necessarily comes
 * before everything else to the bottom of the list.
 */
function sortJourney(entries) {
    return [...entries].sort((a, b) => {
        const idxA = placement_1.PIPELINE_STAGES.indexOf(a.stage);
        const idxB = placement_1.PIPELINE_STAGES.indexOf(b.stage);
        return idxA - idxB;
    });
}
/** Drops entries that describe the same stage twice, keeping the richer one. */
function dedupeJourney(entries) {
    const out = [];
    for (const entry of entries) {
        const clash = out.findIndex((o) => o.stage === entry.stage);
        if (clash === -1) {
            out.push(entry);
            continue;
        }
        out[clash] = {
            ...out[clash],
            ...entry,
            notes: entry.notes?.trim() || out[clash].notes?.trim() || '',
            time: entry.time || out[clash].time || '',
            date: entry.date || out[clash].date || '',
            status: entry.status !== 'Preparing' ? entry.status : out[clash].status,
        };
    }
    return out;
}
/**
 * The old `registered` boolean becomes a Registration round at the head of the
 * journey. Registering on the company's own site is a step the user actually
 * performs, in sequence, before shortlisting — a standalone yes/no field said
 * it happened but not when, and sat outside the one timeline that tells the
 * story. Only materialised when it was true; an unregistered company simply
 * has no such round.
 */
function registrationAsHistory(rec, journey) {
    if (!rec?.registered)
        return [];
    if (journey.some((e) => e.stage === 'Registration'))
        return [];
    return [
        {
            stage: 'Registration',
            status: 'Done',
            // Undated: the old field recorded that it happened, never when.
            date: '',
            time: '',
            notes: '',
        },
    ];
}
/**
 * The journey: recorded history, plus legacy scheduled rounds and the legacy
 * `registered` flag folded in, ordered and de-duplicated.
 *
 * Also lifts a company-level note onto the first round. Notes belong to a round
 * now — "cleared the OA comfortably" means nothing detached from which round it
 * describes — and the single company note predates that, so it lands on the
 * earliest round rather than being dropped.
 */
function buildJourney(rec, fallback, companyNotes) {
    const fromHistory = Array.isArray(rec?.history)
        ? rec.history.map(coerceEntry).filter(Boolean)
        : [];
    if (fromHistory.length > 0) {
        return fromHistory;
    }
    const merged = dedupeJourney(sortJourney([...fallback, ...scheduleAsHistory(rec?.schedule)]));
    const journey = sortJourney([...registrationAsHistory(rec, merged), ...merged]);
    return journey;
}
/** Rebuilds a plausible pipeline log from the old flat fields. */
function historyFromLegacy(rec) {
    if (!rec.optedIn)
        return [];
    const stage = LEGACY_STAGE_MAP[rec.currentStage] ?? placement_1.FIRST_STAGE;
    let status = LEGACY_STATUS_MAP[rec.stageStatus] ?? 'Preparing';
    // finalResult was authoritative when set, so let it win over stageStatus.
    if (rec.finalResult === 'Rejected' || rec.finalResult === 'Withdrawn')
        status = 'Rejected';
    if (rec.finalResult === 'Selected') {
        return [{ stage: 'Offer', status: 'Done', date: todayISO() }];
    }
    const date = typeof rec.createdAt === 'string' && rec.createdAt.length >= 10
        ? rec.createdAt.slice(0, 10)
        : todayISO();
    return [{ stage, status, date }];
}
/**
 * Aliases for stage/status names that never existed in PIPELINE_STAGES but do
 * get produced — by the AI agent, by hand-written imports, by older builds.
 * Without these the entry is dropped entirely and the row loses its journey.
 */
const STAGE_ALIASES = {
    Applied: 'Resume/CGPA',
    Application: 'Resume/CGPA',
    Shortlisting: 'Resume/CGPA',
    Resume: 'Resume/CGPA',
    CGPA: 'Resume/CGPA',
    'Online Assessment': 'Online Coding Round',
    'Coding Round': 'Online Coding Round',
    'Aptitude Test': 'Online Coding Round',
    'Culture Fit': 'Online Coding Round',
    'Culture Fit Assessment': 'Online Coding Round',
    Interview: 'Technical Interview',
    Technical: 'Technical Interview',
    HR: 'HR Interview',
};
const STATUS_ALIASES = {
    Applied: 'Preparing',
    Scheduled: 'Preparing',
    Pending: 'Preparing',
    'Not Started': 'Preparing',
    'Awaiting Result': 'Waiting',
    Cleared: 'Done',
    Passed: 'Done',
    Completed: 'Done',
    Selected: 'Done',
};
/**
 * Preserves `notes` and `time`. Dropping them here silently deleted every note
 * typed into the row on the next load, because migration re-runs on every read.
 */
function coerceEntry(e) {
    if (!e || typeof e !== 'object')
        return null;
    const stage = placement_1.PIPELINE_STAGES.includes(e.stage)
        ? e.stage
        : (STAGE_ALIASES[e.stage] ?? null);
    const status = placement_1.PIPELINE_STATES.includes(e.status)
        ? e.status
        : (STATUS_ALIASES[e.status] ?? null);
    if (!stage)
        return null;
    return {
        stage,
        status: status ?? 'Preparing',
        date: typeof e.date === 'string' ? e.date : todayISO(),
        time: typeof e.time === 'string' ? e.time : '',
        notes: typeof e.notes === 'string' ? e.notes : typeof e.note === 'string' ? e.note : '',
    };
}
function migratePlacementCompanies(raw) {
    if (!Array.isArray(raw))
        return [];
    let nextId = 1;
    const usedIds = new Set();
    for (const rec of raw) {
        if (typeof rec?.id === 'number' && Number.isFinite(rec.id))
            usedIds.add(rec.id);
    }
    const takeId = () => {
        while (usedIds.has(nextId))
            nextId++;
        usedIds.add(nextId);
        return nextId;
    };
    return raw.map((rec) => {
        if (isAlreadyMigrated(rec)) {
            // Still normalise history and id — a record can be new-shape but carry a
            // string id from an interrupted migration.
            const id = typeof rec.id === 'number' && Number.isFinite(rec.id) ? rec.id : takeId();
            const history = buildJourney(rec, [], '');
            return {
                ...rec,
                id,
                year: coerceYear(rec),
                kind: coerceKind(rec),
                history,
                schedule: [],
                notes: '',
                miscellaneousNotes: typeof rec.miscellaneousNotes === 'string' ? rec.miscellaneousNotes : '',
                aboutCompany: typeof rec.aboutCompany === 'string' ? rec.aboutCompany : '',
                jobDescription: typeof rec.jobDescription === 'string' ? rec.jobDescription : '',
                registrationLink: typeof rec.registrationLink === 'string' ? rec.registrationLink : '',
            };
        }
        const { deadlineDate, deadlineTime } = splitDeadline(rec?.applicationDeadline);
        const legacyNotes = typeof rec?.notes === 'string' ? rec.notes : String(rec?.notes?.content ?? '');
        const journey = buildJourney(rec, historyFromLegacy(rec), legacyNotes);
        return {
            id: typeof rec?.id === 'number' && Number.isFinite(rec.id) ? rec.id : takeId(),
            name: String(rec?.company ?? rec?.name ?? ''),
            role: String(rec?.jobRole ?? rec?.role ?? ''),
            /**
             * Splits the old single `track` into two axes. Everything previously
             * marked 'internship' was a 3rd-year internship drive; everything else
             * was a 4th-year placement. Both are then editable independently.
             */
            year: coerceYear(rec),
            kind: coerceKind(rec),
            compensation: coerceCompensation(rec),
            startDate: typeof rec?.startDate === 'string' ? rec.startDate : '',
            endDate: typeof rec?.endDate === 'string' ? rec.endDate : '',
            durationMonths: Number(rec?.durationMonths ?? 0) || 0,
            location: String(rec?.location ?? ''),
            optedIn: Boolean(rec?.optedIn),
            registered: Boolean(rec?.registrationCompleted ?? rec?.registered),
            deadlineDate,
            deadlineTime,
            reason: String(rec?.reason ?? ''),
            skills: Array.isArray(rec?.skillsRequired)
                ? rec.skillsRequired.map(String)
                : Array.isArray(rec?.skills)
                    ? rec.skills.map(String)
                    : [],
            // Old notes were { content, lastEdited }, then a plain company-level
            // string. Both are folded into the first round by buildJourney.
            notes: '',
            aboutCompany: typeof rec?.aboutCompany === 'string' ? rec.aboutCompany : '',
            jobDescription: typeof rec?.jobDescription === 'string' ? rec.jobDescription : '',
            registrationLink: typeof rec?.registrationLink === 'string' ? rec.registrationLink : '',
            panelHeights: rec?.panelHeights && typeof rec.panelHeights === 'object' ? rec.panelHeights : undefined,
            /**
             * Carried through verbatim. This branch rebuilds the record from an
             * explicit field list, so anything omitted here is destroyed the moment
             * migration runs — and migration runs on every read. These are the
             * compensation-breakdown and miscellaneous fields the detail panel
             * writes; leaving them out is what erased a company's salary details
             * whenever a record fell back to this path.
             */
            stipendAmount: rec?.stipendAmount,
            baseSalary: rec?.baseSalary,
            joiningBonus: rec?.joiningBonus,
            relocationBonus: rec?.relocationBonus,
            ctcDetails: rec?.ctcDetails,
            miscellaneousNotes: typeof rec?.miscellaneousNotes === 'string' ? rec.miscellaneousNotes : '',
            history: journey,
            schedule: [],
        };
    });
}
/** True when migration would change the stored array (avoids pointless writes). */
function needsMigration(raw) {
    if (!Array.isArray(raw))
        return false;
    return raw.some((rec) => !isAlreadyMigrated(rec) ||
        typeof rec?.id !== 'number' ||
        !Array.isArray(rec?.schedule) ||
        // Legacy scheduled rounds still waiting to be folded into the journey.
        rec.schedule.length > 0 ||
        // A company-level note still waiting to be lifted onto its first round.
        (typeof rec?.notes === 'string' && rec.notes.trim().length > 0) ||
        // `registered` still waiting to become a Registration round.
        (rec?.registered === true &&
            !rec.history?.some?.((e) => e?.stage === 'Registration')) ||
        typeof rec?.year !== 'string' ||
        typeof rec?.kind !== 'string');
}
/** Derives months from a start/end pair; 0 when either is missing. */
function monthsBetween(startDate, endDate) {
    if (!startDate || !endDate)
        return 0;
    const a = new Date(startDate);
    const b = new Date(endDate);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()))
        return 0;
    const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    return months > 0 ? months : 0;
}
/**
 * A round added by hand from the Journey panel. It starts undated and
 * 'Preparing' — i.e. announced but not yet reached, which is exactly what an
 * upcoming round is. The user fills in the date once the company gives one.
 */
function makeRound(stage = placement_1.FIRST_STAGE) {
    return { stage, status: 'Preparing', date: '', time: '', notes: '' };
}
/** Re-sorts a journey after an edit changed a date. Exported for the panel. */
function orderJourney(entries) {
    return entries;
}
/**
 * Index of the round happening NOW, or -1 for an empty journey.
 *
 * Not simply the last entry: the journey holds announced-but-unreached rounds
 * alongside finished ones, so the newest is often something that hasn't
 * started. The current round is the latest one that has moved past 'Preparing';
 * failing that, the earliest round, i.e. whatever is up next.
 */
function currentRoundIndex(history) {
    if (!Array.isArray(history) || history.length === 0)
        return -1;
    const rejectedIdx = history.findIndex((e) => e.status === 'Rejected');
    if (rejectedIdx !== -1) {
        return rejectedIdx;
    }
    // Find the latest stage that has moved past 'Preparing'
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].status !== 'Preparing') {
            return i;
        }
    }
    // Failing that, return the first round
    return 0;
}
function nextCompanyId(companies) {
    return companies.reduce((max, c) => (c.id > max ? c.id : max), 0) + 1;
}
function makeStageEntry(stage, status, date = todayISO()) {
    return { stage, status, date, time: '', notes: '' };
}
