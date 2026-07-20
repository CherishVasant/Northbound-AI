import type {
  PlacementCompany,
  StageEntry,
  ScheduledEvent,
  Compensation,
} from '@/lib/utils/storage'
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

function coerceSchedule(raw: any): ScheduledEvent[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e) => e && typeof e === 'object')
    .map((e, i) => ({
      id: typeof e.id === 'string' && e.id ? e.id : `evt-${i}-${e.date ?? ''}`,
      stage: PIPELINE_STAGES.includes(e.stage) ? e.stage : FIRST_STAGE,
      date: typeof e.date === 'string' ? e.date : '',
      time: typeof e.time === 'string' ? e.time : '',
      note: typeof e.note === 'string' ? e.note : '',
    }))
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

function coerceEntry(e: any): StageEntry | null {
  if (!e || typeof e !== 'object') return null
  const stage = PIPELINE_STAGES.includes(e.stage) ? (e.stage as PipelineStage) : null
  const status = PIPELINE_STATES.includes(e.status) ? (e.status as PipelineState) : null
  if (!stage || !status) return null
  return { stage, status, date: typeof e.date === 'string' ? e.date : todayISO() }
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
      return {
        ...rec,
        id,
        year: coerceYear(rec),
        kind: coerceKind(rec),
        history: (rec.history as any[]).map(coerceEntry).filter(Boolean) as StageEntry[],
        schedule: coerceSchedule(rec.schedule),
        aboutCompany: typeof rec.aboutCompany === 'string' ? rec.aboutCompany : '',
        registrationLink: typeof rec.registrationLink === 'string' ? rec.registrationLink : '',
      } as PlacementCompany
    }

    const { deadlineDate, deadlineTime } = splitDeadline(rec?.applicationDeadline)

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
      // Old notes were { content, lastEdited }; the new model is plain text.
      notes: typeof rec?.notes === 'string' ? rec.notes : String(rec?.notes?.content ?? ''),
      aboutCompany: typeof rec?.aboutCompany === 'string' ? rec.aboutCompany : '',
      registrationLink: typeof rec?.registrationLink === 'string' ? rec.registrationLink : '',
      history: Array.isArray(rec?.history) && rec.history.length
        ? (rec.history.map(coerceEntry).filter(Boolean) as StageEntry[])
        : historyFromLegacy(rec),
      schedule: coerceSchedule(rec?.schedule),
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

export function makeScheduledEvent(): ScheduledEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stage: FIRST_STAGE,
    date: '',
    time: '',
    note: '',
  }
}

export function nextCompanyId(companies: PlacementCompany[]): number {
  return companies.reduce((max, c) => (c.id > max ? c.id : max), 0) + 1
}

export function makeStageEntry(
  stage: PipelineStage,
  status: PipelineState,
  date = todayISO(),
): StageEntry {
  return { stage, status, date }
}

export { todayISO }
