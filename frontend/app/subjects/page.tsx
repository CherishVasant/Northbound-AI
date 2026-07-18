'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, Plus, Trash2, Edit2, Book, ExternalLink, CheckCircle2, Circle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Badge } from '@/components/shared/Badge'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { Subject, Topic, STORAGE_KEYS, generateId } from '@/lib/utils/storage'
import { SEED_SUBJECTS } from '@/lib/utils/mockData'
import { formatPercentage } from '@/lib/utils'

function SubjectsPageContent() {
  const [savedSubjects, setSavedSubjects, isLoaded] = useLocalStorage<any[]>(
    STORAGE_KEYS.SUBJECTS,
    []
  )

  // Merge static subjects checklist with user progress ticks
  const subjects = useMemo(() => {
    return SEED_SUBJECTS.map((staticSubj) => {
      const savedSubj = savedSubjects?.find((s) => s.id === staticSubj.id)
      return {
        ...staticSubj,
        topics: staticSubj.topics.map((staticTopic) => {
          const savedTopic = savedSubj?.topics?.find((t: any) => t.id === staticTopic.id)
          return {
            ...staticTopic,
            completed: savedTopic ? savedTopic.completed : false,
            notes: savedTopic ? savedTopic.notes : staticTopic.notes,
          }
        }),
      }
    })
  }, [savedSubjects])

  const searchParams = useSearchParams()

  // Listen for hash/query changes to scroll to specific subject cards
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash
      const subjectParam = searchParams.get('subject')
      const targetId = hash ? hash.substring(1) : subjectParam ? `subject-${subjectParam}` : ''
      
      if (targetId) {
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
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string; topic: Topic } | null>(null)
  const [deleteTopicInfo, setDeleteTopicInfo] = useState<{ subjectId: string; topicId: string } | null>(null)

  // Calculate overall progress
  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0)
  const completedTopics = subjects.reduce(
    (sum, s) => sum + s.topics.filter((t) => t.completed).length,
    0
  )
  const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  const handleToggleTopic = (subjectId: string, topicId: string) => {
    const updated = [...(savedSubjects || [])]
    let subjIdx = updated.findIndex((s) => s.id === subjectId)
    if (subjIdx === -1) {
      updated.push({ id: subjectId, topics: [] })
      subjIdx = updated.length - 1
    }
    const subj = { ...updated[subjIdx] }
    subj.topics = [...(subj.topics || [])]
    const topicIdx = subj.topics.findIndex((t: any) => t.id === topicId)
    if (topicIdx > -1) {
      subj.topics[topicIdx] = { ...subj.topics[topicIdx], completed: !subj.topics[topicIdx].completed }
    } else {
      subj.topics.push({ id: topicId, completed: true, notes: '' })
    }
    updated[subjIdx] = subj
    setSavedSubjects(updated)
  }

  const handleSaveTopicDetails = (subjectId: string, topicId: string, name: string, link: string, notes: string) => {
    const updated = [...(savedSubjects || [])]
    let subjIdx = updated.findIndex((s) => s.id === subjectId)
    if (subjIdx === -1) {
      updated.push({ id: subjectId, topics: [] })
      subjIdx = updated.length - 1
    }
    const subj = { ...updated[subjIdx] }
    subj.topics = [...(subj.topics || [])]
    const topicIdx = subj.topics.findIndex((t: any) => t.id === topicId)
    if (topicIdx > -1) {
      subj.topics[topicIdx] = { ...subj.topics[topicIdx], notes }
    } else {
      subj.topics.push({ id: topicId, notes, completed: false })
    }
    updated[subjIdx] = subj
    setSavedSubjects(updated)
    setEditingTopic(null)
  }

  if (!isLoaded) return <div className="p-6 bg-background min-h-screen text-muted-foreground">Loading Core Subjects...</div>

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Core Subjects"
        icon={Book}
        description="Master essential computer science fundamentals required for technical placements."
        progressValue={overallProgress}
        progressLabel="CS Topics Completed"
        accentColor="--color-module-subjects"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Progress Metrics row */}
        <div className="grid gap-4 grid-cols-3">
          <div className="bg-card card-soft p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Syllabus Topics</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{totalTopics}</p>
          </div>
          <div className="bg-card card-soft p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed Topics</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{completedTopics}</p>
          </div>
          <div className="bg-card card-soft p-4">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Remaining Topics</p>
            <p className="text-2xl font-extrabold text-orange-600 mt-1">{totalTopics - completedTopics}</p>
          </div>
        </div>

        {/* Active Subject checklist card (Only shows the active subject) */}
        <div className="space-y-4">
          {(() => {
            const subjectParam = searchParams.get('subject') || 'os'
            const activeSubject = subjects.find(s => s.id === subjectParam) || subjects[0]
            if (!activeSubject) return null

            const subjectCompleted = activeSubject.topics.filter((t) => t.completed).length
            const subjectProgress =
              activeSubject.topics.length > 0
                ? (subjectCompleted / activeSubject.topics.length) * 100
                : 0

            return (
              <div
                key={activeSubject.id}
                id={`subject-${activeSubject.id}`}
                className="bg-card card-soft overflow-hidden scroll-mt-20"
              >
                {/* Subject Header (Not collapsible) */}
                <div
                  className="px-6 py-4 flex items-center justify-between border-b border-border bg-secondary/15"
                >
                  <div className="flex-1 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-primary/10 text-primary">
                        <Book className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-foreground text-base">
                        {activeSubject.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 max-w-md">
                      <div className="flex-1">
                        <ProgressBar
                          value={subjectProgress}
                          showPercentage={false}
                          size="sm"
                          accentColor="--color-module-subjects"
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {subjectCompleted} of {activeSubject.topics.length} complete ({formatPercentage(subjectProgress)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist Table (Always Visible) */}
                <div className="bg-secondary/5 p-6 space-y-4">
                    <div className="overflow-x-auto rounded-lg bg-card">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                            <th className="px-4 py-2.5 w-12 text-center">Status</th>
                            <th className="px-4 py-2.5">Topic Name</th>
                            <th className="px-4 py-2.5">Resource Link</th>
                            <th className="px-4 py-2.5">Personal Notes</th>
                            <th className="px-4 py-2.5 w-24 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {activeSubject.topics.map((topic) => (
                            <tr key={topic.id} className="hover:bg-secondary/20 border-b border-border last:border-0 transition-colors">
                              {/* Status Checkbox */}
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleToggleTopic(activeSubject.id, topic.id)}
                                  className={`p-1 rounded-full hover:bg-secondary transition-colors ${
                                    topic.completed ? 'text-emerald-600' : 'text-muted-foreground/30 hover:text-muted-foreground'
                                  }`}
                                >
                                  {topic.completed ? (
                                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/10" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>
                              </td>

                              {/* Topic Name */}
                              <td className="px-4 py-3 font-semibold text-foreground text-sm">
                                <span className={topic.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}>
                                  {topic.name}
                                </span>
                              </td>

                              {/* Resource Link */}
                              <td className="px-4 py-3">
                                {topic.resourceLink ? (
                                  <a
                                    href={topic.resourceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                                  >
                                    View Resource
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/30 italic">No link</span>
                                )}
                              </td>

                              {/* Personal Notes */}
                              <td className="px-4 py-3 max-w-sm truncate text-muted-foreground">
                                {topic.notes || <span className="text-muted-foreground/20 italic">No notes captured</span>}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingTopic({ subjectId: activeSubject.id, topic })}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                                    title="Edit Personal Notes"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Edit Topic Modal */}
      {editingTopic !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card overlay-soft w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Edit Personal Notes
              </h3>
              <button 
                onClick={() => setEditingTopic(null)} 
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Topic Name</label>
                <input
                  type="text"
                  id="edit-topic-name"
                  value={editingTopic.topic.name}
                  disabled
                  className="w-full px-3 py-1.5 pill-soft bg-secondary/30 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Resource Link</label>
                <input
                  type="text"
                  id="edit-topic-link"
                  value={editingTopic.topic.resourceLink}
                  disabled
                  className="w-full px-3 py-1.5 pill-soft bg-secondary/30 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Personal Notes</label>
                <textarea
                  id="edit-topic-notes"
                  defaultValue={editingTopic.topic.notes}
                  className="w-full px-3 py-1.5 pill-soft bg-background text-foreground"
                  rows={4}
                  placeholder="Summarize key definitions, exceptions, and formulas..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-secondary/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingTopic(null)} className="h-8 text-xs font-semibold">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  const notes = (document.getElementById('edit-topic-notes') as HTMLTextAreaElement).value
                  handleSaveTopicDetails(editingTopic.subjectId, editingTopic.topic.id, editingTopic.topic.name, editingTopic.topic.resourceLink, notes)
                }} 
                className="h-8 text-xs font-semibold"
              >
                Save Notes
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Core Subjects...</div>}>
      <SubjectsPageContent />
    </Suspense>
  )
}
