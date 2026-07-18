'use client'

import { useState, useEffect, useMemo, Suspense, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Plus, Trash2, Edit2, BarChart3, ExternalLink, CheckCircle2, Circle, 
  MessageSquare, X, ChevronDown, ChevronUp, Zap, Code, Copy, Check, Search, Clock, ShieldCheck, AlertTriangle, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { DSAProblem, STORAGE_KEYS, generateId } from '@/lib/utils/storage'
import { SEED_DSA_PROBLEMS } from '@/lib/utils/mockData'
import { formatPercentage } from '@/lib/utils'

const STRIVER_SECTIONS = [
  { id: 'arrays', label: 'Arrays', topicName: 'Arrays' },
  { id: 'hashing', label: 'Hashing', topicName: 'Hashing' },
  { id: 'linked-list', label: 'Linked List', topicName: 'Linked List' },
  { id: 'two-pointers', label: 'Two Pointers', topicName: 'Two Pointers' },
  { id: 'greedy', label: 'Greedy', topicName: 'Greedy' },
  { id: 'recursion', label: 'Recursion', topicName: 'Recursion' },
  { id: 'backtracking', label: 'Backtracking', topicName: 'Backtracking' },
  { id: 'binary-search', label: 'Binary Search', topicName: 'Binary Search' },
  { id: 'heap', label: 'Heaps', topicName: 'Heap' },
  { id: 'stack', label: 'Stacks', topicName: 'Stack' },
  { id: 'queue', label: 'Queues', topicName: 'Queue' },
  { id: 'strings', label: 'Strings', topicName: 'Strings' },
  { id: 'trees', label: 'Trees', topicName: 'Trees' },
  { id: 'bst', label: 'BST', topicName: 'BST' },
  { id: 'graphs', label: 'Graphs', topicName: 'Graphs' },
  { id: 'dp', label: 'Dynamic Programming', topicName: 'Dynamic Programming' }
]

function LeetCodeTrackerContent() {
  const searchParams = useSearchParams()
  const filterDifficulty = searchParams.get('difficulty') || ''
  const filterStatus = searchParams.get('status') || ''

  const [savedProgress, setSavedProgress, isLoaded] = useLocalStorage<any[]>(
    STORAGE_KEYS.DSA_PROBLEMS,
    []
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<DSAProblem>>({})
  
  const [aiActive, setAiActive] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<DSAProblem | undefined>()
  
  // Track expanded rows for detailed view
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Listen for hash changes to scroll directly to the section card
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash
      if (hash) {
        const targetId = hash.substring(1)
        const el = document.getElementById(targetId)
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 200)
        }
      }
    }
    handleHashScroll()
    window.addEventListener('hashchange', handleHashScroll)
    return () => window.removeEventListener('hashchange', handleHashScroll)
  }, [searchParams])

  // Sync with global AI Copilot open/close notifications
  useEffect(() => {
    const handleOpen = () => setAiActive(true)
    const handleClose = () => setAiActive(false)
    const handleToggle = () => setAiActive((prev) => !prev)

    window.addEventListener('preptrack_open_ai', handleOpen)
    window.addEventListener('preptrack_close_ai', handleClose)
    window.addEventListener('preptrack_toggle_ai', handleToggle)

    return () => {
      window.removeEventListener('preptrack_open_ai', handleOpen)
      window.removeEventListener('preptrack_close_ai', handleClose)
      window.removeEventListener('preptrack_toggle_ai', handleToggle)
    }
  }, [])

  // Listen to AI autofills
  useEffect(() => {
    const handleAutofillEvent = (e: any) => {
      handleAIAutofill(e.detail)
    };
    window.addEventListener('preptrack_ai_autofill_dsa' as any, handleAutofillEvent)
    return () => {
      window.removeEventListener('preptrack_ai_autofill_dsa' as any, handleAutofillEvent)
    }
  }, [savedProgress])

  // Broadcast active problem selection to AI Assistant
  useEffect(() => {
    if (selectedProblem) {
      window.dispatchEvent(
        new CustomEvent('preptrack_ai_set_context', { detail: selectedProblem })
      )
    }
  }, [selectedProblem])

  // Merge static problems with user saved progress
  const problems = useMemo(() => {
    const staticIds = new Set(SEED_DSA_PROBLEMS.map((p) => p.id))
    const merged = SEED_DSA_PROBLEMS.map((staticProb) => {
      const saved = savedProgress?.find((p) => p.id === staticProb.id)
      return {
        ...staticProb,
        status: (saved?.status || 'Not Started') as any,
        personalNotes: saved?.personalNotes || '',
        approach: saved?.approach || staticProb.approach,
        keyInsight: saved?.keyInsight || staticProb.keyInsight,
        timeComplexity: saved?.timeComplexity || staticProb.timeComplexity,
        spaceComplexity: saved?.spaceComplexity || staticProb.spaceComplexity,
        code: saved?.code || staticProb.code,
        pitfalls: saved?.pitfalls || staticProb.pitfalls,
        constraints: saved?.constraints || staticProb.constraints,
        recognitionTrigger: saved?.recognitionTrigger || staticProb.recognitionTrigger,
        lastRevised: saved?.lastRevised || staticProb.lastRevised,
        dateAdded: saved?.dateAdded || staticProb.dateAdded,
      }
    })

    // Custom problems
    const customProbs = (savedProgress || [])
      .filter((p) => p.id && !staticIds.has(p.id))
      .map((p) => ({
        id: p.id,
        problemName: p.problemName || 'Custom Problem',
        link: p.link || '',
        pattern: p.pattern || 'Custom',
        dataStructures: p.dataStructures || [],
        topic: p.topic || 'Arrays',
        approach: p.approach || '',
        constraints: p.constraints || '',
        recognitionTrigger: p.recognitionTrigger || '',
        keyInsight: p.keyInsight || '',
        timeComplexity: p.timeComplexity || 'O(N)',
        spaceComplexity: p.spaceComplexity || 'O(1)',
        pitfalls: p.pitfalls || '',
        explanation: p.explanation || '',
        code: p.code || '',
        personalNotes: p.personalNotes || '',
        difficulty: p.difficulty || 'Medium',
        status: (p.status || 'Not Started') as any,
        dateAdded: p.dateAdded || new Date().toISOString(),
        lastRevised: p.lastRevised || new Date().toISOString(),
      }))

    return [...merged, ...customProbs] as DSAProblem[]
  }, [savedProgress])

  // Filter problems based on search, difficulty, and status
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch = 
        p.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.approach || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDifficulty = filterDifficulty ? p.difficulty === filterDifficulty : true
      const matchesStatus = filterStatus ? p.status === filterStatus : true

      return matchesSearch && matchesDifficulty && matchesStatus
    })
  }, [problems, searchQuery, filterDifficulty, filterStatus])

  // Group filtered problems by Striver sections
  const groupedProblems = useMemo(() => {
    const grouped: Record<string, DSAProblem[]> = {}
    STRIVER_SECTIONS.forEach((sec) => {
      grouped[sec.topicName] = []
    })
    grouped['Other'] = []

    filteredProblems.forEach((p) => {
      const topic = p.topic || 'Other'
      if (grouped[topic]) {
        grouped[topic].push(p)
      } else {
        grouped['Other'].push(p)
      }
    })

    return grouped
  }, [filteredProblems])

  // Overall Statistics
  const totalProblemsCount = SEED_DSA_PROBLEMS.length
  const masteredCount = problems.filter((p) => p.status === 'Mastered').length
  const interviewReadyCount = problems.filter((p) => p.status === 'Interview Ready').length
  const progressPercent = totalProblemsCount > 0 ? (masteredCount / totalProblemsCount) * 100 : 0

  // Toggle problem completion status
  const handleToggleStatus = (id: string, current: string) => {
    const updated = [...(savedProgress || [])]
    const index = updated.findIndex((p) => p.id === id)
    
    // Toggles between 'Not Started' -> 'Mastered' -> 'Interview Ready' -> 'Not Started'
    let nextStatus: 'Not Started' | 'Interview Ready' | 'Mastered' = 'Mastered'
    if (current === 'Mastered') {
      nextStatus = 'Interview Ready'
    } else if (current === 'Interview Ready') {
      nextStatus = 'Not Started'
    }

    if (index > -1) {
      updated[index] = { ...updated[index], status: nextStatus, lastRevised: new Date().toISOString() }
    } else {
      updated.push({ id, status: nextStatus, lastRevised: new Date().toISOString() })
    }
    setSavedProgress(updated)
  }

  // Row expand trigger
  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Copy code helper
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Edit / Add Click Actions
  const handleAddNewProblem = () => {
    const defaultNew: Partial<DSAProblem> = {
      problemName: 'New LeetCode Problem',
      link: '',
      topic: 'Arrays',
      pattern: 'Array Traversal',
      difficulty: 'Medium',
      status: 'Not Started',
      approach: '',
      constraints: '',
      recognitionTrigger: '',
      keyInsight: '',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      pitfalls: '',
      explanation: '',
      code: '',
      personalNotes: '',
    }
    setFormData(defaultNew)
    setEditingId('new')
  }

  const handleEditClick = (problem: DSAProblem) => {
    setFormData({ ...problem })
    setEditingId(problem.id)
  }

  const handleDeleteConfirm = () => {
    if (!deleteId) return
    const updated = (savedProgress || []).filter((p) => p.id !== deleteId)
    setSavedProgress(updated)
    setDeleteId(null)
    if (selectedProblem?.id === deleteId) {
      setSelectedProblem(problems.find((p) => p.id !== deleteId))
    }
  }

  const handleSaveProblem = () => {
    if (!formData.problemName?.trim()) return

    const updated = [...(savedProgress || [])]
    const targetId = editingId === 'new' ? generateId() : editingId
    const index = updated.findIndex((p) => p.id === targetId)

    const freshProgress = {
      ...formData,
      id: targetId,
      lastRevised: new Date().toISOString(),
      dateAdded: formData.dateAdded || new Date().toISOString(),
    }

    if (index > -1) {
      updated[index] = { ...updated[index], ...freshProgress }
    } else {
      updated.push(freshProgress)
    }

    setSavedProgress(updated)
    setEditingId(null)
    setFormData({})

    // Update selectedProblem state
    const mergedObj = problems.find(p => p.id === targetId) || { ...formData, id: targetId }
    setSelectedProblem(mergedObj as DSAProblem)
  }

  // AI autofill parser
  const handleAIAutofill = (generatedFields: Partial<DSAProblem>) => {
    const matchedProb = problems.find(p => p.problemName.toLowerCase().trim() === generatedFields.problemName?.toLowerCase().trim())
    const targetId = matchedProb ? matchedProb.id : generateId();

    const updated = [...(savedProgress || [])]
    const index = updated.findIndex(p => p.id === targetId)

    const freshProgress = {
      ...generatedFields,
      id: targetId,
      lastRevised: new Date().toISOString(),
      dateAdded: matchedProb?.dateAdded || new Date().toISOString()
    }

    if (index > -1) {
      updated[index] = { ...updated[index], ...freshProgress }
    } else {
      updated.push(freshProgress)
    }

    setSavedProgress(updated)
    
    // Find the merged object to set as selected
    const staticProb = SEED_DSA_PROBLEMS.find(p => p.id === targetId)
    const newSelected = {
      ...(staticProb || {}),
      ...freshProgress
    } as DSAProblem
    setSelectedProblem(newSelected)
  }

  if (!isLoaded) return <div className="p-6 bg-background min-h-screen text-muted-foreground">Loading LeetCode Database...</div>

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title="LeetCode Tracker"
        icon={BarChart3}
        description="Master data structures and algorithms using Striver's SDE sheet. Code, review, and track optimal complexity patterns."
        progressValue={progressPercent}
        progressLabel="Striver Problems Mastered"
        accentColor="--color-module-dsa"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6 w-full flex-1">
        {/* Link to Striver's 191 Sheet */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between card-soft bg-card p-4 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Striver's SDE Sheet (191 Problems)</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                The curated, high-quality coding questions selected for placement preparation.
              </p>
            </div>
          </div>
          <a
            href="https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 pill-soft pill-soft-interactive hover:bg-secondary text-xs font-bold text-primary transition-all cursor-pointer bg-background"
          >
            Open Striver's Sheet
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="card-soft bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Striver Sheet</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{totalProblemsCount}</p>
          </div>
          <div className="card-soft bg-card p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Mastered (O(1) Recog.)</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{masteredCount}</p>
          </div>
          <div className="card-soft bg-card p-4">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Interview Ready</p>
            <p className="text-2xl font-extrabold text-orange-600 mt-1">{interviewReadyCount}</p>
          </div>
          <div className="card-soft bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Not Solved</p>
            <p className="text-2xl font-extrabold text-muted-foreground mt-1">
              {problems.filter((p) => p.status === 'Not Started').length}
            </p>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between card-soft bg-card p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search LeetCode problems, patterns, approaches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 pill-soft bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="text-xs flex items-center font-medium gap-2 text-muted-foreground">
              {filterDifficulty && <span className="bg-secondary px-2.5 py-0.5 pill-soft font-bold">Diff: {filterDifficulty}</span>}
              {filterStatus && <span className="bg-secondary px-2.5 py-0.5 pill-soft font-bold">Status: {filterStatus}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNewProblem} className="gap-1.5 h-8 text-xs font-bold bg-primary text-primary-foreground">
              <Plus className="w-3.5 h-3.5" />
              Add custom problem
            </Button>
          </div>
        </div>

        {/* AI Co-pilot banner */}
        <div className="flex justify-between items-center card-soft bg-card p-3 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-violet-500/10 text-violet-500">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">AI Copilot is active. Click Zap on any row to consult.</span>
          </div>
          {!aiActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent('preptrack_open_ai'))}
              className="text-xs font-semibold h-8"
            >
              Open AI Assistant
            </Button>
          )}
        </div>

        {/* Render each Striver section card sequentially */}
        <div className="space-y-8">
          {STRIVER_SECTIONS.map((section, idx) => {
            const sectionProblems = groupedProblems[section.topicName] || []
            if (sectionProblems.length === 0 && (searchQuery || filterDifficulty || filterStatus)) {
              // Hide empty sections during search filtering to keep page clean
              return null
            }

            return (
              <div 
                key={section.id} 
                id={`section-${section.id}`} 
                className="card-soft bg-card overflow-hidden scroll-mt-20"
              >
                {/* Card Title */}
                <div className="p-4 border-b border-border bg-secondary/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Section {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-foreground">{section.label}</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {sectionProblems.length} Problems
                  </span>
                </div>

                {/* Problems Table inside Card */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-4 w-12 text-center">Status</th>
                        <th className="py-2.5 px-4">Problem Name</th>
                        <th className="py-2.5 px-4 w-1/5">Pattern Focus</th>
                        <th className="py-2.5 px-4 w-28">Difficulty</th>
                        <th className="py-2.5 px-4 w-24 text-center">Reference</th>
                        <th className="py-2.5 px-4 w-20 text-center">Details</th>
                        <th className="py-2.5 px-4 w-32 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sectionProblems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground italic text-xs bg-background/30">
                            No problems recorded in this section.
                          </td>
                        </tr>
                      ) : (
                        sectionProblems.map((prob) => {
                          const isExpanded = expandedRowIds[prob.id] || false
                          return (
                            <Fragment key={prob.id}>
                              <tr
                                className={`hover:bg-secondary/10 transition-colors ${
                                  prob.status === 'Mastered' ? 'bg-emerald-500/[0.01]' :
                                  prob.status === 'Interview Ready' ? 'bg-orange-500/[0.01]' : ''
                                }`}
                              >
                                {/* Status checkbox trigger toggle */}
                                <td className="py-2.5 px-4 text-center">
                                  <button
                                    onClick={() => handleToggleStatus(prob.id, prob.status)}
                                    className={`transition-colors focus:outline-none ${
                                      prob.status === 'Mastered' ? 'text-emerald-500' :
                                      prob.status === 'Interview Ready' ? 'text-orange-500' : 'text-muted-foreground/30 hover:text-muted-foreground'
                                    }`}
                                    title={`Status: ${prob.status}. Click to change.`}
                                  >
                                    {prob.status === 'Mastered' ? (
                                      <CheckCircle2 className="w-5 h-5 fill-emerald-500/5" />
                                    ) : prob.status === 'Interview Ready' ? (
                                      <Clock className="w-5 h-5 fill-orange-500/5" />
                                    ) : (
                                      <Circle className="w-5 h-5" />
                                    )}
                                  </button>
                                </td>

                                {/* Name & Pattern */}
                                <td className="py-2.5 px-4">
                                  <button
                                    onClick={() => {
                                      setSelectedProblem(prob)
                                      toggleRowExpand(prob.id)
                                    }}
                                    className="font-bold text-foreground hover:text-primary transition-colors text-left hover:underline block"
                                  >
                                    {prob.problemName}
                                  </button>
                                </td>

                                {/* Pattern tag */}
                                <td className="py-2.5 px-4 text-muted-foreground font-semibold">
                                  {prob.pattern || '—'}
                                </td>

                                {/* Difficulty badge */}
                                <td className="py-2.5 px-4">
                                  <span 
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                      prob.difficulty === 'Easy' 
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
                                        : prob.difficulty === 'Medium'
                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/15'
                                        : 'bg-rose-500/10 text-rose-600 border-rose-500/15'
                                    }`}
                                  >
                                    {prob.difficulty}
                                  </span>
                                </td>

                                {/* Reference LeetCode link */}
                                <td className="py-2.5 px-4 text-center">
                                  {prob.link ? (
                                    <a
                                      href={prob.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-0.5 text-primary font-bold hover:underline"
                                    >
                                      Solve
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground/30 italic">—</span>
                                  )}
                                </td>

                                {/* Collapsible details toggle trigger */}
                                <td className="py-2.5 px-4 text-center">
                                  <button
                                    onClick={() => toggleRowExpand(prob.id)}
                                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary/80 transition-colors"
                                    title="View Notes & Code"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </td>

                                {/* Actions row */}
                                <td className="py-2.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedProblem(prob)
                                        window.dispatchEvent(new CustomEvent('preptrack_open_ai'))
                                      }}
                                      className="h-7 w-7 text-violet-500 hover:bg-violet-500/10 shrink-0"
                                      title="Ask AI Assistant"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleEditClick(prob)}
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                      title="Edit details"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row Detail Container (extremely responsive layout) */}
                              {isExpanded && (
                                <tr key={`expanded-${prob.id}`} className="bg-secondary/15">
                                  <td colSpan={7} className="p-4 border-b border-border/80 text-xs">
                                    <div className="grid gap-5 md:grid-cols-3">
                                      {/* Left block: approach & triggers */}
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Optimal Approach</span>
                                          <p className="mt-0.5 leading-relaxed text-foreground font-medium bg-background/55 p-2 card-soft">
                                            {prob.approach || 'No optimal approach guide logged yet. Edit row to input.'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Key Insight / Optimization Trick</span>
                                          <p className="mt-0.5 leading-relaxed text-violet-700 dark:text-violet-400 font-bold bg-violet-500/5 p-2 rounded border border-violet-500/10">
                                            {prob.keyInsight || 'None logged.'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Recognition Trigger</span>
                                          <p className="mt-0.5 leading-relaxed italic text-muted-foreground bg-background/30 p-2 rounded">
                                            {prob.recognitionTrigger || 'None.'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Middle block: complexity metrics */}
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2.5 bg-background p-2 card-soft">
                                          <div>
                                            <span className="text-[8px] font-extrabold uppercase text-muted-foreground tracking-wider block">Time Complexity</span>
                                            <code className="text-xs font-bold font-mono text-foreground">{prob.timeComplexity || 'O(N)'}</code>
                                          </div>
                                          <div>
                                            <span className="text-[8px] font-extrabold uppercase text-muted-foreground tracking-wider block">Space Complexity</span>
                                            <code className="text-xs font-bold font-mono text-foreground">{prob.spaceComplexity || 'O(1)'}</code>
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Constraints & Observations</span>
                                          <p className="mt-0.5 leading-relaxed font-mono text-[10px] text-foreground bg-background/30 p-2 rounded whitespace-pre-wrap">
                                            {prob.constraints || 'No constraints logged.'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-extrabold uppercase text-rose-600 dark:text-rose-400 tracking-wider block">Common Pitfalls & Bugs</span>
                                          <p className="mt-0.5 leading-relaxed text-rose-600 dark:text-rose-400 font-medium bg-rose-500/[0.02] p-2 rounded border border-rose-500/10">
                                            {prob.pitfalls || 'None logged.'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Right block: Java/Python Solution Code Snippet */}
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Solution Implementation</span>
                                          {prob.code && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleCopyCode(prob.id, prob.code || '')}
                                              className="h-6 text-[9px] gap-1 font-bold"
                                            >
                                              {copiedId === prob.id ? 'Copied!' : 'Copy Code'}
                                            </Button>
                                          )}
                                        </div>
                                        {prob.code ? (
                                          <pre className="p-2 card-soft bg-background text-[9px] font-mono overflow-auto max-h-48 whitespace-pre leading-normal text-foreground">
                                            {prob.code}
                                          </pre>
                                        ) : (
                                          <div className="text-center py-8 text-muted-foreground/35 italic border border-dashed border-border/50 rounded-lg bg-background/10">
                                            No code recorded. Use the AI Assistant row zap to generate one.
                                          </div>
                                        )}
                                        {prob.personalNotes && (
                                          <div className="mt-2 bg-amber-500/[0.02] border border-amber-500/10 p-2 rounded">
                                            <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Revision Notes</span>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{prob.personalNotes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}

          {/* Render custom problems that don't map to any of the 16 Striver categories */}
          {groupedProblems['Other']?.length > 0 && (
            <div id="section-other" className="card-soft bg-card overflow-hidden scroll-mt-20">
              <div className="p-4 border-b border-border bg-secondary/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full">
                    Custom
                  </span>
                  <h3 className="font-bold text-sm text-foreground">Other / Custom Logged Problems</h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {groupedProblems['Other'].length} Problems
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-4 w-12 text-center">Status</th>
                      <th className="py-2.5 px-4">Problem Name</th>
                      <th className="py-2.5 px-4 w-1/5">Topic / Topic Group</th>
                      <th className="py-2.5 px-4 w-28">Difficulty</th>
                      <th className="py-2.5 px-4 w-24 text-center">Reference</th>
                      <th className="py-2.5 px-4 w-20 text-center">Details</th>
                      <th className="py-2.5 px-4 w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {groupedProblems['Other'].map((prob) => {
                      const isExpanded = expandedRowIds[prob.id] || false
                      return (
                        <Fragment key={prob.id}>
                          <tr
                            className={`hover:bg-secondary/10 transition-colors ${
                              prob.status === 'Mastered' ? 'bg-emerald-500/[0.01]' :
                              prob.status === 'Interview Ready' ? 'bg-orange-500/[0.01]' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(prob.id, prob.status)}
                                className={`transition-colors focus:outline-none ${
                                  prob.status === 'Mastered' ? 'text-emerald-500' :
                                  prob.status === 'Interview Ready' ? 'text-orange-500' : 'text-muted-foreground/30 hover:text-muted-foreground'
                                }`}
                              >
                                {prob.status === 'Mastered' ? (
                                  <CheckCircle2 className="w-5 h-5 fill-emerald-500/5" />
                                ) : prob.status === 'Interview Ready' ? (
                                  <Clock className="w-5 h-5 fill-orange-500/5" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                            <td className="py-2.5 px-4">
                              <button
                                onClick={() => {
                                  setSelectedProblem(prob)
                                  toggleRowExpand(prob.id)
                                }}
                                className="font-bold text-foreground hover:text-primary transition-colors text-left hover:underline block"
                              >
                                {prob.problemName}
                              </button>
                            </td>
                            <td className="py-2.5 px-4 text-muted-foreground font-semibold">
                              {prob.topic || '—'} / {prob.pattern || '—'}
                            </td>
                            <td className="py-2.5 px-4">
                              <span 
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                  prob.difficulty === 'Easy' 
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
                                    : prob.difficulty === 'Medium'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/15'
                                    : 'bg-rose-500/10 text-rose-600 border-rose-500/15'
                                }`}
                              >
                                {prob.difficulty}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {prob.link ? (
                                <a
                                  href={prob.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-primary font-bold hover:underline"
                                >
                                  Solve
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground/30 italic">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => toggleRowExpand(prob.id)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary/80 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedProblem(prob)
                                    window.dispatchEvent(new CustomEvent('preptrack_open_ai'))
                                  }}
                                  className="h-7 w-7 text-violet-500 hover:bg-violet-500/10 shrink-0"
                                  title="Ask AI Assistant"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditClick(prob)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                  title="Edit details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>

                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr key={`expanded-${prob.id}`} className="bg-secondary/15">
                              <td colSpan={7} className="p-4 border-b border-border/80 text-xs">
                                <div className="grid gap-5 md:grid-cols-3">
                                  <div className="space-y-3">
                                    <div>
                                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Optimal Approach</span>
                                      <p className="mt-0.5 leading-relaxed text-foreground font-medium bg-background/55 p-2 card-soft">
                                        {prob.approach || 'No optimal approach guide logged yet. Edit row to input.'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Key Insight / Optimization Trick</span>
                                      <p className="mt-0.5 leading-relaxed text-violet-700 dark:text-violet-400 font-bold bg-violet-500/5 p-2 rounded border border-violet-500/10">
                                        {prob.keyInsight || 'None logged.'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2.5 bg-background p-2 card-soft">
                                      <div>
                                        <span className="text-[8px] font-extrabold uppercase text-muted-foreground tracking-wider block">Time Complexity</span>
                                        <code className="text-xs font-bold font-mono text-foreground">{prob.timeComplexity || 'O(N)'}</code>
                                      </div>
                                      <div>
                                        <span className="text-[8px] font-extrabold uppercase text-muted-foreground tracking-wider block">Space Complexity</span>
                                        <code className="text-xs font-bold font-mono text-foreground">{prob.spaceComplexity || 'O(1)'}</code>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Constraints & Observations</span>
                                      <p className="mt-0.5 leading-relaxed font-mono text-[10px] text-foreground bg-background/30 p-2 rounded whitespace-pre-wrap">
                                        {prob.constraints || 'No constraints logged.'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Solution Implementation</span>
                                      {prob.code && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCopyCode(prob.id, prob.code || '')}
                                          className="h-6 text-[9px] gap-1 font-bold"
                                        >
                                          {copiedId === prob.id ? 'Copied!' : 'Copy Code'}
                                        </Button>
                                      )}
                                    </div>
                                    {prob.code ? (
                                      <pre className="p-2 card-soft bg-background text-[9px] font-mono overflow-auto max-h-48 whitespace-pre leading-normal text-foreground">
                                        {prob.code}
                                      </pre>
                                    ) : (
                                      <div className="text-center py-8 text-muted-foreground/35 italic border border-dashed border-border/50 rounded-lg bg-background/10">
                                        No code recorded. Use the AI Assistant row zap to generate one.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Problem Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="overlay-soft bg-card w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/35">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                {editingId === 'new' ? 'Add custom problem' : 'Edit problem metadata'}
              </h3>
              <button 
                onClick={() => setEditingId(null)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Problem Name</label>
                  <input
                    type="text"
                    value={formData.problemName || ''}
                    onChange={(e) => setFormData({ ...formData, problemName: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. 3Sum"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Practice Reference Link</label>
                  <input
                    type="text"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="LeetCode / GFG URL"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Section Topic</label>
                  <select
                    value={formData.topic || 'Arrays'}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {STRIVER_SECTIONS.map((sec) => (
                      <option key={sec.topicName} value={sec.topicName}>{sec.label}</option>
                    ))}
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Difficulty</label>
                  <select
                    value={formData.difficulty || 'Medium'}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Preparation Status</label>
                  <select
                    value={formData.status || 'Not Started'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Interview Ready">Interview Ready</option>
                    <option value="Mastered">Mastered</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Pattern Focus</label>
                  <input
                    type="text"
                    value={formData.pattern || ''}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Sliding Window"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Recognition Trigger Keywords</label>
                  <input
                    type="text"
                    value={formData.recognitionTrigger || ''}
                    onChange={(e) => setFormData({ ...formData, recognitionTrigger: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. subsegment constraints, contiguous unique values"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Time Complexity</label>
                  <input
                    type="text"
                    value={formData.timeComplexity || 'O(N)'}
                    onChange={(e) => setFormData({ ...formData, timeComplexity: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Space Complexity</label>
                  <input
                    type="text"
                    value={formData.spaceComplexity || 'O(1)'}
                    onChange={(e) => setFormData({ ...formData, spaceComplexity: e.target.value })}
                    className="w-full px-3 py-1.5 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Optimal Approach Logic</label>
                <textarea
                  value={formData.approach || ''}
                  onChange={(e) => setFormData({ ...formData, approach: e.target.value })}
                  className="w-full px-3 py-2 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  rows={3}
                  placeholder="Record step-by-step logic summary..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Constraints / Bounds</label>
                  <textarea
                    value={formData.constraints || ''}
                    onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                    className="w-full px-3 py-2 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[10px]"
                    rows={3}
                    placeholder="e.g. N <= 10^5, values contain negatives"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Common Pitfalls / Edge Cases</label>
                  <textarea
                    value={formData.pitfalls || ''}
                    onChange={(e) => setFormData({ ...formData, pitfalls: e.target.value })}
                    className="w-full px-3 py-2 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="e.g. integer overflow, empty/null list references"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Solution Code Snippet (Python/Java)</label>
                <textarea
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[10px]"
                  rows={6}
                  placeholder="class Solution:\n    def solve(self):"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Personal Revision Notes</label>
                <textarea
                  value={formData.personalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, personalNotes: e.target.value })}
                  className="w-full px-3 py-2 pill-soft bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  rows={2}
                  placeholder="Personal learnings, references to other problems, etc."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-secondary/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="h-8 text-xs font-semibold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveProblem} className="h-8 text-xs font-semibold">
                Save Problem
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete LeetCode Problem"
        description="Are you sure you want to delete this problem from your preparation log? This action cannot be undone."
        confirmLabel="Delete Problem"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default function LeetCodeTrackerPage() {
  return (
    <Suspense fallback={<div className="p-6 bg-background min-h-screen text-muted-foreground">Loading LeetCode Tracker...</div>}>
      <LeetCodeTrackerContent />
    </Suspense>
  )
}
