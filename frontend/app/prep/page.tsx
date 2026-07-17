'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Briefcase, HelpCircle, Award, ExternalLink, CheckCircle2, Circle, Code2,
  MessageSquare, X, Edit2, Link2, Plus, Trash2, Calendar, AlertTriangle, Clock, Search, FolderOpen 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { 
  AptitudeTopic, HRQuestion, Certification, Project, STORAGE_KEYS, generateId 
} from '@/lib/utils/storage'
import { 
  SEED_APTITUDE_TOPICS, SEED_HR_QUESTIONS, SEED_CERTIFICATIONS, SEED_PROJECTS 
} from '@/lib/utils/mockData'
import { formatPercentage } from '@/lib/utils'

function PrepResourcesContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'projects'

  // --- 1. LOCAL STORAGE MODULES HOOKS ---
  const [projects, setProjects, projectsLoaded] = useLocalStorage<Project[]>(
    STORAGE_KEYS.PROJECTS,
    SEED_PROJECTS
  )
  const [savedAptitude, setSavedAptitude, aptitudeLoaded] = useLocalStorage<any[]>(
    STORAGE_KEYS.APTITUDE_TOPICS,
    [])
  const [savedHR, setSavedHR, hrLoaded] = useLocalStorage<any[]>(
    STORAGE_KEYS.HR_QUESTIONS,
    []
  )
  const [certifications, setCertifications, certsLoaded] = useLocalStorage<Certification[]>(
    STORAGE_KEYS.CERTIFICATIONS,
    SEED_CERTIFICATIONS
  )

  // --- 2. MODAL & LOCAL FORM STATES ---
  // Aptitude Form State
  const [editingAptTopic, setEditingAptTopic] = useState<AptitudeTopic | null>(null)
  const [aptSearch, setAptSearch] = useState('')
  const [aptCategory, setAptCategory] = useState('')

  // HR Form State
  const [editingHRId, setEditingHRId] = useState<string | null>(null)
  const [hrFormData, setHrFormData] = useState<Partial<HRQuestion>>({})
  const [hrSelectedTag, setHrSelectedTag] = useState('')

  // Certifications Form State
  const [certSearch, setCertSearch] = useState('')
  const [certStatusFilter, setCertStatusFilter] = useState('')
  const [certDeleteId, setCertDeleteId] = useState<string | null>(null)
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [certFormData, setCertFormData] = useState<Partial<Certification>>({})

  // Projects Form State
  const [projectSearchQuery, setProjectSearchQuery] = useState('')
  const [projectFilterStatus, setProjectFilterStatus] = useState('')
  const [projectDeleteId, setProjectDeleteId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectFormData, setProjectFormData] = useState<any>({})

  // --- 3. DATA MERGES & STATS CALCULATIONS ---
  // Aptitude merge
  const aptitudeTopics = useMemo(() => {
    return SEED_APTITUDE_TOPICS.map((staticTopic) => {
      const saved = savedAptitude?.find((t) => t.id === staticTopic.id)
      return {
        ...staticTopic,
        completed: saved ? saved.completed : false,
        notes: saved ? saved.notes : staticTopic.notes,
        solved: saved ? saved.solved : '',
      }
    })
  }, [savedAptitude])

  const aptitudeCompleted = aptitudeTopics.filter((t) => t.completed).length
  const aptitudeProgress = aptitudeTopics.length > 0 ? (aptitudeCompleted / aptitudeTopics.length) * 100 : 0

  // HR merge
  const hrQuestions = useMemo(() => {
    return SEED_HR_QUESTIONS.map((staticQ) => {
      const saved = savedHR?.find((q) => q.id === staticQ.id)
      return {
        ...staticQ,
        completed: saved ? saved.completed : false,
        draftAnswer: saved ? saved.draftAnswer : staticQ.draftAnswer,
      }
    })
  }, [savedHR])

  const hrCompleted = hrQuestions.filter((q) => q.completed).length
  const hrProgress = hrQuestions.length > 0 ? (hrCompleted / hrQuestions.length) * 100 : 0

  // Certifications stats
  const certsTotal = certifications.length
  const certsCompleted = certifications.filter((c) => c.status === 'Completed').length
  const certsProgress = certsTotal > 0 ? (certsCompleted / certsTotal) * 100 : 0

  // Projects stats
  const projectsTotal = projects.length
  const projectsDone = projects.filter((p) => p.status === 'Done').length
  const projectsProgress = projectsTotal > 0 ? (projectsDone / projectsTotal) * 100 : 0

  // --- 4. ACTION HANDLERS ---
  // Aptitude Handlers
  const handleToggleAptitudeTopic = (id: string) => {
    const updated = [...(savedAptitude || [])]
    const index = updated.findIndex((t) => t.id === id)
    if (index > -1) {
      updated[index] = { ...updated[index], completed: !updated[index].completed }
    } else {
      updated.push({ id, completed: true, notes: '', solved: '' })
    }
    setSavedAptitude(updated)
  }

  const handleUpdateAptitudeSolved = (id: string, solvedText: string) => {
    const updated = [...(savedAptitude || [])]
    const index = updated.findIndex((t) => t.id === id)
    if (index > -1) {
      updated[index] = { ...updated[index], solved: solvedText }
    } else {
      updated.push({ id, completed: false, notes: '', solved: solvedText })
    }
    setSavedAptitude(updated)
  }

  const handleSaveAptitudeNotes = (id: string, notes: string) => {
    const updated = [...(savedAptitude || [])]
    const index = updated.findIndex((t) => t.id === id)
    if (index > -1) {
      updated[index] = { ...updated[index], notes }
    } else {
      updated.push({ id, notes, completed: false, solved: '' })
    }
    setSavedAptitude(updated)
    setEditingAptTopic(null)
  }

  // HR Handlers
  const handleToggleHRQuestion = (id: string) => {
    const updated = [...(savedHR || [])]
    const index = updated.findIndex((q) => q.id === id)
    if (index > -1) {
      updated[index] = { ...updated[index], completed: !updated[index].completed }
    } else {
      updated.push({ id, completed: true, draftAnswer: '' })
    }
    setSavedHR(updated)
  }

  const handleEditHRClick = (question: HRQuestion) => {
    setHrFormData({ ...question })
    setEditingHRId(question.id)
  }

  const handleSaveHRQuestion = () => {
    const updated = [...(savedHR || [])]
    const index = updated.findIndex((q) => q.id === editingHRId)
    const freshProgress = {
      id: editingHRId,
      draftAnswer: hrFormData.draftAnswer || '',
    }
    if (index > -1) {
      updated[index] = { ...updated[index], ...freshProgress }
    } else {
      updated.push(freshProgress)
    }
    setSavedHR(updated)
    setEditingHRId(null)
    setHrFormData({})
  }

  // Certifications Handlers
  const handleAddCert = () => {
    const newCert: Certification = {
      id: generateId(),
      name: 'New Certification Prep',
      provider: 'AWS / Google / Linux Foundation',
      status: 'Not Started',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      link: '',
      notes: '',
      certificateLink: '',
      earnedDate: '',
    }
    setCertFormData(newCert)
    setEditingCertId('new')
  }

  const handleSaveCert = () => {
    if (!certFormData.name?.trim()) return
    const cleanedCert = {
      ...certFormData,
      earnedDate: certFormData.status === 'Completed' ? (certFormData.earnedDate || new Date().toISOString().split('T')[0]) : '',
    }
    if (editingCertId === 'new') {
      const newC: Certification = {
        ...(cleanedCert as Omit<Certification, 'id'>),
        id: generateId(),
      }
      setCertifications([...certifications, newC])
    } else {
      setCertifications(
        certifications.map((c) => (c.id === editingCertId ? { ...c, ...cleanedCert } : c))
      )
    }
    setEditingCertId(null)
    setCertFormData({})
  }

  const handleDeleteCertConfirm = () => {
    if (!certDeleteId) return
    setCertifications(certifications.filter((c) => c.id !== certDeleteId))
    setCertDeleteId(null)
  }

  const getDeadlineAlert = (cert: Certification) => {
    if (cert.status === 'Completed') {
      return { label: 'Completed', color: 'bg-green-100 text-green-700 border border-green-200', icon: CheckCircle2 }
    }
    if (!cert.deadline) {
      return { label: 'No Deadline', color: 'bg-muted text-muted-foreground', icon: Clock }
    }
    const diffTime = new Date(cert.deadline).getTime() - Date.now()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700 border border-red-200 animate-pulse', icon: AlertTriangle }
    }
    if (daysLeft <= 7) {
      return { label: `Due in ${daysLeft}d`, color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: AlertTriangle }
    }
    return { label: `${daysLeft} days left`, color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: Clock }
  }

  // --- 5. TAB VIEW RENDER SECTIONS ---
  // Aptitude view
  const renderAptitude = () => {
    const filteredTopics = aptitudeTopics.filter((topic) => {
      const matchesSearch = topic.name.toLowerCase().includes(aptSearch.toLowerCase())
      const matchesCategory = aptCategory ? topic.category === aptCategory : true
      return matchesSearch && matchesCategory
    })

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search aptitude topics..."
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={aptCategory}
              onChange={(e) => setAptCategory(e.target.value)}
              className="w-full sm:w-44 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Quantitative">Quantitative</option>
              <option value="Logical">Logical Reasoning</option>
              <option value="Verbal">Verbal Ability</option>
            </select>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="font-bold text-foreground">{filteredTopics.length}</span> topics
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">Status</th>
                  <th className="py-3.5 px-4 w-1/4">Topic</th>
                  <th className="py-3.5 px-4 w-1/6">Category</th>
                  <th className="py-3.5 px-4 w-1/5">Practice Link</th>
                  <th className="py-3.5 px-4 w-1/6 text-center">Questions Solved</th>
                  <th className="py-3.5 px-4 w-1/4">My Notes / Formulas</th>
                  <th className="py-3.5 px-4 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTopics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <EmptyState title="No topics found" description="Adjust your filters or search criteria." />
                    </td>
                  </tr>
                ) : (
                  filteredTopics.map((topic) => (
                    <tr 
                      key={topic.id} 
                      className={`hover:bg-secondary/20 transition-colors ${topic.completed ? 'bg-emerald-500/[0.01]' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleAptitudeTopic(topic.id)}
                          className={`transition-colors focus:outline-none ${topic.completed ? 'text-emerald-500' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                        >
                          {topic.completed ? <CheckCircle2 className="w-5 h-5 fill-emerald-500/5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground text-sm">
                        <span className={topic.completed ? 'line-through text-muted-foreground/60 font-medium' : ''}>
                          {topic.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          topic.category === 'Quantitative' ? 'bg-blue-500/10 text-blue-600 border-blue-500/15' :
                          topic.category === 'Logical' ? 'bg-purple-500/10 text-purple-600 border-purple-500/15' :
                          'bg-pink-500/10 text-pink-600 border-pink-500/15'
                        }`}>{topic.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        {topic.resourceLink ? (
                          <a href={topic.resourceLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline transition-colors">
                            IndiaBIX Portal
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/30 italic">No link</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={topic.solved || ''}
                          onChange={(e) => handleUpdateAptitudeSolved(topic.id, e.target.value)}
                          placeholder="__ / __"
                          className="w-20 text-center border border-input rounded py-1 px-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-bold placeholder:text-muted-foreground/30"
                        />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-xs">
                        {topic.notes || <span className="text-muted-foreground/20 italic">No notes added</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setEditingAptTopic(topic)}
                          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // HR view
  const renderHR = () => {
    const allTags = [...new Set(hrQuestions.flatMap((q) => q.tags))]
    const filteredHR = hrSelectedTag
      ? hrQuestions.filter((q) => q.tags.includes(hrSelectedTag))
      : hrQuestions

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Filter by focus category</span>
            <select
              value={hrSelectedTag}
              onChange={(e) => setHrSelectedTag(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary w-48 font-semibold cursor-pointer"
            >
              <option value="">All Questions</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Progress: <span className="text-foreground font-bold">{hrCompleted}</span> of <span className="text-foreground font-bold">{hrQuestions.length}</span> questions prepared
          </div>
        </div>

        {filteredHR.length === 0 ? (
          <EmptyState title="No questions match this tag" description="Reset the filter to view all questions." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredHR.map((q) => (
              <div key={q.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggleHRQuestion(q.id)}
                        className={`mt-0.5 shrink-0 transition-colors ${q.completed ? 'text-emerald-500' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                      >
                        {q.completed ? <CheckCircle2 className="w-5 h-5 fill-emerald-500/10" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <h4 className={`font-bold text-sm leading-snug ${q.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                        {q.question}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleEditHRClick(q)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary/60 transition-colors shrink-0 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {q.tags.map((tag: string) => (
                        <span key={tag} className="text-[9px] font-extrabold uppercase bg-secondary/80 text-secondary-foreground border border-border px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.draftAnswer ? (
                    <div className="bg-secondary/15 border border-border/40 rounded-lg p-3 text-xs leading-relaxed text-foreground">
                      <div className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        My Response (STAR Structure)
                      </div>
                      <p className="whitespace-pre-wrap">{q.draftAnswer}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/40 italic py-6 text-center border border-dashed border-border/60 rounded-lg bg-secondary/5">
                      No response drafted yet. Click the edit icon to write your answer.
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-muted-foreground mt-5 border-t border-border/40 pt-3 flex justify-between items-center">
                  <span>Source: <span className="font-semibold text-foreground">{q.source || 'General'}</span></span>
                  {q.completed && <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Prepared</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Useful resources */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Useful Interview Links & Resources</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Glassdoor Interviews', desc: 'Read real interview questions, candidate experiences, and hiring reviews for thousands of companies.', link: 'https://www.glassdoor.com/Interview/index.htm', label: 'Explore Glassdoor' },
              { title: 'Indeed Behavioral Guide', desc: 'A definitive guide on how to answer behavioral interview questions using the STAR framework with templates.', link: 'https://www.indeed.com/career-advice/interviewing/behavioral-interview-questions', label: 'Read STAR Guide' },
              { title: 'CareerCup', desc: 'A massive repository of technical and behavioral interview questions asked in top-tier tech placements.', link: 'https://www.careercup.com/', label: 'View CareerCup' },
              { title: 'Levels.fyi Prep Guide', desc: 'Read salary breakdowns, interview formats, negotiation tips, and behavioral metrics guides.', link: 'https://www.levels.fyi/blog/', label: 'View Levels.fyi' }
            ].map((res) => (
              <a key={res.title} href={res.link} target="_blank" rel="noopener noreferrer" className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary hover:shadow transition-all group flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    {res.title}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">{res.desc}</p>
                </div>
                <span className="text-[9px] font-bold text-primary mt-3 group-hover:underline">{res.label} &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Certifications view
  const renderCertifications = () => {
    const filteredCerts = certifications.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(certSearch.toLowerCase()) || c.provider.toLowerCase().includes(certSearch.toLowerCase())
      const matchStatus = !certStatusFilter || c.status === certStatusFilter
      return matchSearch && matchStatus
    })

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search certifications..."
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={certStatusFilter}
              onChange={(e) => setCertStatusFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <Button onClick={handleAddCert} className="gap-1.5 h-8 text-xs font-bold bg-primary text-primary-foreground shrink-0 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Add certification
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCerts.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-card border border-border rounded-xl">
              <EmptyState title="No certifications found" description="Click 'Add certification' to start logging." />
            </div>
          ) : (
            filteredCerts.map((cert) => {
              const alert = getDeadlineAlert(cert)
              return (
                <div key={cert.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">{cert.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{cert.provider}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${alert.color} flex items-center gap-1`}>
                        <alert.icon className="w-3 h-3" />
                        {alert.label}
                      </span>
                    </div>

                    {cert.notes && (
                      <p className="text-xs text-muted-foreground bg-secondary/10 p-3 rounded-lg border border-border/30 max-h-24 overflow-y-auto leading-relaxed">
                        {cert.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-0.5 text-muted-foreground">
                      {cert.status === 'Completed' ? (
                        <>
                          <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wider">Earned Date</span>
                          <span className="font-semibold text-foreground">{cert.earnedDate || '—'}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wider">Target Deadline</span>
                          <span className="font-semibold text-foreground">{cert.deadline || '—'}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {cert.link && (
                        <a href={cert.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary text-primary transition-colors" title="Credential Info">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => { setEditingCertId(cert.id); setCertFormData({ ...cert }) }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Edit Certification">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setCertDeleteId(cert.id)} className="p-1.5 rounded hover:bg-rose-500/10 text-rose-600 transition-colors cursor-pointer" title="Delete Certification">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
  // Projects view
  const renderProjects = () => {
    const filteredProjects = projects.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        p.techStack.some(t => t.toLowerCase().includes(projectSearchQuery.toLowerCase()))
      const matchesStatus = projectFilterStatus ? p.status === projectFilterStatus : true
      return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Done': return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        case 'In Progress': return 'bg-amber-100 text-amber-700 border border-amber-200'
        default: return 'bg-blue-100 text-blue-700 border border-blue-200'
      }
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects or tech stack..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={projectFilterStatus}
              onChange={(e) => setProjectFilterStatus(e.target.value)}
              className="w-full sm:w-44 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Progress: <span className="text-foreground font-bold">{projectsDone}</span> of <span className="text-foreground font-bold">{projectsTotal}</span> projects done
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState title="No projects match your search" description="Reset the filter or search to view all projects." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-foreground leading-snug">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 5).map((tech: string) => (
                        <span key={tech} className="text-[9px] font-extrabold uppercase bg-secondary/80 text-secondary-foreground border border-border px-2 py-0.5 rounded-full">
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 5 && (
                        <span className="text-[9px] text-muted-foreground font-medium">+{project.techStack.length - 5} more</span>
                      )}
                    </div>
                  )}

                  {project.notes && (
                    <p className="text-xs text-muted-foreground bg-secondary/10 p-3 rounded-lg border border-border/30 max-h-20 overflow-y-auto leading-relaxed">
                      {project.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Live
                      </a>
                    )}
                    {project.githubLink && (
                      <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1">
                        <Code2 className="w-3 h-3" />
                        GitHub
                      </a>
                    )}
                  </div>
                  <select
                    value={project.status}
                    onChange={(e) => {
                      setProjects(projects.map(p => p.id === project.id ? { ...p, status: e.target.value as any } : p))
                    }}
                    className="px-2 py-1 rounded-lg border border-input bg-background text-foreground text-[10px] font-semibold cursor-pointer focus:ring-2 focus:ring-primary"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // --- 6. PAGE LAYOUT RETURN ---
  if (!projectsLoaded || !aptitudeLoaded || !hrLoaded || !certsLoaded) {
    return <div className="p-6 bg-background min-h-screen text-muted-foreground">Loading Resources...</div>
  }

  return (
    <div className="min-h-screen bg-background pb-12 flex flex-col">
      <PageHeader
        title="Prep & More"
        icon={activeTab === 'projects' ? Code2 : activeTab === 'hr' ? HelpCircle : Award}
        description={
          activeTab === 'projects' ? 'Track your project status, tech stack, and next steps.' :
          activeTab === 'hr' ? 'Draft STAR behavioural responses for placement interviews.' :
          'Track earned credentials, target deadlines, and professional IT certifications.'
        }
        progressValue={
          activeTab === 'projects' ? projectsProgress :
          activeTab === 'hr' ? hrProgress : certsProgress
        }
        progressLabel={
          activeTab === 'projects' ? 'Projects Completed' :
          activeTab === 'hr' ? 'Behavioral Questions Answered' : 'Certifications Progress'
        }
        accentColor="--color-module-aptitude"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6 w-full flex-1">
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'hr' && renderHR()}
        {activeTab === 'certifications' && renderCertifications()}
      </div>

      {/* --- MODALS & DIALOGS --- */}
      {/* Aptitude Notes Modal */}
      {editingAptTopic !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/35">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Edit Formulas & Notes</h3>
              <button onClick={() => setEditingAptTopic(null)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Topic</label>
                <input type="text" value={editingAptTopic.name} disabled className="w-full px-3 py-1.5 rounded-lg border bg-secondary/30 text-muted-foreground cursor-not-allowed font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Personal Notes / Formulas</label>
                <textarea id="edit-topic-notes" defaultValue={editingAptTopic.notes || ''} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary leading-relaxed" rows={5} placeholder="Record shortcuts..." />
              </div>
            </div>
            <div className="p-4 border-t border-border bg-secondary/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingAptTopic(null)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const notes = (document.getElementById('edit-topic-notes') as HTMLTextAreaElement).value
                handleSaveAptitudeNotes(editingAptTopic.id, notes)
              }}>Save Notes</Button>
            </div>
          </div>
        </div>
      )}

      {/* HR Edit Answer Modal */}
      {editingHRId !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/35">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Refine STAR Answer</h3>
              <button onClick={() => setEditingHRId(null)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Behavioral Question</label>
                <textarea value={hrFormData.question || ''} disabled className="w-full px-3 py-2 rounded-lg border bg-secondary/30 text-muted-foreground cursor-not-allowed leading-relaxed font-semibold" rows={2} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">My Response (STAR Structure)</label>
                <textarea value={hrFormData.draftAnswer || ''} onChange={(e) => setHrFormData({ ...hrFormData, draftAnswer: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-xs leading-relaxed focus:ring-2 focus:ring-primary" rows={7} placeholder="Situation: Set the context...\nTask: What was the goal?\nAction: What did you do?\nResult: What was the outcome?" />
              </div>
            </div>
            <div className="p-4 border-t border-border bg-secondary/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingHRId(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveHRQuestion}>Save Response</Button>
            </div>
          </div>
        </div>
      )}

      {/* Certifications Add/Edit Modal */}
      {editingCertId !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/35">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                {editingCertId === 'new' ? 'Add Certification' : 'Edit Certification'}
              </h3>
              <button onClick={() => setEditingCertId(null)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Certification Name</label>
                  <input type="text" value={certFormData.name || ''} onChange={(e) => setCertFormData({ ...certFormData, name: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="AWS Solution Architect" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Provider</label>
                  <input type="text" value={certFormData.provider || ''} onChange={(e) => setCertFormData({ ...certFormData, provider: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="Amazon Web Services" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Status</label>
                  <select value={certFormData.status || 'Not Started'} onChange={(e) => setCertFormData({ ...certFormData, status: e.target.value as any })} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                {certFormData.status === 'Completed' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase text-[9px]">Earned Date</label>
                    <input type="date" value={certFormData.earnedDate || ''} onChange={(e) => setCertFormData({ ...certFormData, earnedDate: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase text-[9px]">Target Deadline</label>
                    <input type="date" value={certFormData.deadline || ''} onChange={(e) => setCertFormData({ ...certFormData, deadline: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Credentials Info / Exam Syllabus Link</label>
                <input type="text" value={certFormData.link || ''} onChange={(e) => setCertFormData({ ...certFormData, link: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="Official syllabus page" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">My Study Notes / Details</label>
                <textarea value={certFormData.notes || ''} onChange={(e) => setCertFormData({ ...certFormData, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary leading-relaxed" rows={4} placeholder="Study guidelines..." />
              </div>
            </div>
            <div className="p-4 border-t border-border bg-secondary/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingCertId(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveCert}>Save Certification</Button>
            </div>
          </div>
        </div>
      )}

      {/* Certifications Delete Confirm */}
      <ConfirmDialog
        isOpen={certDeleteId !== null}
        title="Delete Certification Log"
        description="Are you sure you want to delete this certification? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteCertConfirm}
        onCancel={() => setCertDeleteId(null)}
      />
    </div>
  )
}

export default function PrepResourcesPage() {
  return (
    <Suspense fallback={<div className="p-6 bg-background min-h-screen text-muted-foreground">Loading Prep Resources...</div>}>
      <PrepResourcesContent />
    </Suspense>
  )
}
