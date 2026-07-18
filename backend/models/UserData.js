const mongoose = require('mongoose');

const DSAProblemSchema = new mongoose.Schema({
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
  status: { type: String, enum: ['Not Started', 'In Progress', 'Reviewed', 'Interview Ready', 'Mastered'], default: 'Not Started' },
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
  solutionLink: { type: String }
});

const SubtopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' }
});

const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  resourceLink: { type: String, default: '' },
  notes: { type: String, default: '' },
  subtopics: { type: [SubtopicSchema], default: [] }
});

const SubjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  topics: { type: [TopicSchema], default: [] }
});

const ProjectSchema = new mongoose.Schema({
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
  highlight: { type: Boolean, default: false }
});

const AptitudeTopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  resourceLink: { type: String, default: '' },
  notes: { type: String, default: '' },
  category: { type: String, enum: ['Quantitative', 'Logical', 'Verbal'] },
  accuracy: { type: Number },
  attempts: { type: Number },
  lastAttempt: { type: String }
});

const HRQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  draftAnswer: { type: String, default: '' },
  source: { type: String, default: '' },
  tags: { type: [String], default: [] },
  completed: { type: Boolean, default: false }
});

const CertificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  provider: { type: String, required: true },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
  deadline: { type: String },
  link: { type: String, default: '' },
  notes: { type: String, default: '' },
  cost: { type: Number },
  earnedDate: { type: String },
  certificateLink: { type: String },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' }
});

// Mirrors frontend/lib/models/UserData.ts — keep the two in sync.
const StageEntrySchema = new mongoose.Schema({
  stage:  { type: String, default: '' },
  status: { type: String, default: '' },
  date:   { type: String, default: '' }
}, { _id: false });

const PlacementCompanySchema = new mongoose.Schema({
  // Mixed, not Number: legacy records carry string UUID ids that a Number type
  // would fail to cast on read.
  id:            { type: mongoose.Schema.Types.Mixed, required: true },
  name:          { type: String, default: '' },
  role:          { type: String, default: '' },
  package:       { type: Number, default: 0 },
  location:      { type: String, default: '' },
  optedIn:       { type: Boolean, default: false },
  registered:    { type: Boolean, default: false },
  deadlineDate:  { type: String, default: '' },
  deadlineTime:  { type: String, default: '' },
  reason:        { type: String, default: '' },
  skills:        { type: [String], default: [] },
  // Mixed: legacy notes were { content, lastEdited }; casting that object to
  // String would store "[object Object]" and destroy the note.
  notes:         { type: mongoose.Schema.Types.Mixed, default: '' },
  history:       { type: [StageEntrySchema], default: [] },

  // Legacy fields kept readable so the client migration can still see them.
  company:               { type: String },
  jobRole:               { type: String },
  skillsRequired:        { type: [String] },
  packageCTC:            { type: Number },
  registrationCompleted: { type: Boolean },
  applicationDeadline:   { type: Date },
  currentStage:          { type: String },
  stageStatus:           { type: String },
  finalResult:           { type: String },
  archived:              { type: Boolean },
  createdAt:             { type: Date }
}, { _id: false });

const PlacementCustomOptionsSchema = new mongoose.Schema({
  jobRoles:  { type: [String], default: [] },
  locations: { type: [String], default: [] },
  skills:    { type: [String], default: [] }
});

const ConceptSubTopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  overview: { type: String, default: '' },
  notes: { type: String, default: '' },
  codeSnippet: { type: String, default: '' },
  timeComplexity: { type: String, default: '' },
  spaceComplexity: { type: String, default: '' },
  pros: { type: [String], default: [] },
  cons: { type: [String], default: [] },
  resourceLinks: { type: [String], default: [] }
});

const ConceptTopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sectionId: { type: String, required: true },
  sectionTitle: { type: String, required: true },
  topicName: { type: String, required: true },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Mastered'], default: 'Not Started' },
  codeSnippet: { type: String, default: '' },
  language: { type: String, default: 'python' },
  notes: { type: String, default: '' },
  resourceLinks: { type: [String], default: [] },
  lastUpdated: { type: String },
  subTopics: { type: [ConceptSubTopicSchema], default: [] }
});

const UserDataSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, default: '', index: true },
  password: { type: String },
  salt: { type: String },
  // PBKDF2 work factor for `password`. Absent on pre-upgrade accounts, which
  // used 1000 — see LEGACY_ITERATIONS in routes/auth.js.
  iterations: { type: Number },
  dsaProblems: { type: [DSAProblemSchema], default: [] },
  subjects: { type: [SubjectSchema], default: [] },
  projects: { type: [ProjectSchema], default: [] },
  certifications: { type: [CertificationSchema], default: [] },
  aptitudeTopics: { type: [AptitudeTopicSchema], default: [] },
  hrQuestions: { type: [HRQuestionSchema], default: [] },
  dsaConcepts: { type: [ConceptTopicSchema], default: [] },
  placementCompanies:     { type: [PlacementCompanySchema], default: [] },
  placementCustomOptions: { type: PlacementCustomOptionsSchema, default: () => ({}) }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserData', UserDataSchema);
