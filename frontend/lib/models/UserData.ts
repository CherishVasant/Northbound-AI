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

const PlacementNotesSchema = new Schema({
  content: { type: String, default: '' },
  lastEdited: { type: Date, default: null },
})

const PlacementCompanySchema = new Schema({
  id: { type: String, required: true },
  company: { type: String, default: '' },
  jobRole: { type: String, default: '' },
  skillsRequired: { type: [String], default: [] },
  packageCTC: { type: Number, default: null },
  optedIn: { type: Boolean, default: false },
  registrationCompleted: { type: Boolean, default: false },
  applicationDeadline: { type: Date, default: null },
  currentStage: { type: String, default: 'Application' },
  stageStatus: { type: String, default: 'Not Applied' },
  nextEvent: { type: String, default: '' },
  nextEventDateTime: { type: Date, default: null },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  preparationStatus: { type: String, default: 'Not Started' },
  finalResult: { type: String, default: 'Pending' },
  reason: { type: String, default: '' },
  notes: { type: PlacementNotesSchema, default: () => ({}) },
  location: { type: String, default: '' },
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

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
