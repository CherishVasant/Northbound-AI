// Storage keys for each module
export const STORAGE_KEYS = {
  DSA_PROBLEMS: 'placement_dsa_problems',
  SUBJECTS: 'placement_subjects',
  PROJECTS: 'placement_projects',
  APTITUDE_TOPICS: 'placement_aptitude_topics',
  HR_QUESTIONS: 'placement_hr_questions',
  CERTIFICATIONS: 'placement_certifications',
  SYLLABUSES: 'placement_syllabuses',
  CONCEPTS: 'placement_concepts',
  PLACEMENT_COMPANIES: 'placement_companies',
  PLACEMENT_CUSTOM_OPTIONS: 'placement_custom_options',
  AI_CHATS: 'ai_chats',
} as const;

// Default syllabuses for core subjects
export const DEFAULT_SYLLABUSES: SyllabusSubject[] = [
  {
    id: 'os',
    name: 'Operating Systems',
    icon: '⚙️',
    description: 'Process management, memory, file systems, and scheduling',
    completionPercentage: 0,
    topics: [
      {
        id: 'os-1',
        name: 'Process & Threads',
        completed: false,
        subtopics: [
          { id: 'os-1-1', name: 'Process creation and termination', completed: false },
          { id: 'os-1-2', name: 'Thread management', completed: false },
          { id: 'os-1-3', name: 'Context switching', completed: false },
        ],
      },
      {
        id: 'os-2',
        name: 'Memory Management',
        completed: false,
        subtopics: [
          { id: 'os-2-1', name: 'Paging and segmentation', completed: false },
          { id: 'os-2-2', name: 'Virtual memory', completed: false },
          { id: 'os-2-3', name: 'Cache management', completed: false },
        ],
      },
      {
        id: 'os-3',
        name: 'Synchronization',
        completed: false,
        subtopics: [
          { id: 'os-3-1', name: 'Deadlock prevention', completed: false },
          { id: 'os-3-2', name: 'Semaphores and mutexes', completed: false },
        ],
      },
    ],
  },
  {
    id: 'dbms',
    name: 'Database Management Systems',
    icon: '🗄️',
    description: 'SQL, normalization, transactions, and query optimization',
    completionPercentage: 0,
    topics: [
      {
        id: 'dbms-1',
        name: 'SQL & Queries',
        completed: false,
        subtopics: [
          { id: 'dbms-1-1', name: 'Basic queries and joins', completed: false },
          { id: 'dbms-1-2', name: 'Aggregations and subqueries', completed: false },
          { id: 'dbms-1-3', name: 'Indexes and optimization', completed: false },
        ],
      },
      {
        id: 'dbms-2',
        name: 'Normalization',
        completed: false,
        subtopics: [
          { id: 'dbms-2-1', name: '1NF to 3NF', completed: false },
          { id: 'dbms-2-2', name: 'BCNF and 4NF', completed: false },
        ],
      },
      {
        id: 'dbms-3',
        name: 'Transactions & ACID',
        completed: false,
        subtopics: [
          { id: 'dbms-3-1', name: 'ACID properties', completed: false },
          { id: 'dbms-3-2', name: 'Concurrency control', completed: false },
        ],
      },
    ],
  },
  {
    id: 'networks',
    name: 'Computer Networks',
    icon: '🌐',
    description: 'OSI model, TCP/IP, routing, and network protocols',
    completionPercentage: 0,
    topics: [
      {
        id: 'net-1',
        name: 'OSI & TCP/IP',
        completed: false,
        subtopics: [
          { id: 'net-1-1', name: 'OSI model layers', completed: false },
          { id: 'net-1-2', name: 'TCP/IP stack', completed: false },
        ],
      },
      {
        id: 'net-2',
        name: 'Routing & Switching',
        completed: false,
        subtopics: [
          { id: 'net-2-1', name: 'IP routing protocols', completed: false },
          { id: 'net-2-2', name: 'Switching techniques', completed: false },
        ],
      },
      {
        id: 'net-3',
        name: 'Security & Protocols',
        completed: false,
        subtopics: [
          { id: 'net-3-1', name: 'SSL/TLS and encryption', completed: false },
          { id: 'net-3-2', name: 'HTTP and DNS', completed: false },
        ],
      },
    ],
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    icon: '📦',
    description: 'OOP principles, design patterns, and best practices',
    completionPercentage: 0,
    topics: [
      {
        id: 'oop-1',
        name: 'Core Concepts',
        completed: false,
        subtopics: [
          { id: 'oop-1-1', name: 'Encapsulation and abstraction', completed: false },
          { id: 'oop-1-2', name: 'Inheritance and polymorphism', completed: false },
        ],
      },
      {
        id: 'oop-2',
        name: 'Design Patterns',
        completed: false,
        subtopics: [
          { id: 'oop-2-1', name: 'Creational patterns', completed: false },
          { id: 'oop-2-2', name: 'Structural patterns', completed: false },
          { id: 'oop-2-3', name: 'Behavioral patterns', completed: false },
        ],
      },
    ],
  },
  {
    id: 'systemdesign',
    name: 'System Design',
    icon: '🏗️',
    description: 'Scalability, distributed systems, and architecture',
    completionPercentage: 0,
    topics: [
      {
        id: 'sd-1',
        name: 'Scalability Concepts',
        completed: false,
        subtopics: [
          { id: 'sd-1-1', name: 'Load balancing', completed: false },
          { id: 'sd-1-2', name: 'Caching strategies', completed: false },
          { id: 'sd-1-3', name: 'Database sharding', completed: false },
        ],
      },
      {
        id: 'sd-2',
        name: 'Distributed Systems',
        completed: false,
        subtopics: [
          { id: 'sd-2-1', name: 'CAP theorem', completed: false },
          { id: 'sd-2-2', name: 'Consistency models', completed: false },
        ],
      },
    ],
  },
]

// Types for data structures
export interface DSAProblem {
  id: string
  problemName: string
  link: string
  pattern: string
  dataStructures: string[]
  approach: string
  triggerKeywords?: string[]
  coreLogic?: string
  personalNotes: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: 'Not Started' | 'Interview Ready' | 'Mastered'
  dateAdded: string
  lastRevised?: string
  topic?: string
  timeComplexity?: string
  spaceComplexity?: string
  constraints?: string
  keyInsight?: string
  commonMistakes?: string
  explanation?: string
  pitfalls?: string
  recognitionTrigger?: string
  codeSnippet?: string
  code?: string
  solutionLink?: string
}

export interface Subject {
  id: string
  name: string
  topics: Topic[]
}

export interface Topic {
  id: string
  name: string
  completed: boolean
  resourceLink: string
  notes: string
  subtopics?: Subtopic[]
}

export interface Subtopic {
  id: string
  name: string
  completed: boolean
  notes: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: 'Planned' | 'In Progress' | 'Done'
  techStack: string[]
  skillsToLearn: string[]
  notes: string
  link: string
  githubLink?: string
  liveDemo?: string
  startDate?: string
  endDate?: string
  highlight?: boolean
}

export interface AptitudeTopic {
  id: string
  name: string
  completed: boolean
  resourceLink: string
  notes?: string
  category?: 'Quantitative' | 'Logical' | 'Verbal'
  accuracy?: number
  attempts?: number
  lastAttempt?: string
}

export interface HRQuestion {
  id: string
  question: string
  draftAnswer: string
  source: string
  tags: string[]
  completed?: boolean
}

export interface Certification {
  id: string
  name: string
  provider: string
  status: 'Not Started' | 'In Progress' | 'Completed'
  deadline: string
  link: string
  notes: string
  cost?: number
  earnedDate?: string
  certificateLink?: string
  priority?: 'High' | 'Medium' | 'Low'
}

export interface ConceptSubTopic {
  id: string
  name: string
  overview: string
  notes: string
  codeSnippet: string
  timeComplexity: string
  spaceComplexity: string
  pros?: string[]
  cons?: string[]
  resourceLinks: string[]
}

export interface ConceptTopic {
  id: string
  sectionId: string
  sectionTitle: string
  topicName: string
  status: 'Not Started' | 'In Progress' | 'Mastered'
  codeSnippet: string
  language: string
  notes: string
  resourceLinks: string[]
  lastUpdated?: string
  subTopics?: ConceptSubTopic[]
}

// AI Assistant types
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    problemId?: string
    type?: 'generate' | 'explain' | 'debug'
  }
  action?: string
  payload?: any
}

export interface AIConversation {
  id: string
  problemId: string
  messages: AIMessage[]
  createdAt: string
  updatedAt: string
}

export interface SyllabusSubject {
  id: string
  name: string
  icon: string
  description: string
  completionPercentage: number
  topics: SyllabusTopic[]
}

export interface SyllabusTopic {
  id: string
  name: string
  completed: boolean
  subtopics: SyllabusSubtopic[]
}

export interface SyllabusSubtopic {
  id: string
  name: string
  completed: boolean
  resourceLink?: string
}

// Helper functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStoredData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[v0] Error saving data:`, error)
  }
}

// ─── Placement Tracker Types ─────────────────────────────────────────────────

import type {
  PipelineStage,
  PipelineState,
  OpportunityYear,
  OpportunityKind,
  CompensationUnit,
} from '@/lib/constants/placement';

export interface PlacementNotes {
  content: string;
  /** ISO string — serialised as Date in MongoDB */
  lastEdited: string | null;
}

/**
 * One entry in a company's pipeline log. `history` is ordered oldest-first and
 * its LAST entry is the current status — there is deliberately no separate
 * `currentStage`/`stageStatus` field, so the log is the single source of truth.
 */
export interface StageEntry {
  stage: PipelineStage;
  status: PipelineState;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  notes?: string;
}

/** A round the company has already scheduled — what's coming, not what happened. */
export interface ScheduledEvent {
  id: string;
  stage: PipelineStage;
  /** yyyy-mm-dd */
  date: string;
  /** HH:mm (24h), '' when only a date is known */
  time: string;
  note: string;
}

/**
 * Pay as the company stated it. Deliberately NOT normalised: an internship
 * quoting 1.35L per month has no annual figure, and inventing one would imply
 * a salary that was never offered.
 *   { amount: 26,     unit: 'LPA' }       -> 26 LPA
 *   { amount: 135000, unit: 'per-month' } -> 1.35L/mo
 */
export interface Compensation {
  amount: number;
  unit: CompensationUnit;
}

export interface PlacementCompany {
  /** Monotonic numeric id (see nextCompanyId) */
  id: number;
  name: string;
  role: string;
  /** Which year's drive this was — the tab it appears under. */
  year: OpportunityYear;
  /** Whether this specific company came for a placement or an internship.
   *  Independent of `year`: a 4th-year internship stays in the 4th Year tab. */
  kind: OpportunityKind;
  compensation: Compensation;
  /** yyyy-mm-dd, '' when unset — internship start */
  startDate: string;
  /** yyyy-mm-dd, '' when unset — internship end */
  endDate: string;
  /** Stated length when no explicit dates are given ("2 month internship"); 0 when unset */
  durationMonths: number;
  location: string;
  optedIn: boolean;
  registered: boolean;
  /** yyyy-mm-dd, '' when unset */
  deadlineDate: string;
  /** HH:mm (24h), '' when unset */
  deadlineTime: string;
  /** Only meaningful when optedIn === false */
  reason: string;
  skills: string[];
  notes: string;
  /** Ordered oldest-first; last entry is the current status */
  history: StageEntry[];
  /** Known upcoming rounds, distinct from the history log */
  schedule: ScheduledEvent[];
}

export interface PlacementCustomOptions {
  jobRoles: string[];
  locations: string[];
  skills: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  pageContext: string;
  agent: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}
