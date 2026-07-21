import type { PlacementCompany, StageEntry, Compensation } from '@/lib/utils/storage'
import {
  FIRST_STAGE,
  PIPELINE_STAGES,
  PIPELINE_STATES,
  type PipelineStage,
  type PipelineState,
  type OpportunityKind,
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

function coerceKind(rec: any): OpportunityKind {
  if (
    rec?.kind === 'internship' ||
    rec?.kind === 'placement' ||
    rec?.kind === 'internship_placement' ||
    rec?.kind === 'internship_ppo'
  ) {
    return rec.kind;
  }
  return rec?.track === 'internship' ? 'internship' : 'placement';
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
  return [...entries].sort((a, b) => {
    const idxA = PIPELINE_STAGES.indexOf(a.stage);
    const idxB = PIPELINE_STAGES.indexOf(b.stage);
    return idxA - idxB;
  });
}

/** Drops entries that describe the same stage twice, keeping the richer one. */
function dedupeJourney(entries: StageEntry[]): StageEntry[] {
  const out: StageEntry[] = []
  for (const entry of entries) {
    const clash = out.findIndex((o) => o.stage === entry.stage)
    if (clash === -1) {
      out.push(entry)
      continue
    }
    out[clash] = {
      ...out[clash],
      ...entry,
      notes: entry.notes?.trim() || out[clash].notes?.trim() || '',
      time: entry.time || out[clash].time || '',
      date: entry.date || out[clash].date || '',
      status: entry.status !== 'Preparing' ? entry.status : out[clash].status,
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
  if (fromHistory.length > 0) {
    return fromHistory
  }
  const merged = dedupeJourney(
    sortJourney([...fallback, ...scheduleAsHistory(rec?.schedule)]),
  )
  const journey = sortJourney([...registrationAsHistory(rec, merged), ...merged])
  return journey
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

export const DEFAULT_PLACEMENT_SEED: PlacementCompany[] = [
  {
    id: 101,
    name: 'Pixel Compute Technologies Pvt Ltd',
    role: 'Full-Stack Developer',
    year: 'fourth',
    kind: 'internship_placement',
    compensation: { amount: 20, unit: 'LPA' },
    stipendAmount: 42000,
    baseSalary: 10,
    joiningBonus: 0,
    ctcDetails: 'Fixed CTC: ₹10 LPA + Retention Bonus: ₹10 Lakh over 3 years (Yr 1: ₹2L, Yr 2: ₹3L, Yr 3: ₹5L). Internship Stipend: ₹42,000/month.',
    startDate: '',
    endDate: '',
    durationMonths: 6,
    location: 'Infocity, Patia, Bhubaneswar, Odisha',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-17',
    deadlineTime: '09:00',
    reason: '',
    skills: ['HTML', 'CSS', 'JavaScript', 'ReactJS', 'Ruby', 'Ruby on Rails', 'Full-Stack Development'],
    aboutCompany: 'PixelCompute is a technology company focused on building high-quality, real-world software products, backed by BigBinary (Miami & Pune consultancy with 14+ years Rails experience).',
    jobDescription: '• Role: Full-Stack Developer (6-month full-time internship + conversion to full-time role)\n• Location: SRB Tower, 2nd Floor, Infocity, Patia, Bhubaneswar, Odisha (Work from office)\n• Internship Stipend: ₹42,000 per month during 6-month training\n• Full-Time CTC: Fixed ₹10 LPA + ₹10 Lakh Retention Bonus over 3 years (Yr 1: ₹2L, Yr 2: ₹3L, Yr 3: ₹5L) Total CTC: ₹20 LPA\n• Eligibility: 2027 Batch B.Tech CSE/IT/CS/CE with 80% or 8.0 CGPA in 10th, 12th & B.Tech, with no active backlogs\n• Technical Requirements: HTML, CSS, JavaScript, ReactJS, and willingness to learn Ruby and Ruby on Rails\n• Service Bond: No service bond',
    registrationLink: 'http://www.pixelcompute.com',
    notes: '- Super Dream Offer (₹20 LPA total CTC)\n- 6-month internship at ₹42,000/month stipend leading to Full-Time Full-Stack Developer\n- Fixed Salary: ₹10 LPA, Retention Bonus: ₹10 Lakh over 3 years (Yr 1: ₹2L, Yr 2: ₹3L, Yr 3: ₹5L)\n- Work Mode: On-site at Bhubaneswar office (No hybrid/remote)\n- No service bond',
    miscellaneousNotes: '- Backed by BigBinary (Miami & Pune)\n- Registration Deadline: 17th July 2026 (9:00 AM)\n- Minimum 80% / 8.0 CGPA in 10th, 12th, and B.Tech',
    history: [
      { stage: 'Registration', status: 'Done', date: '2026-07-16', time: '09:00', notes: 'Last date for registration: 17th July 2026 (9:00 AM)' },
      { stage: 'Pre-Placement Talk', status: 'Scheduled', date: '2026-07-22', time: '08:30 AM', notes: 'Pre-Placement Talk (PPT) | Duration: 60 mins | Venue: MG Auditorium' },
      { stage: 'Online Coding Round', status: 'Scheduled', date: '2026-07-22', time: '10:00 AM', notes: 'Online Assessment | Duration: 120 mins | Venue: AB2-602' }
    ],
    schedule: [
      { id: 'pixel-ppt', title: 'Pixel Compute PPT', date: '2026-07-22', time: '08:30 AM', location: 'MG Auditorium' },
      { id: 'pixel-test', title: 'Pixel Compute Online Assessment', date: '2026-07-22', time: '10:00 AM', location: 'AB2-602' }
    ],
  },
  {
    id: 102,
    name: 'Eternal (Zomato)',
    role: 'Software Development Engineer',
    year: 'fourth',
    kind: 'internship_placement',
    compensation: { amount: 59, unit: 'LPA' },
    stipendAmount: 100000,
    baseSalary: 24,
    joiningBonus: 500000,
    ctcDetails: '₹59 LPA CTC (₹24L Fixed + ₹35L Bonus over 4 years: 1st yr ₹5L, 2nd yr ₹10L, 3rd yr ₹10L, 4th yr ₹10L). Internship Stipend: ₹1L / month.',
    startDate: '',
    endDate: '',
    durationMonths: 6,
    location: 'Gurugram',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-20',
    deadlineTime: '08:00',
    reason: '',
    skills: ['Data Structures', 'Algorithms', 'Software Development', 'System Design', 'Problem Solving'],
    aboutCompany: 'Eternal (Zomato) is a technology corporation comprising Zomato, Blinkit, District, and Hyperpure.',
    jobDescription: '• Role: Software Development Engineer (SDE)\n• Super Dream Placement / Internship for 2027 Batch (All B.Tech branches eligible)\n• Date of Visit / Assessment: 27-07-2026 (Online mode)\n• CTC: ₹59 LPA (₹24L Fixed + ₹35L Bonus over 4 years: 1st yr ₹5L, 2nd yr ₹10L, 3rd yr ₹10L, 4th yr ₹10L)\n• Internship Stipend: ₹1,00,000 per month (₹1L/month)\n• Eligibility: 70% / 7.0 CGPA in 10th, 12th & B.Tech, with no standing arrears. Open to all B.Tech branches.\n• Registration: NEOPAT portal on or before 20-07-2026 (8:00 AM)',
    registrationLink: 'http://www.eternal.com',
    notes: '- Super Dream Offer (₹59 LPA total CTC)\n- Fixed Salary: ₹24 LPA, Bonus: ₹35 LPA over 4 years (Year 1: ₹5L, Year 2: ₹10L, Year 3: ₹10L, Year 4: ₹10L)\n- Internship Stipend: ₹1L per month\n- Online Assessment Date: 27th July 2026\n- Registration on NEOPAT portal by 20th July 2026 (8:00 AM)',
    miscellaneousNotes: '- Eligible: All B.Tech branches with minimum 70% / 7.0 CGPA and no standing arrears.\n- Job Location: Gurugram',
    history: [
      { stage: 'Registration', status: 'Preparing', date: '2026-07-17', time: '08:00', notes: 'Last date for registration on NEOPAT portal: 20-07-2026 (8.00 am)' },
      { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-27', time: '', notes: 'Date of Visit: 27-07-2026 (Online mode)' }
    ],
    schedule: [],
  },
  {
    id: 103,
    name: 'Infosys',
    role: 'Specialist Programmer / Digital Specialist Engineer',
    year: 'fourth',
    kind: 'placement',
    compensation: { amount: 21, unit: 'LPA' },
    stipendAmount: 0,
    baseSalary: 21,
    joiningBonus: 0,
    ctcDetails: 'Specialist Programmer (21 LPA / 16 LPA) & Digital Specialist Engineer (10 LPA)',
    startDate: '',
    endDate: '',
    durationMonths: 0,
    location: 'Pan India',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-02',
    deadlineTime: '',
    reason: '',
    skills: ['Java', 'Python', 'C++', 'Data Structures', 'Algorithms', 'System Design', 'DBMS', 'Object Oriented Programming'],
    aboutCompany: 'Infosys is a global leader in next-generation AI-first digital services and consulting with 300k+ employees worldwide.',
    jobDescription: '• Roles Offered: Specialist Programmer (Trainee - ₹21 LPA & ₹16 LPA) and Digital Specialist Engineer (Trainee - ₹10 LPA)\n• Graduation Batch: July 2027 Batch\n• Assessment Format: 3-Hour Programming Assessment focusing on advanced algorithms, complex problem solving, and data structures.\n• Eligibility: Minimum 60% in 10th & 12th, 6.0 CGPA / 60% in B.Tech with no active arrears.\n• Verification Requirement: Original physical Govt ID proof and College ID card strictly required for exam hall entry.',
    registrationLink: 'https://careers.infosys.com',
    notes: '- Hiring Bands: Specialist Programmer (₹21 LPA & ₹16 LPA) | Digital Specialist Engineer (₹10 LPA)\n- 3-hour programming assessment format\n- MANDATORY VERIFICATION: Must bring original Govt ID proof (Aadhaar, PAN card, Passport) & College ID without fail. No xerox or digital proof (phone/DigiLocker) allowed.',
    miscellaneousNotes: 'Salary bands: INR 21 LPA, 16 LPA, and 10 LPA.\nVerification Rule: Original Govt ID & College ID required on-site. Xerox or digital proof strictly forbidden.',
    history: [
      { stage: 'Resume/CGPA', status: 'Done', date: '2026-07-10', time: '', notes: 'Nomination and shortlisting completed' },
      { stage: 'Online Coding Round', status: 'Scheduled', date: '2026-07-23', time: 'Slot 2', notes: 'Infosys Online Test | Slot 2 | Location: AB2 502. MANDATORY: Original Govt ID proof (Aadhaar, PAN card, etc.) & College ID without fail. No xerox or digital proof.' }
    ],
    schedule: [
      { id: 'infosys-test', title: 'Infosys Online Test', date: '2026-07-23', time: 'Slot 2', location: 'AB2 502' }
    ],
  },
  {
    id: 104,
    name: 'ION Group',
    role: 'Software Developer / Technical Product Analyst',
    year: 'fourth',
    kind: 'internship_placement',
    compensation: { amount: 17.3, unit: 'LPA' },
    stipendAmount: 0,
    baseSalary: 15,
    joiningBonus: 0,
    ctcDetails: 'CTC: ₹17.3 LPA (₹15 LPA Fixed). Super Dream Offer.',
    startDate: '',
    endDate: '',
    durationMonths: 6,
    location: 'Noida',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-15',
    deadlineTime: '19:00',
    reason: '',
    skills: ['Data Analytics', 'AI & Automation', 'Product Analysis', 'Data Engineering', 'Python', 'SQL', 'ReactJS', 'Data Visualization', 'Machine Learning', 'Financial Technology'],
    aboutCompany: 'ION Group (founded 1999) is a global financial technology leader providing trading, workflow automation, high-value analytics, and strategic consulting to Tier 1 banks, central banks, and Fortune 100 corporations worldwide.',
    jobDescription: '• Roles Offered: Software Developer & Technical Product Analyst (candidates can apply for any one role)\n• Role Overview (Technical Product Analyst):\n  - Work at the intersection of Product, Data, AI, and Business Operations for Tier 1 banks & Fortune 100 global corporations.\n  - Transform data into insights, customer challenges into product opportunities, and ideas into measurable outcomes.\n  - Build dashboards, scalable analytics solutions, and data pipelines.\n  - Identify opportunities for AI-driven innovation, automation, and process optimization.\n• Category: Super Dream Offer (Internship + Full Time)\n• CTC Structure: Total ₹17.3 LPA (Fixed Base: ₹15 LPA)\n• Eligibility: 2027 Batch B.Tech CSE (all branches), B.Tech IT, B.Tech ECE (all branches). Minimum 80% / 8.0 CGPA in 10th, 12th & B.Tech, with no standing arrears.\n• Hiring Process:\n  - Round 1 & 2: Conducted Online (Online Assessment & Technical Interviews)\n  - Final Rounds (ION Day): In-person interviews at ION’s Noida Office\n• Registration Requirement: Must register on both Neo PAT portal and ION application link by 15-07-2026 (7:00 PM) using registered college email ID.',
    registrationLink: 'http://www.iongroup.com',
    notes: '- Super Dream Offer (₹17.3 LPA CTC, ₹15 LPA Fixed Base)\n- Two Role Tracks: Software Developer & Technical Product Analyst\n- Eligible Branches: B.Tech CSE, IT, ECE (80% / 8.0 CGPA, No Standing Arrears)\n- Hiring Process: Online Assessment -> Online Tech Rounds -> Final ION Day at Noida Office\n- Registration: Dual registration on Neo PAT & ION portal using registered college email ID\n- Deadline: 15th July 2026 (7:00 PM)',
    miscellaneousNotes: '- Final rounds conducted in-person at ION Noida Office (ION Day).\n- Must use registered college email ID for ION application link.',
    history: [
      { stage: 'Registration', status: 'Preparing', date: '2026-07-14', time: '19:00', notes: 'Last date for registration on Neo PAT & ION link: 15-07-2026 7:00 PM' },
      { stage: 'Online Coding Round', status: 'Preparing', date: '', time: '', notes: 'Round 1 & 2 conducted online' },
      { stage: 'Technical Interview', status: 'Preparing', date: '', time: '', notes: 'Final Rounds (ION Day) at ION Noida Office' }
    ],
    schedule: [],
  },
  {
    id: 105,
    name: 'Juspay',
    role: 'Software Development Engineer',
    year: 'fourth',
    kind: 'internship_ppo',
    compensation: { amount: 27, unit: 'LPA' },
    stipendAmount: 40000,
    baseSalary: 27,
    joiningBonus: 0,
    ctcDetails: 'CTC: ₹27.0 LPA. Internship Stipend: ₹40,000 / month (1-year internship starting August).',
    startDate: '2026-08-01',
    endDate: '',
    durationMonths: 12,
    location: 'Bangalore',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-17',
    deadlineTime: '12:00',
    reason: '',
    skills: ['Data Structures', 'Algorithms', 'Computer Science Fundamentals', 'System Architecture', 'High Throughput Systems', 'Concurrency', 'Functional Programming', 'C++', 'Java', 'Python'],
    aboutCompany: 'Juspay is a leading multinational payments technology company processing over 300 million daily transactions exceeding $1 trillion annualized TPV with 99.999% reliability for 500+ global enterprises and banks.',
    jobDescription: '• Role: Software Development Engineer (SDE)\n• Category: Super Dream Internship / PPO (1-year internship starting August 2026 for students with no pending credits)\n• Compensation: Total CTC ₹27.0 LPA | Internship Stipend: ₹40,000 / month\n• Eligibility Criteria:\n  - 2027 Batch B.Tech CSE (no pending credits, available to join from August) & M.Tech CSE\n  - Minimum 60% / 6.0 CGPA in 10th, 12th & B.Tech, with no standing arrears\n• Comprehensive Hiring Process:\n  1. Written & Online Assessment (On-Campus @ Vellore on 29-07-2026): Pre-Assessment Coding (Online) + Pen & Paper MCQ Round + Hackathon Part A\n  2. Eliminatory Technical Interview (Online): Deep focus on DSA and CS Fundamentals\n  3. Hackathon (1-Day Event): Intensive hands-on coding challenge building real software solutions\n  4. Final Interview: Technical & Cultural Fit Assessment at Juspay Office in Bangalore\n• Registration: Neo PAT portal on or before 17-07-2026 12:00 noon.',
    registrationLink: 'http://Inflection.io',
    notes: '- Super Dream Internship / PPO (₹27 LPA CTC, ₹40,000/month stipend)\n- 1-year internship starting August 2026 (Students MUST have no pending credits and be available from August)\n- Eligible: B.Tech CSE & M.Tech CSE (60% / 6.0 CGPA, No Standing Arrears)\n- Physical PPT & Rounds at Vellore Campus on 29th July 2026\n- Final Interviews at Juspay Office Bangalore in 1st week of August\n- Deadline: 17th July 2026 (12:00 PM noon)',
    miscellaneousNotes: '- Hiring Process: Pre-Assessment Coding + Pen & Paper MCQ + Hackathon Part A -> Online Tech Interview -> 1-Day Hackathon -> Final Interview.\n- Headquartered in Bangalore (Inflection.io / Juspay).',
    history: [
      { stage: 'Registration', status: 'Preparing', date: '2026-07-16', time: '12:00', notes: 'Last date for registration on Neo PAT portal: 17-07-2026 12 noon' },
      { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-29', time: '', notes: 'Physical process at Vellore campus: PPT + Pre-Assessment Coding + MCQ + Hackathon Part A' },
      { stage: 'Technical Interview', status: 'Preparing', date: '2026-08-01', time: '', notes: 'Interviews 1st week of August at Juspay Office Bangalore' }
    ],
    schedule: [],
  },
  {
    id: 106,
    name: 'UBS (2027 Batch)',
    role: 'Technology Intern / Full-Time Graduate',
    year: 'fourth',
    kind: 'internship_placement',
    compensation: { amount: 13, unit: 'LPA' },
    stipendAmount: 60000,
    baseSalary: 13,
    joiningBonus: 0,
    ctcDetails: 'CTC: ₹13 LPA (if converted). Internship Stipend: ₹60,000 / month.',
    startDate: '',
    endDate: '',
    durationMonths: 6,
    location: 'Pune / Hyderabad',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-21',
    deadlineTime: '14:00',
    reason: '',
    skills: ['Computer Science', 'Information Technology', 'Cognitive Aptitude', 'AON Assessment', 'Data Analysis', 'Financial Systems', 'Software Engineering'],
    aboutCompany: 'UBS is a premier global financial services firm headquartered in Switzerland, providing wealth management, asset management, and investment banking services across 50+ countries.',
    jobDescription: '• Role: Technology Intern / Full-Time Graduate (Super Dream Internship / Placement for 2027 Batch)\n• Compensation: ₹13 LPA CTC (if converted to full-time) | Internship Stipend: ₹60,000 / month\n• Eligibility: B.Tech CS & IT related branches only. Minimum 70% / 7.0 CGPA in 10th, 12th & B.Tech, with no standing arrears.\n• Locations: Pune / Hyderabad\n• Mandatory Pre-Interview Assessment:\n  - Culture Aptitude Test and Cognitive Ability Test (AON) are mandatory.\n  - Candidates MUST take and complete assessments prior to 13th August 2026 to qualify for interview rounds.\n• CV Guidelines: All CVs MUST include a photograph and clearly state passing year (2025–2027) on both digital and printed copies.\n• Schedule:\n  - 17-08-2026: Virtual PPT\n  - 19-08-2026: Physical Interviews at Vellore Campus\n• Dual Registration: Must register on BOTH Neo PAT portal and company link by 21-07-2026 (2:00 PM).',
    registrationLink: 'https://ubs.com/careers',
    notes: '- Super Dream Offer (₹13 LPA CTC, ₹60,000/mo stipend)\n- Separate 2027 Batch Entry\n- Mandatory Assessment: AON Culture Aptitude & Cognitive Ability Test prior to 13th August 2026\n- Resume Requirement: Must include photograph and passing year (2025–2027)\n- 17-08-2026: Virtual PPT | 19-08-2026: Physical Interviews at Vellore Campus\n- Locations: Pune / Hyderabad\n- Registration Deadline: 21st July 2026 (2:00 PM) on Neo PAT and UBS company link',
    miscellaneousNotes: '- Must register in BOTH Neo PAT and UBS company link.\n- False passing year info will lead to rejection.',
    history: [
      { stage: 'Registration', status: 'Preparing', date: '2026-07-20', time: '14:00', notes: 'Last date for registration on Neo PAT and UBS company link: 21-07-2026 (2.00 pm)' },
      { stage: 'Online Coding Round', status: 'Preparing', date: '2026-08-13', time: '', notes: 'Mandatory AON Culture Aptitude & Cognitive Ability Test prior to 13th August 2026' },
      { stage: 'Technical Interview', status: 'Preparing', date: '2026-08-19', time: '', notes: 'Physical Interviews at Vellore Campus (PPT Virtual on 17-08-2026)' }
    ],
    schedule: [],
  },
  {
    id: 107,
    name: 'WorkIndia',
    role: 'Software Development Engineer',
    year: 'fourth',
    kind: 'internship_placement',
    compensation: { amount: 16, unit: 'LPA' },
    stipendAmount: 40000,
    baseSalary: 16,
    joiningBonus: 0,
    ctcDetails: 'CTC: ₹16 LPA (if converted). Internship Stipend: ₹40,000 / month for 6 months.',
    startDate: '',
    endDate: '',
    durationMonths: 6,
    location: 'HSR Layout, Bangalore',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-21',
    deadlineTime: '14:00',
    reason: '',
    skills: ['Python', 'JavaScript', 'Go', 'ReactJS', 'PostgreSQL', 'MySQL', 'MongoDB', 'Elasticsearch', 'Kubernetes', 'Microservices', 'System Scaling'],
    aboutCompany: 'WorkIndia (Eloquent Info Solutions Pvt Ltd) is India’s largest automated, tech-driven marketplace for blue-collar hiring, connecting 2.8+ crore job seekers and 1.7 million employers.',
    jobDescription: '• Role: Software Development Engineer (SDE)\n• Category: Super Dream Internship / Placement\n• CTC: ₹16 LPA (if converted to full-time). Internship Stipend: ₹40,000 / month for 6 months.\n• Key Responsibilities:\n  - End-to-end product ownership, collaborating closely with product & design teams.\n  - Driving innovation, performance, scalability, and maintainability across core microservices.\n  - Designing, implementing, and verifying key product initiatives.\n• Required Skills: Python, JavaScript, Go, ReactJS, PostgreSQL, MySQL, MongoDB, Elasticsearch, Kubernetes.\n• Eligibility: 2027 Batch B.Tech CS & IT related branches. Minimum 60% in 10th & 12th, 80% / 8.0 CGPA in B.Tech, with no standing arrears.\n• Location: Onsite at Bangalore Office (No. 437, HustleHub, 3rd Floor, 17th Cross, Sector 4, HSR Layout, Bengaluru)\n• Date of Visit: 31st July 2026\n• Registration: NEOPAT portal on or before 21st July 2026 (2:00 PM).',
    registrationLink: 'http://www.workindia.in',
    notes: '- Super Dream Offer (₹16 LPA CTC if converted, ₹40,000/mo stipend for 6 months)\n- Date of Visit: 31st July 2026\n- End-to-end product ownership, metrics driving, and tech innovation\n- Location: Onsite in Bangalore (HSR Layout)\n- Registration Deadline: 21st July 2026 (2:00 PM) on NEOPAT portal',
    miscellaneousNotes: '- Corporate Office: No. 437, HustleHub, 3rd Floor, 17th Cross, Sector 4, HSR Layout, Bengaluru\n- Email: people@workindia.in\n- Minimum 80% in B.Tech, 60% in 10th & 12th, No Standing Arrears',
    history: [
      { stage: 'Registration', status: 'Preparing', date: '2026-07-21', time: '14:00', notes: 'Last date for registration on NEOPAT portal: 21st July 2026 2:00 pm' },
      { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-31', time: '', notes: 'Date of Visit: 31st July 2026' }
    ],
    schedule: [],
  },
  {
    id: 108,
    name: 'Fischer Jordan',
    role: 'Data Analyst / Software Engineer',
    year: 'fourth',
    kind: 'internship_placement',
    compensation: { amount: 31, unit: 'LPA' },
    stipendAmount: 50000,
    baseSalary: 18,
    joiningBonus: 100000,
    ctcDetails: 'Total CTC: ₹30.7 - 32.8 LPA (SWE: ₹32.8 LPA, DA: ₹30.7 LPA). Base: ₹16-18 LPA + Bonuses + Revenue Share. Stipend: ₹50,000/month.',
    startDate: '',
    endDate: '',
    durationMonths: 6,
    location: 'Remote (US Hours)',
    optedIn: true,
    registered: false,
    deadlineDate: '2026-07-21',
    deadlineTime: '15:00',
    reason: '',
    skills: ['Python', 'SQL', 'ReactJS', 'Next.js', 'Django', 'Node.js', 'AWS', 'Docker', 'DevOps', 'Generative AI', 'LLMs', 'LangChain', 'RAG', 'Data Analytics', 'Predictive Modeling'],
    aboutCompany: 'Fischer Jordan is a New York-headquartered analytics, tech, and management consulting firm working directly with US-based enterprise clients, central banks, and financial institutions.',
    jobDescription: '• Roles Offered: Data Analyst (DA) & Software Engineer (SWE - Frontend & Backend)\n• Total Compensation Structure:\n  - Software Engineer (SWE): ₹32.8 LPA Total CTC (Base ₹18L + Perf Bonus ₹2.5L + Retention ₹1L + Signing ₹1L + Rev Share)\n  - Data Analyst (DA): ₹30.7 LPA Total CTC (Base ₹16L + Perf Bonus ₹2.4L + Retention ₹1L + Signing ₹1L + Rev Share)\n  - Internship Stipend: ₹50,000 / month\n• Contract & Terms:\n  - 3-Year Service Agreement from full-time start date.\n  - Base Salary Escalation: +20% increase in Year 2 and +20% increase in Year 3.\n  - Signing Bonus: ₹1 Lakh paid with first salary (subject to clawback if leaving within 3 years).\n  - Retention Bonus: ₹1 Lakh paid at end of Year 3.\n  - US Travel Option: Opportunity to visit US office for up to 2 weeks after 2 full years.\n• Work Mode: Remote (US timezones, 55-60 hours/week).\n• Technical Domains:\n  - DA: Python, SQL, statistical modeling, LLMs, GenAI tools, predictive modeling, data extraction.\n  - SWE Frontend: React.js, Next.js, HTML/CSS, Figma, WebGL, React Native, UI/UX.\n  - SWE Backend: Django, REST APIs, Node.js, AWS (EC2, S3, Lambda, RDS), Docker, DevOps, vector search, RAG pipelines.\n• Hiring Process: CV Screening with Video Resume -> 3 Rounds of Personal Interview (Google Meet).\n• Registration: NEO PAT portal on or before 21st July 2026 (03:00 PM).',
    registrationLink: 'https://fischerjordan.com/',
    notes: '- Super Dream Offer (₹30 - 31 LPA CTC, ₹50,000/mo stipend)\n- 3-Year Contract Service Agreement (Early termination fee applies)\n- Work Mode: Remote (US Hours, 55-60 hours/week)\n- Roles: Data Analyst & Software Engineer (SWE)\n- Hiring Process: Video Resume CV Screening -> 3 Personal Interview Rounds (Google Meet)\n- Bonus & Benefits: ₹1L Signing Bonus, ₹1L Retention Bonus at Year 3, 2-week US Visit option after Year 2\n- Registration Deadline: 21st July 2026 (3:00 PM) on NEO PAT',
    miscellaneousNotes: '- Base salary increases by +20% in Year 2 and +20% in Year 3.\n- Video Resume required along with CV.',
    history: [
      { stage: 'Registration', status: 'Preparing', date: '2026-07-20', time: '15:00', notes: 'Last date for registration on NEO PAT: 21st July 2026 (3:00 PM)' },
      { stage: 'Resume/CGPA', status: 'Preparing', date: '', time: '', notes: 'CV Screening with Video Resume' },
      { stage: 'Technical Interview', status: 'Preparing', date: '', time: '', notes: '3 rounds of Personal Interview via Google Meet' }
    ],
    schedule: [],
  }
];

export function migratePlacementCompanies(raw: unknown): PlacementCompany[] {
  let list = Array.isArray(raw) ? [...raw] : [];

  if (list.length === 0) {
    list = [...DEFAULT_PLACEMENT_SEED];
  } else {
    // Automatically merge missing seed companies so they are always present
    DEFAULT_PLACEMENT_SEED.forEach((seed) => {
      const exists = list.some(
        (c: any) =>
          c.name?.toLowerCase().trim().includes(seed.name.toLowerCase().trim()) ||
          seed.name.toLowerCase().trim().includes(c.name?.toLowerCase().trim() || 'xyz123')
      );
      if (!exists) {
        list.push(seed);
      }
    });
  }

  let nextId = 1
  const usedIds = new Set<number>()
  for (const rec of list) {
    if (typeof rec?.id === 'number' && Number.isFinite(rec.id)) usedIds.add(rec.id)
  }
  const takeId = () => {
    while (usedIds.has(nextId)) nextId++
    usedIds.add(nextId)
    return nextId
  }

  return list.map((rec) => {
    if (isAlreadyMigrated(rec)) {
      // Still normalise history and id — a record can be new-shape but carry a
      // string id from an interrupted migration.
      const id = typeof rec.id === 'number' && Number.isFinite(rec.id) ? rec.id : takeId()
      const history = buildJourney(rec, [], '')
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
export function currentRoundIndex(history: StageEntry[]): number {
  if (!Array.isArray(history) || history.length === 0) return -1
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
