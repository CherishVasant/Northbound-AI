import mongoose, { Schema } from 'mongoose'

/**
 * Mirrors backend/models/UserData.js so both bind to the same `userdatas`
 * collection. Keep the model name 'UserData' — changing it changes the
 * collection and orphans existing accounts.
 */

const DSAProblemSchema = new Schema({
  id: { type: String, required: true },
  problemName: { type: String, required: true },
  link: { type: String, default: '' },
  pattern: { type: String, default: '' },
  dataStructures: { type: [String], default: [] },
  approach: { type: String, default: '' },
  triggerKeywords: { type: [String], default: [] },
  coreLogic: { type: String, default: '' },
  personalNotes: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Reviewed', 'Interview Ready', 'Mastered'],
    default: 'Not Started',
  },
  dateAdded: { type: String, default: () => new Date().toISOString() },
  lastRevised: { type: String },
  topic: { type: String },
  timeComplexity: { type: String },
  spaceComplexity: { type: String },
  constraints: { type: String },
  keyInsight: { type: String },
  commonMistakes: { type: String },
  explanation: { type: String },
  pitfalls: { type: String },
  recognitionTrigger: { type: String },
  codeSnippet: { type: String },
  code: { type: String },
  solutionLink: { type: String },
})

const SubtopicSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
})

const TopicSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  resourceLink: { type: String, default: '' },
  notes: { type: String, default: '' },
  subtopics: { type: [SubtopicSchema], default: [] },
})

const SubjectSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  topics: { type: [TopicSchema], default: [] },
})

const ProjectSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Planned', 'In Progress', 'Done'], default: 'Planned' },
  techStack: { type: [String], default: [] },
  skillsToLearn: { type: [String], default: [] },
  notes: { type: String, default: '' },
  link: { type: String, default: '' },
  githubLink: { type: String },
  liveDemo: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  highlight: { type: Boolean, default: false },
})

const AptitudeTopicSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  resourceLink: { type: String, default: '' },
  notes: { type: String, default: '' },
  category: { type: String, enum: ['Quantitative', 'Logical', 'Verbal'] },
  accuracy: { type: Number },
  attempts: { type: Number },
  lastAttempt: { type: String },
})

const HRQuestionSchema = new Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  draftAnswer: { type: String, default: '' },
  source: { type: String, default: '' },
  tags: { type: [String], default: [] },
  completed: { type: Boolean, default: false },
})

const CertificationSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  provider: { type: String, required: true },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  deadline: { type: String },
  link: { type: String, default: '' },
  notes: { type: String, default: '' },
  cost: { type: Number },
  earnedDate: { type: String },
  certificateLink: { type: String },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
})

/** One entry in a company's pipeline log; the last entry is the current status. */
const StageEntrySchema = new Schema(
  {
    stage: { type: String, default: '' },
    status: { type: String, default: '' },
    date: { type: String, default: '' },
  },
  { _id: false },
)

const ScheduledEventSchema = new Schema(
  {
    id: { type: String, default: '' },
    stage: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { _id: false },
)

const CompensationSchema = new Schema(
  {
    amount: { type: Number, default: 0 },
    unit: { type: String, default: 'LPA' },
  },
  { _id: false },
)

const PlacementCompanySchema = new Schema(
  {
    // Mixed, not Number: pre-migration records carry string UUID ids, and a
    // Number type would fail to cast them on read. Tighten to Number once no
    // legacy records remain.
    id: { type: Schema.Types.Mixed, required: true },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    track: { type: String, default: 'placement' },
    compensation: { type: CompensationSchema, default: () => ({ amount: 0, unit: 'LPA' }) },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    durationMonths: { type: Number, default: 0 },
    // Legacy bare number, kept readable so migration can still see it.
    package: { type: Number },
    location: { type: String, default: '' },
    optedIn: { type: Boolean, default: false },
    registered: { type: Boolean, default: false },
    deadlineDate: { type: String, default: '' },
    deadlineTime: { type: String, default: '' },
    reason: { type: String, default: '' },
    skills: { type: [String], default: [] },
    // Mixed: legacy records stored { content, lastEdited }; the current model is
    // plain text. Casting an object to String would yield "[object Object]" and
    // silently destroy the note.
    notes: { type: Schema.Types.Mixed, default: '' },
    history: { type: [StageEntrySchema], default: [] },
    schedule: { type: [ScheduledEventSchema], default: [] },

    // ── Legacy fields, retained so migratePlacementCompanies() can still read
    // them. Mongoose strips unknown paths on read, so removing these before
    // every record is migrated would blank out existing companies. They stop
    // being written the first time the client saves.
    company: { type: String },
    jobRole: { type: String },
    skillsRequired: { type: [String] },
    packageCTC: { type: Number },
    registrationCompleted: { type: Boolean },
    applicationDeadline: { type: Date },
    currentStage: { type: String },
    stageStatus: { type: String },
    finalResult: { type: String },
    archived: { type: Boolean },
    createdAt: { type: Date },
  },
  { _id: false },
)

const PlacementCustomOptionsSchema = new Schema({
  jobRoles: { type: [String], default: [] },
  locations: { type: [String], default: [] },
  skills: { type: [String], default: [] },
})

const ConceptSubTopicSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  overview: { type: String, default: '' },
  notes: { type: String, default: '' },
  codeSnippet: { type: String, default: '' },
  timeComplexity: { type: String, default: '' },
  spaceComplexity: { type: String, default: '' },
  pros: { type: [String], default: [] },
  cons: { type: [String], default: [] },
  resourceLinks: { type: [String], default: [] },
})

const ConceptTopicSchema = new Schema({
  id: { type: String, required: true },
  sectionId: { type: String, required: true },
  sectionTitle: { type: String, required: true },
  topicName: { type: String, required: true },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Mastered'],
    default: 'Not Started',
  },
  codeSnippet: { type: String, default: '' },
  language: { type: String, default: 'python' },
  notes: { type: String, default: '' },
  resourceLinks: { type: [String], default: [] },
  lastUpdated: { type: String },
  subTopics: { type: [ConceptSubTopicSchema], default: [] },
})

const UserDataSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '', index: true },
    password: { type: String },
    salt: { type: String },
    // PBKDF2 work factor used for `password`. Absent on accounts created by the
    // legacy Express backend, which always used 1000 — see LEGACY_ITERATIONS.
    iterations: { type: Number },
    dsaProblems: { type: [DSAProblemSchema], default: [] },
    subjects: { type: [SubjectSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    aptitudeTopics: { type: [AptitudeTopicSchema], default: [] },
    hrQuestions: { type: [HRQuestionSchema], default: [] },
    dsaConcepts: { type: [ConceptTopicSchema], default: [] },
    placementCompanies: { type: [PlacementCompanySchema], default: [] },
    placementCustomOptions: { type: PlacementCustomOptionsSchema, default: () => ({}) },
  },
  { timestamps: true },
)

// Reuse the compiled model across hot reloads and warm serverless containers;
// re-registering the same name throws OverwriteModelError.
export const UserData = mongoose.models.UserData ?? mongoose.model('UserData', UserDataSchema)

export default UserData
