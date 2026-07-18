'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ChevronUp,
  ChevronDown,
  Search,
  ExternalLink,
  Code,
  Copy,
  Check,
  Edit2,
  Trash2,
  Zap,
  Grid,
  ListFilter,
  Plus,
  Maximize2
} from 'lucide-react'
import { DSAProblem } from '@/lib/utils/storage'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/ui/button'

const TOPICS_LIST = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search',
  'Stack', 'Queue', 'Linked List', 'Trees', 'BST', 'Heap', 'Graphs', 'Tries',
  'Greedy', 'Dynamic Programming', 'Backtracking', 'Bit Manipulation', 'Prefix Sum',
  'Monotonic Stack', 'Monotonic Queue', 'Union Find', 'Segment Tree', 'Fenwick Tree',
  'Recursion', 'Math', 'Matrix', 'Design', 'Simulation'
]

interface DSATableProps {
  problems: DSAProblem[]
  onSelectProblem?: (problem: DSAProblem) => void
  onEditProblem?: (problem: DSAProblem) => void
  onDeleteProblem?: (problemId: string) => void
  onAIAssist?: (problem: DSAProblem) => void
  onAddProblem?: () => void
}

type SortField = 'problemName' | 'difficulty' | 'status' | 'dateAdded' | 'lastRevised' | 'pattern' | 'topic'
type SortDirection = 'asc' | 'desc'

const ITEMS_PER_PAGE = 10

export function DSATable({
  problems,
  onSelectProblem,
  onEditProblem,
  onDeleteProblem,
  onAIAssist,
  onAddProblem
}: DSATableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('dateAdded')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [filterPattern, setFilterPattern] = useState<string>('')

  const searchParams = useSearchParams()

  useEffect(() => {
    const diffParam = searchParams.get('difficulty') || ''
    setFilterDifficulty(diffParam)
    
    const statParam = searchParams.get('status') || ''
    setFilterStatus(statParam)
    
    setCurrentPage(1)
  }, [searchParams])

  // View settings
  const [groupByTopic, setGroupByTopic] = useState(false)
  
  // Expanded cells (modal content)
  const [expandedCellText, setExpandedCellText] = useState<{ title: string; content: string } | null>(null)
  // Collapsed code sniper status by problem ID
  const [expandedCodeIds, setExpandedCodeIds] = useState<Record<string, boolean>>({})
  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleCodeExpand = (id: string) => {
    setExpandedCodeIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Retrieve unique patterns for filter select
  const uniquePatterns = useMemo(() => {
    return [...new Set(problems.map(p => p.pattern).filter(Boolean))]
  }, [problems])

  // Filter and sort problems logic
  const filteredProblems = useMemo(() => {
    let result = problems.filter(p => {
      const matchesSearch =
        p.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.approach || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.personalNotes || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDifficulty = !filterDifficulty || p.difficulty === filterDifficulty
      const matchesStatus = !filterStatus || p.status === filterStatus
      const matchesTopic = !filterTopic || p.topic === filterTopic
      const matchesPattern = !filterPattern || p.pattern === filterPattern

      return matchesSearch && matchesDifficulty && matchesStatus && matchesTopic && matchesPattern
    })

    result.sort((a, b) => {
      let aVal: any = a[sortField] || ''
      let bVal: any = b[sortField] || ''
      
      if (sortField === 'difficulty') {
        const order = { 'Easy': 0, 'Medium': 1, 'Hard': 2 }
        aVal = order[a.difficulty as keyof typeof order]
        bVal = order[b.difficulty as keyof typeof order]
      }
      if (sortField === 'status') {
        const order = { 'Not Started': 0, 'In Progress': 1, 'Reviewed': 2, 'Mastered': 3 }
        aVal = order[a.status as keyof typeof order]
        bVal = order[b.status as keyof typeof order]
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [problems, searchQuery, sortField, sortDirection, filterDifficulty, filterStatus, filterTopic, filterPattern])

  // Pagination logic (only applied when NOT grouping)
  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE)
  const paginatedProblems = useMemo(() => {
    if (groupByTopic) return filteredProblems
    return filteredProblems.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [filteredProblems, currentPage, groupByTopic])

  // Group problems by topic
  const groupedProblems = useMemo(() => {
    if (!groupByTopic) return null
    const groups: Record<string, DSAProblem[]> = {}
    
    // Sort topics alphabetically
    filteredProblems.forEach(p => {
      const topic = p.topic || 'Uncategorized'
      if (!groups[topic]) groups[topic] = []
      groups[topic].push(p)
    })
    
    return groups
  }, [filteredProblems, groupByTopic])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors font-semibold"
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
      )}
    </button>
  )

  const renderCellPreview = (text: string | undefined, title: string) => {
    if (!text) return <span className="text-muted-foreground/40 italic">-</span>
    const truncated = text.length > 25 ? text.slice(0, 25) + '...' : text
    return (
      <div 
        onClick={() => setExpandedCellText({ title, content: text })}
        className="group flex items-center justify-between gap-1.5 cursor-pointer max-w-[150px] hover:text-primary transition-colors"
      >
        <span className="truncate text-xs">{truncated}</span>
        <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground transition-opacity" />
      </div>
    )
  }

  const renderTableRows = (rows: DSAProblem[]) => {
    return rows.map(problem => {
      const isCodeExpanded = expandedCodeIds[problem.id] || false
      const problemCode = problem.code || problem.codeSnippet || ''

      return (
        <tr key={problem.id} className="hover:bg-secondary/40 border-b border-border transition-colors">
          {/* Core Fields */}
          <td className="px-4 py-3 min-w-[150px]">
            <div className="font-semibold text-foreground text-sm">{problem.problemName}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
              Added: {new Date(problem.dateAdded).toLocaleDateString()}
            </div>
          </td>
          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{problem.topic || 'General'}</td>
          <td className="px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{problem.pattern}</td>
          
          <td className="px-4 py-3">
            <Badge variant={
              problem.difficulty === 'Easy' ? 'completed' :
              problem.difficulty === 'Medium' ? 'in-progress' :
              'review'
            }>
              {problem.difficulty}
            </Badge>
          </td>
          
          <td className="px-4 py-3">
            <Badge variant={
              problem.status === 'Mastered' ? 'completed' :
              problem.status === 'Interview Ready' ? 'in-progress' :
              'not-started'
            }>
              {problem.status}
            </Badge>
          </td>

          <td className="px-4 py-3">
            {problem.link ? (
              <a 
                href={problem.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                LeetCode
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-muted-foreground/30 italic">-</span>
            )}
          </td>

          {/* Long Text Columns with Expansion Preview */}
          <td className="px-4 py-3">{renderCellPreview(problem.approach, 'Approach')}</td>
          <td className="px-4 py-3">{renderCellPreview(problem.constraints, 'Constraints / Observations')}</td>
          <td className="px-4 py-3">{renderCellPreview(problem.recognitionTrigger, 'Recognition Trigger')}</td>
          <td className="px-4 py-3">{renderCellPreview(problem.keyInsight, 'Key Insight')}</td>
          <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">{problem.timeComplexity || 'O(N)'}</td>
          <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">{problem.spaceComplexity || 'O(1)'}</td>
          <td className="px-4 py-3">{renderCellPreview(problem.pitfalls, 'Pitfalls')}</td>
          <td className="px-4 py-3">{renderCellPreview(problem.explanation, 'Explanation')}</td>

          {/* Collapsible Code Column */}
          <td className="px-4 py-3 min-w-[200px]">
            {problemCode ? (
              <div className="space-y-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleCodeExpand(problem.id)}
                  className="h-7 text-xs gap-1 font-medium bg-background"
                >
                  <Code className="w-3.5 h-3.5" />
                  {isCodeExpanded ? 'Collapse Code' : 'Expand Code'}
                </Button>
                {isCodeExpanded && (
                  <div className="relative mt-1 card-soft bg-secondary/80 p-2 font-mono text-[10px] text-foreground max-w-sm max-h-48 overflow-auto whitespace-pre">
                    <button
                      onClick={() => handleCopyCode(problem.id, problemCode)}
                      className="absolute top-1 right-1 p-1 bg-background pill-soft pill-soft-interactive text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === problem.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {problemCode}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground/30 italic">No code pasted</span>
            )}
          </td>

          <td className="px-4 py-3">{renderCellPreview(problem.personalNotes, 'Notes')}</td>
          
          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
            {problem.lastRevised ? new Date(problem.lastRevised).toLocaleDateString() : '-'}
          </td>

          {/* Actions */}
          <td className="px-4 py-3 text-right">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onAIAssist?.(problem)}
                className="h-8 w-8 text-violet-500 hover:bg-violet-500/10 shrink-0"
                title="Ask AI Assistant"
              >
                <Zap className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEditProblem?.(problem)}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                title="Edit Row"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteProblem?.(problem.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                title="Delete Row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* Controls: Search, Filters, Grouping, Add */}
      <div className="flex flex-col gap-4 card-soft bg-card p-4">
        
        {/* Top line: Search and Add */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search problems, patterns, topics, approaches..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 pill-soft bg-background text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setGroupByTopic(!groupByTopic)}
              variant={groupByTopic ? 'default' : 'outline'}
              className="gap-2 h-9 text-sm"
            >
              <Grid className="w-4 h-4" />
              {groupByTopic ? 'Disable Grouping' : 'Group by Topic'}
            </Button>
            <Button onClick={onAddProblem} className="gap-2 h-9 text-sm">
              <Plus className="w-4 h-4" />
              Add Problem
            </Button>
          </div>
        </div>

        {/* Bottom line: Dynamic filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-border pt-3">
          
          {/* Filter Topic */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter by Topic</label>
            <select
              value={filterTopic}
              onChange={(e) => {
                setFilterTopic(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 pill-soft bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Topics</option>
              {TOPICS_LIST.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {/* Filter Pattern */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter by Pattern</label>
            <select
              value={filterPattern}
              onChange={(e) => {
                setFilterPattern(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 pill-soft bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Patterns</option>
              {uniquePatterns.map((pattern) => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
          </div>

          {/* Filter Difficulty */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => {
                setFilterDifficulty(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 pill-soft bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 pill-soft bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Mastered">Mastered</option>
            </select>
          </div>

        </div>
      </div>

      {/* Database Table Container */}
      <div className="card-soft bg-card overflow-hidden">
        
        {/* If Grouping is active */}
        {groupByTopic ? (
          groupedProblems && Object.keys(groupedProblems).length > 0 ? (
            <div className="divide-y divide-border">
              {Object.entries(groupedProblems).map(([topic, rows]) => (
                <div key={topic} className="p-4 space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    {topic}
                    <span className="text-xs font-normal text-muted-foreground">({rows.length} problems)</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                          <th className="px-4 py-2">Problem</th>
                          <th className="px-4 py-2">Topic</th>
                          <th className="px-4 py-2">Pattern</th>
                          <th className="px-4 py-2">Difficulty</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Link</th>
                          <th className="px-4 py-2">Approach</th>
                          <th className="px-4 py-2">Constraints</th>
                          <th className="px-4 py-2">Trigger</th>
                          <th className="px-4 py-2">Insight</th>
                          <th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2">Space</th>
                          <th className="px-4 py-2">Pitfalls</th>
                          <th className="px-4 py-2">Explanation</th>
                          <th className="px-4 py-2">Code</th>
                          <th className="px-4 py-2">Notes</th>
                          <th className="px-4 py-2">Revised</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderTableRows(rows)}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No grouped problems match your filters.
            </div>
          )
        ) : (
          /* Normal Flat Table view with Pagination */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3"><SortHeader field="problemName" label="Problem" /></th>
                  <th className="px-4 py-3"><SortHeader field="topic" label="Topic" /></th>
                  <th className="px-4 py-3"><SortHeader field="pattern" label="Pattern" /></th>
                  <th className="px-4 py-3"><SortHeader field="difficulty" label="Difficulty" /></th>
                  <th className="px-4 py-3"><SortHeader field="status" label="Status" /></th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Approach</th>
                  <th className="px-4 py-3">Constraints</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3">Insight</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Space</th>
                  <th className="px-4 py-3">Pitfalls</th>
                  <th className="px-4 py-3">Explanation</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3"><SortHeader field="lastRevised" label="Revised" /></th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedProblems.length > 0 ? (
                  renderTableRows(paginatedProblems)
                ) : (
                  <tr>
                    <td colSpan={18} className="text-center py-12 text-muted-foreground text-sm">
                      No problems match your filters. Click "Add Problem" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls (flat view only) */}
      {!groupByTopic && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs card-soft bg-card p-3.5">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProblems.length)}</span> of{' '}
            <span className="font-semibold text-foreground">{filteredProblems.length}</span> problems
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="h-8 text-xs font-semibold"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 text-xs font-semibold"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="h-8 text-xs font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Expand Cell Modal */}
      {expandedCellText && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="overlay-soft bg-card w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{expandedCellText.title}</h3>
              <button 
                onClick={() => setExpandedCellText(null)}
                className="text-xs bg-background pill-soft pill-soft-interactive px-2 py-1 hover:bg-secondary font-semibold"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-sans text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {expandedCellText.content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
