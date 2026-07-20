import type { PlacementCompany, StageEntry, Compensation } from '@/lib/utils/storage'
import {
  FIRST_STAGE,
  PIPELINE_STAGES,
  PIPELINE_STATES,
  type PipelineStage,
  type PipelineState,
} from '@/lib/constants/placement'

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

const LEGACY_STAGE_MAP: Record<string, PipelineStage> = {
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
}

const LEGACY_STATUS_MAP: Record<string, PipelineState> = {
  'Not Applied': 'Preparing',
  Scheduled: 'Preparing',
  Completed: 'Done',
  'Awaiting Result': 'Waiting',
  Cleared: 'Done',
  Rejected: 'Rejected',
  Cancelled: 'Rejected',
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Splits a stored ISO datetime into the date + time pair the inputs use. */
function splitDeadline(iso: unknown): { deadlineDate: string; deadlineTime: string } {
  if (typeof iso !== 'string' || !iso.trim()) return { deadlineDate: '', deadlineTime: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { deadlineDate: '', deadlineTime: '' }
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  // Midnight almost always means "date only, no time was ever set".
  return { deadlineDate: date, deadlineTime: time === '00:00' ? '' : time }
}

function isAlreadyMigrated(rec: any): boolean {
  return (
    rec &&
    typeof rec.name === 'string' &&
    Array.isArray(rec.history) &&
    typeof rec.optedIn === 'boolean' &&
    !('company' in rec) &&
    // Post-track shape: compensation replaced the bare `package` number.
    rec.compensation != null &&
    typeof rec.year === 'string' &&
    typeof rec.kind === 'string'
  )
}

/** Everything recorded before internships existed was a full-time placement. */
function coerceCompensation(rec: any): Compensation {
  const c = rec?.compensation
  if (c && typeof c === 'object' && Number.isFinite(Number(c.amount))) {
    return {
      amount: Number(c.amount) || 0,
      unit: c.unit === 'per-month' ? 'per-month' : 'LPA',
    }
  }
  // Legacy: a bare number that always meant LPA.
  const legacy = Number(rec?.package ?? rec?.packageCTC ?? 0) || 0
  return { amount: legacy, unit: 'LPA' }
}

function coerceYear(rec: any): 'third' | 'fourth' {
  if (rec?.year === 'third' || rec?.year === 'fourth') return rec.year
  // Legacy: the 29 imported internships were the 3rd-year season.
  return rec?.track === 'internship' ? 'third' : 'fourth'
}

function coerceKind(rec: any): 'placement' | 'internship' {
  if (rec?.kind === 'internship' || rec?.kind === 'placement') return rec.kind
  return rec?.track === 'internship' ? 'internship' : 'placement'
}

/**
 * Legacy `schedule` entries become ordinary journey entries. An announced round
 * is a stage the company hasn't reached yet, which is exactly 'Preparing'.
 */
function scheduleAsHistory(raw: any): StageEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      stage: (PIPELINE_STAGES.includes(e.stage) ? e.stage : FIRST_STAGE) as PipelineStage,
      status: 'Preparing' as PipelineState,
      date: typeof e.date === 'string' ? e.date : '',
      time: typeof e.time === 'string' ? e.time : '',
      notes: typeof e.note === 'string' ? e.note : '',
    }))
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
function sortJourney(entries: StageEntry[]): StageEntry[] {
  const rank = (e: StageEntry) => (e.stage === 'Registration' ? 0 : 1)
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      if (rank(a.e) !== rank(b.e)) return rank(a.e) - rank(b.e)
      if (!a.e.date && !b.e.date) return a.i - b.i
      if (!a.e.date) return 1
      if (!b.e.date) return -1
      if (a.e.date !== b.e.date) return a.e.date < b.e.date ? -1 : 1
      return a.i - b.i
    })
    .map(({ e }) => e)
}

/** Drops entries that describe the same stage twice, keeping the richer one. */
function dedupeJourney(entries: StageEntry[]): StageEntry[] {
  const out: StageEntry[] = []
  for (const entry of entries) {
    const clash = out.findIndex((o) => o.stage === entry.stage && o.date === entry.date)
    if (clash === -1) {
      out.push(entry)
      continue
    }
    out[clash] = {
      ...out[clash],
      ...entry,
      notes: entry.notes || out[clash].notes,
      time: entry.time || out[clash].time,
    }
  }
  return out
}

/**
 * The old `registered` boolean becomes a Registration round at the head of the
 * journey. Registering on the company's own site is a step the user actually
 * performs, in sequence, before shortlisting — a standalone yes/no field said
 * it happened but not when, and sat outside the one timeline that tells the
 * story. Only materialised when it was true; an unregistered company simply
 * has no such round.
 */
function registrationAsHistory(rec: any, journey: StageEntry[]): StageEntry[] {
  if (!rec?.registered) return []
  if (journey.some((e) => e.stage === 'Registration')) return []
  return [
    {
      stage: 'Registration' as PipelineStage,
      status: 'Done' as PipelineState,
      // Undated: the old field recorded that it happened, never when.
      date: '',
      time: '',
      notes: '',
    },
  ]
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
function buildJourney(rec: any, fallback: StageEntry[], companyNotes: string): StageEntry[] {
  const fromHistory = Array.isArray(rec?.history)
    ? (rec.history.map(coerceEntry).filter(Boolean) as StageEntry[])
    : []
  const base = fromHistory.length ? fromHistory : fallback
  const merged = dedupeJourney(
    sortJourney([...base, ...scheduleAsHistory(rec?.schedule)]),
  )
  const journey = sortJourney([...registrationAsHistory(rec, merged), ...merged])

  const note = (companyNotes ?? '').trim()
  if (!note || journey.length === 0) return journey
  // Only when nothing already carries it, so this can't duplicate on re-run.
  if (journey.some((e) => (e.notes ?? '').trim() === note)) return journey
  const [first, ...rest] = journey
  return [{ ...first, notes: first.notes?.trim() ? first.notes : note }, ...rest]
}


/** Rebuilds a plausible pipeline log from the old flat fields. */
function historyFromLegacy(rec: any): StageEntry[] {
  if (!rec.optedIn) return []

  const stage = LEGACY_STAGE_MAP[rec.currentStage] ?? FIRST_STAGE
  let status: PipelineState = LEGACY_STATUS_MAP[rec.stageStatus] ?? 'Preparing'

  // finalResult was authoritative when set, so let it win over stageStatus.
  if (rec.finalResult === 'Rejected' || rec.finalResult === 'Withdrawn') status = 'Rejected'
  if (rec.finalResult === 'Selected') {
    return [{ stage: 'Offer', status: 'Done', date: todayISO() }]
  }

  const date =
    typeof rec.createdAt === 'string' && rec.createdAt.length >= 10
      ? rec.createdAt.slice(0, 10)
      : todayISO()

  return [{ stage, status, date }]
}

/**
 * Aliases for stage/status names that never existed in PIPELINE_STAGES but do
 * get produced — by the AI agent, by hand-written imports, by older builds.
 * Without these the entry is dropped entirely and the row loses its journey.
 */
const STAGE_ALIASES: Record<string, PipelineStage> = {
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
}

const STATUS_ALIASES: Record<string, PipelineState> = {
  Applied: 'Preparing',
  Scheduled: 'Preparing',
  Pending: 'Preparing',
  'Not Started': 'Preparing',
  'Awaiting Result': 'Waiting',
  Cleared: 'Done',
  Passed: 'Done',
  Completed: 'Done',
  Selected: 'Done',
}

/**
 * Preserves `notes` and `time`. Dropping them here silently deleted every note
 * typed into the row on the next load, because migration re-runs on every read.
 */
function coerceEntry(e: any): StageEntry | null {
  if (!e || typeof e !== 'object') return null
  const stage = PIPELINE_STAGES.includes(e.stage)
    ? (e.stage as PipelineStage)
    : (STAGE_ALIASES[e.stage] ?? null)
  const status = PIPELINE_STATES.includes(e.status)
    ? (e.status as PipelineState)
    : (STATUS_ALIASES[e.status] ?? null)
  if (!stage) return null
  return {
    stage,
    status: status ?? 'Preparing',
    date: typeof e.date === 'string' ? e.date : todayISO(),
    time: typeof e.time === 'string' ? e.time : '',
    notes: typeof e.notes === 'string' ? e.notes : typeof e.note === 'string' ? e.note : '',
  }
}

export function migratePlacementCompanies(raw: unknown): PlacementCompany[] {
  if (!Array.isArray(raw)) return []

  let nextId = 1
  const usedIds = new Set<number>()
  for (const rec of raw as any[]) {
    if (typeof rec?.id === 'number' && Number.isFinite(rec.id)) usedIds.add(rec.id)
  }
  const takeId = () => {
    while (usedIds.has(nextId)) nextId++
    usedIds.add(nextId)
    return nextId
  }

  return (raw as any[]).map((rec) => {
    if (isAlreadyMigrated(rec)) {
      // Still normalise history and id — a record can be new-shape but carry a
      // string id from an interrupted migration.
      const id = typeof rec.id === 'number' && Number.isFinite(rec.id) ? rec.id : takeId()
      const history = buildJourney(rec, [], typeof rec.notes === 'string' ? rec.notes : '')
      return {
        ...rec,
        id,
        year: coerceYear(rec),
        kind: coerceKind(rec),
        history,
        schedule: [],
        // Consumed into the first round's notes above; the column reads the
        // CURRENT round now, so leaving a copy here would show stale text.
        notes: '',
        aboutCompany: typeof rec.aboutCompany === 'string' ? rec.aboutCompany : '',
        jobDescription: typeof rec.jobDescription === 'string' ? rec.jobDescription : '',
        registrationLink: typeof rec.registrationLink === 'string' ? rec.registrationLink : '',
      } as PlacementCompany
    }

    const { deadlineDate, deadlineTime } = splitDeadline(rec?.applicationDeadline)
    const legacyNotes =
      typeof rec?.notes === 'string' ? rec.notes : String(rec?.notes?.content ?? '')
    const journey = buildJourney(rec, historyFromLegacy(rec), legacyNotes)

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
      history: journey,
      schedule: [],
    }
  })
}

/** True when migration would change the stored array (avoids pointless writes). */
export function needsMigration(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false
  return (raw as any[]).some(
    (rec) =>
      !isAlreadyMigrated(rec) ||
      typeof rec?.id !== 'number' ||
      !Array.isArray(rec?.schedule) ||
      // Legacy scheduled rounds still waiting to be folded into the journey.
      rec.schedule.length > 0 ||
      // A company-level note still waiting to be lifted onto its first round.
      (typeof rec?.notes === 'string' && rec.notes.trim().length > 0) ||
      // `registered` still waiting to become a Registration round.
      (rec?.registered === true &&
        !(rec.history as any[])?.some?.((e) => e?.stage === 'Registration')) ||
      typeof rec?.year !== 'string' ||
      typeof rec?.kind !== 'string',
  )
}

/** Derives months from a start/end pair; 0 when either is missing. */
export function monthsBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const a = new Date(startDate)
  const b = new Date(endDate)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  return months > 0 ? months : 0
}

/**
 * A round added by hand from the Journey panel. It starts undated and
 * 'Preparing' — i.e. announced but not yet reached, which is exactly what an
 * upcoming round is. The user fills in the date once the company gives one.
 */
export function makeRound(stage: PipelineStage = FIRST_STAGE): StageEntry {
  return { stage, status: 'Preparing', date: '', time: '', notes: '' }
}

/** Re-sorts a journey after an edit changed a date. Exported for the panel. */
export function orderJourney(entries: StageEntry[]): StageEntry[] {
  return sortJourney(entries)
}

/**
 * Index of the round happening NOW, or -1 for an empty journey.
 *
 * Not simply the last entry: the journey holds announced-but-unreached rounds
 * alongside finished ones, so the newest is often something that hasn't
 * started. The current round is the latest one that has moved past 'Preparing';
 * failing that, the earliest round, i.e. whatever is up next.
 */
export function currentRoundIndex(history: StageEntry[]): number {
  if (!Array.isArray(history) || history.length === 0) return -1
  return history.length - 1
}

export function nextCompanyId(companies: PlacementCompany[]): number {
  return companies.reduce((max, c) => (c.id > max ? c.id : max), 0) + 1
}

export function makeStageEntry(
  stage: PipelineStage,
  status: PipelineState,
  date = todayISO(),
): StageEntry {
  return { stage, status, date, time: '', notes: '' }
}

export { todayISO }
