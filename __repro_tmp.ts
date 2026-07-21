import { migratePlacementCompanies, needsMigration } from './lib/utils/placementMigration'
import { generateId } from './lib/utils/storage'

// Exactly what the placement agent prompt tells the model to emit (lib/ai/agents/placement.ts).
// Note what is NOT in it: no `year`.
const aiPayload = {
  name: 'Rubrik',
  role: 'Software Engineer',
  kind: 'internship_ppo',
  compensation: { amount: 18, unit: 'LPA' },
  startDate: '',
  endDate: '',
  durationMonths: 0,
  location: 'Bengaluru',
  optedIn: true,
  deadlineDate: '2026-08-01',
  deadlineTime: '23:59',
  reason: '',
  skills: ['Java', 'DSA'],
  aboutCompany: 'Data security company.',
  jobDescription: '- Build backend services',
  registrationLink: 'https://rubrik.com/careers',
  history: [{ stage: 'Resume/CGPA', status: 'Preparing', date: '', time: '', notes: '' }],
  notes: '',
  miscellaneousNotes: '- 2 year bond',
}

// Exactly what AIAssistant.tsx builds for a create (line ~831).
const fresh = {
  id: generateId(),
  ...aiPayload,
  createdAt: new Date().toISOString(),
  history: aiPayload.history,
  schedule: [],
}

// A pre-existing, already-migrated company, as the live list would hold.
const existing = {
  id: 1,
  name: 'Groww',
  role: 'SDE',
  year: 'fourth',
  kind: 'internship_ppo',
  compensation: { amount: 26, unit: 'LPA' },
  startDate: '', endDate: '', durationMonths: 0, location: 'Bengaluru',
  optedIn: true, registered: true, deadlineDate: '', deadlineTime: '',
  reason: '', skills: [], notes: '', history: [], schedule: [],
}

console.log('AI record id:', JSON.stringify(fresh.id), '(typeof', typeof fresh.id + ')')
console.log('AI record has `year`? ', 'year' in fresh)
console.log('needsMigration(list):', needsMigration([existing, fresh]))

const migrated = migratePlacementCompanies([existing, fresh])
const card = migrated.find((c) => c.name === 'Rubrik')!

console.log('\n--- after migratePlacementCompanies ---')
console.log('id           :', card.id, '(typeof', typeof card.id + ')')
console.log('year         :', JSON.stringify(card.year))
console.log('kind         :', JSON.stringify(card.kind))
console.log('optedIn      :', card.optedIn)
console.log('miscNotes    :', JSON.stringify(card.miscellaneousNotes))
console.log('history len  :', card.history.length)

console.log('\n--- would the card render? ---')
for (const tab of ['fourth', 'third'] as const) {
  const visible = migrated.filter((c) => c.year === tab)
  console.log(`${tab} tab shows:`, visible.map((c) => `${c.name}#${c.id}`).join(', ') || '(none)')
}

console.log('\n--- id collision check ---')
const ids = migrated.map((c) => c.id)
console.log('ids:', ids, ids.length === new Set(ids).size ? 'unique' : '*** DUPLICATE ***')

// Second render pass: migration runs on EVERY read, so run it again on the
// same stored array and see whether the id is stable.
const again = migratePlacementCompanies([existing, fresh])
console.log('\nid on 2nd render:', again.find((c) => c.name === 'Rubrik')!.id)

// And what the AI list looks like once TWO companies are added before any
// migration is persisted.
const fresh2 = { id: generateId(), ...aiPayload, name: 'Zomato', schedule: [] }
const two = migratePlacementCompanies([existing, fresh, fresh2])
console.log('\ntwo AI adds -> ids:', two.map((c) => `${c.name}#${c.id}`).join(', '))
const twoIds = two.map((c) => c.id)
console.log('unique?', twoIds.length === new Set(twoIds).size ? 'yes' : '*** DUPLICATE ***')
