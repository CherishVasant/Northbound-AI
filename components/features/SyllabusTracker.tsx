'use client'

import { useState } from 'react'
import { ChevronDown, Check, Bookmark } from 'lucide-react'
import { SyllabusSubject, SyllabusTopic } from '@/lib/utils/storage'
import { ProgressBar } from '@/components/shared/ProgressBar'

interface SyllabusTrackerProps {
  subjects: SyllabusSubject[]
  onUpdateTopic: (subjectId: string, topicId: string, completed: boolean) => void
  onUpdateSubtopic: (subjectId: string, topicId: string, subtopicId: string, completed: boolean) => void
}

export function SyllabusTracker({ subjects, onUpdateTopic, onUpdateSubtopic }: SyllabusTrackerProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({})
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }))
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }))
  }

  return (
    <div className="space-y-4">
      {subjects.map(subject => (
        <div key={subject.id} className="card-soft bg-card overflow-hidden">
          {/* Subject Header */}
          <button
            onClick={() => toggleSubject(subject.id)}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedSubjects[subject.id] ? 'rotate-180' : ''}`}
            />
            <span className="text-2xl">{subject.icon}</span>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">{subject.name}</h3>
              <p className="text-sm text-muted-foreground">{subject.description}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{Math.round(subject.completionPercentage)}%</p>
              <div className="w-24">
                <ProgressBar value={subject.completionPercentage} showPercentage={false} size="sm" />
              </div>
            </div>
          </button>

          {/* Topics List */}
          {expandedSubjects[subject.id] && (
            <div className="border-t border-border divide-y divide-border">
              {subject.topics.map(topic => (
                <div key={topic.id} className="bg-secondary/20">
                  {/* Topic Header */}
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ml-8 ${expandedTopics[topic.id] ? 'rotate-180' : ''}`}
                    />
                    <input
                      type="checkbox"
                      checked={topic.completed}
                      onChange={(e) => {
                        e.stopPropagation()
                        onUpdateTopic(subject.id, topic.id, e.target.checked)
                      }}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                    <span className={`flex-1 text-left text-sm font-medium ${topic.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {topic.name}
                    </span>
                  </button>

                  {/* Subtopics */}
                  {expandedTopics[topic.id] && topic.subtopics && (
                    <div className="divide-y divide-border/50 bg-secondary/10">
                      {topic.subtopics.map(subtopic => (
                        <div key={subtopic.id} className="px-6 py-2 flex items-center gap-3">
                          <span className="w-16" />
                          <input
                            type="checkbox"
                            checked={subtopic.completed}
                            onChange={(e) => {
                              onUpdateSubtopic(subject.id, topic.id, subtopic.id, e.target.checked)
                            }}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                          <span className={`flex-1 text-sm ${subtopic.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {subtopic.name}
                          </span>
                          {subtopic.resourceLink && (
                            <a href={subtopic.resourceLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              Learn →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
