'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Code2,
  Briefcase,
  Brain,
  Award,
  Calendar,
  Clock,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { ReadinessGauge } from '@/components/shared/ReadinessGauge'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { STORAGE_KEYS, DSAProblem, Subject, Project, Certification, AptitudeTopic, ConceptTopic } from '@/lib/utils/storage'
import {
  SEED_DSA_PROBLEMS,
  SEED_SUBJECTS,
  SEED_PROJECTS,
  SEED_CERTIFICATIONS,
  SEED_APTITUDE_TOPICS,
  SEED_CONCEPTS
} from '@/lib/utils/mockData'
import { formatPercentage } from '@/lib/utils'

export default function DashboardPage() {
  const [dsaProblems, setDsaProblems, dsaLoaded] = useLocalStorage<DSAProblem[]>(
    STORAGE_KEYS.DSA_PROBLEMS,
    SEED_DSA_PROBLEMS
  )
  const [subjects, setSubjects, subjectsLoaded] = useLocalStorage<Subject[]>(
    STORAGE_KEYS.SUBJECTS,
    SEED_SUBJECTS
  )
  const [projects, setProjects, projectsLoaded] = useLocalStorage<Project[]>(
    STORAGE_KEYS.PROJECTS,
    SEED_PROJECTS
  )
  const [certifications, setCertifications, certsLoaded] = useLocalStorage<Certification[]>(
    STORAGE_KEYS.CERTIFICATIONS,
    SEED_CERTIFICATIONS
  )
  const [aptitudeTopics, setAptitudeTopics, aptitudeLoaded] = useLocalStorage<AptitudeTopic[]>(
    STORAGE_KEYS.APTITUDE_TOPICS,
    SEED_APTITUDE_TOPICS
  )
  const [concepts, setConcepts, conceptsLoaded] = useLocalStorage<ConceptTopic[]>(
    STORAGE_KEYS.CONCEPTS,
    SEED_CONCEPTS
  )

  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (dsaLoaded && subjectsLoaded && projectsLoaded && certsLoaded && aptitudeLoaded && conceptsLoaded) {
      setIsLoaded(true)
    }
  }, [dsaLoaded, subjectsLoaded, projectsLoaded, certsLoaded, aptitudeLoaded, conceptsLoaded])

  // Reset database helper
  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all preparation data to default? This will clear your custom edits and reset your progress.")) {
      window.localStorage.removeItem(STORAGE_KEYS.DSA_PROBLEMS)
      window.localStorage.removeItem(STORAGE_KEYS.SUBJECTS)
      window.localStorage.removeItem(STORAGE_KEYS.PROJECTS)
      window.localStorage.removeItem(STORAGE_KEYS.APTITUDE_TOPICS)
      window.localStorage.removeItem(STORAGE_KEYS.CERTIFICATIONS)
      window.localStorage.removeItem(STORAGE_KEYS.CONCEPTS)
      window.location.reload()
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading PrepTrack...</p>
        </div>
      </div>
    )
  }

  // --- CALCULATE STATISTICS ---
  // DSA Progress
  const dsaTotal = dsaProblems.length
  const dsaCompleted = dsaProblems.filter((p) => p.status === 'Mastered' || p.status === 'Interview Ready').length
  const dsaProgress = dsaTotal > 0 ? (dsaCompleted / dsaTotal) * 100 : 0

  // Subjects Progress
  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0)
  const completedTopics = subjects.reduce((sum, s) => sum + s.topics.filter((t) => t.completed).length, 0)
  const subjectsProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  // Projects Progress
  const projectsTotal = projects.length
  const projectsDone = projects.filter((p) => p.status === 'Done').length
  const projectsProgress = projectsTotal > 0 ? (projectsDone / projectsTotal) * 100 : 0

  // Aptitude Progress
  const aptitudeTotal = aptitudeTopics.length
  const aptitudeCompleted = aptitudeTopics.filter((t) => t.completed).length
  const aptitudeProgress = aptitudeTotal > 0 ? (aptitudeCompleted / aptitudeTotal) * 100 : 0

  // Certifications Progress
  const certsTotal = certifications.length
  const certsCompleted = certifications.filter((c) => c.status === 'Completed').length
  const certsProgress = certsTotal > 0 ? (certsCompleted / certsTotal) * 100 : 0

  // Concepts Progress
  const conceptsTotal = concepts.length
  const conceptsCompleted = concepts.filter((c) => c.status === 'Mastered').length
  const conceptsProgress = conceptsTotal > 0 ? (conceptsCompleted / conceptsTotal) * 100 : 0

  // Overall Placement Readiness Score
  const totalItems = dsaTotal + totalTopics + projectsTotal + aptitudeTotal + certsTotal + conceptsTotal
  const totalCompleted = dsaCompleted + completedTopics + projectsDone + aptitudeCompleted + certsCompleted + conceptsCompleted
  const overallReadiness = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0

  // --- CONTINUE LEARNING DYNAMIC RESOLVER ---
  // Find the most recently touched (lastRevised or dateAdded) incomplete DSA problem, or an incomplete subject topic
  const incompleteProblems = dsaProblems
    .filter((p) => p.status !== 'Mastered')
    .sort((a, b) => new Date(b.lastRevised || b.dateAdded).getTime() - new Date(a.lastRevised || a.dateAdded).getTime())

  const continueProblem = incompleteProblems[0]

  // --- UPCOMING CERTIFICATIONS ---
  const upcomingCertifications = certifications
    .filter((c) => c.status !== 'Completed' && c.deadline)
    .map((c) => {
      const diffTime = new Date(c.deadline).getTime() - Date.now()
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { ...c, daysLeft }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3)

  // --- RECENT DSA PROBLEMS ---
  const recentDSA = [...dsaProblems]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 3)

  // --- DYNAMIC ACTIVITY LOG ---
  // Collect activities, sort them by dates
  interface ActivityItem {
    id: string
    type: 'dsa' | 'subject' | 'project' | 'cert'
    title: string
    subtitle: string
    date: string
    icon: any
    color: string
  }

  const activities: ActivityItem[] = []

  dsaProblems.forEach(p => {
    activities.push({
      id: `dsa-${p.id}`,
      type: 'dsa',
      title: p.status === 'Mastered' ? `Mastered ${p.problemName}` : p.status === 'Interview Ready' ? `Interview Ready ${p.problemName}` : `Added problem ${p.problemName}`,
      subtitle: `Topic: ${p.topic || 'General'} • Pattern: ${p.pattern}`,
      date: p.lastRevised || p.dateAdded,
      icon: Code2,
      color: 'text-pink-500 bg-pink-500/10'
    })
  })

  subjects.forEach(s => {
    s.topics.filter(t => t.completed).forEach(t => {
      activities.push({
        id: `topic-${t.id}`,
        type: 'subject',
        title: `Completed ${t.name}`,
        subtitle: `Core Subject: ${s.name}`,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Mock offset date
        icon: BookOpen,
        color: 'text-violet-500 bg-violet-500/10'
      })
    })
  })

  projects.forEach(p => {
    if (p.status === 'Done' || p.status === 'In Progress') {
      activities.push({
        id: `project-${p.id}`,
        type: 'project',
        title: p.status === 'Done' ? `Completed ${p.name}` : `Started ${p.name}`,
        subtitle: `Tech stack: ${p.techStack.slice(0, 3).join(', ')}`,
        date: p.startDate ? new Date(p.startDate).toISOString() : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        icon: Briefcase,
        color: 'text-orange-500 bg-orange-500/10'
      })
    }
  })

  certifications.forEach(c => {
    if (c.status === 'Completed') {
      activities.push({
        id: `cert-${c.id}`,
        type: 'cert',
        title: `Earned ${c.name}`,
        subtitle: `Provider: ${c.provider}`,
        date: c.earnedDate ? new Date(c.earnedDate).toISOString() : new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        icon: Award,
        color: 'text-yellow-500 bg-yellow-500/10'
      })
    }
  })

  concepts.forEach(c => {
    if (c.status === 'Mastered') {
      activities.push({
        id: `concept-${c.id}`,
        type: 'cert', // using cert styling (yellow/Award) or custom styling (indigo/BookOpen)
        title: `Mastered ${c.topicName}`,
        subtitle: `Syllabus: ${c.sectionTitle}`,
        date: c.lastUpdated || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        icon: BookOpen,
        color: 'text-indigo-500 bg-indigo-500/10'
      })
    }
  })

  const recentActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Dashboard"
        icon={Code2}
        description="Your placement prep overview at a glance"
        accentColor="--color-primary"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Readiness Dial & Summary */}
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Readiness Gauge Card */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
            <ReadinessGauge score={overallReadiness} label="Placement Readiness" size="md" />
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Composite score of all completed items across the modules.
            </p>
          </div>

          {/* Quick Module Stats */}
          <div className="lg:col-span-3 grid gap-4 sm:grid-cols-3">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Tracker Items</p>
                <p className="text-4xl font-extrabold text-foreground mt-2">{totalItems}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Syllabus topics, problems, and credentials.</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-emerald-500/20">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Completed Tasks</p>
                <p className="text-4xl font-extrabold text-emerald-600 mt-2">{totalCompleted}</p>
              </div>
              <div>
                <ProgressBar value={overallReadiness} accentColor="--status-completed" showPercentage={false} size="sm" />
                <p className="text-xs text-muted-foreground mt-2 font-medium">{formatPercentage(overallReadiness)}% complete</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">In Progress</p>
                <p className="text-4xl font-extrabold text-orange-600 mt-2">{totalItems - totalCompleted}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Items remaining for placement prep.</p>
            </div>
          </div>
        </div>

        {/* Module Stat Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Link href="/dsa" className="block">
            <StatCard
              title="DSA Tracker"
              icon={Code2}
              value={dsaCompleted}
              total={dsaTotal}
              accentColor="--color-module-dsa"
              accentBg="bg-module-dsa-bg"
              description="Algorithmic problems"
            />
          </Link>
          <Link href="/concepts" className="block">
            <StatCard
              title="DSA Concepts"
              icon={BookOpen}
              value={conceptsCompleted}
              total={conceptsTotal}
              accentColor="--color-module-dsa"
              accentBg="bg-primary/5"
              description="Core CS implementations"
            />
          </Link>
          <Link href="/subjects" className="block">
            <StatCard
              title="Core Subjects"
              icon={BookOpen}
              value={completedTopics}
              total={totalTopics}
              accentColor="--color-module-subjects"
              accentBg="bg-module-subjects-bg"
              description="CS syllabus topics"
            />
          </Link>
          <Link href="/projects" className="block">
            <StatCard
              title="Projects"
              icon={Briefcase}
              value={projectsDone}
              total={projectsTotal}
              accentColor="--color-module-projects"
              accentBg="bg-module-projects-bg"
              description="Dev portfolio pieces"
            />
          </Link>
          <Link href="/aptitude" className="block">
            <StatCard
              title="Aptitude & HR"
              icon={Brain}
              value={aptitudeCompleted}
              total={aptitudeTotal}
              accentColor="--color-module-aptitude"
              accentBg="bg-module-aptitude-bg"
              description="Aptitude sections"
            />
          </Link>
          <Link href="/certifications" className="block">
            <StatCard
              title="Certifications"
              icon={Award}
              value={certsCompleted}
              total={certsTotal}
              accentColor="--color-module-certs"
              accentBg="bg-module-certs-bg"
              description="Professional certs"
            />
          </Link>
        </div>

        {/* Two-Column Midsection */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* LEFT: Continue Learning & Activities */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Continue Learning */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Continue Learning
              </h2>
              
              {continueProblem ? (
                <div className="border border-border rounded-lg p-5 bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        continueProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        continueProblem.difficulty === 'Medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {continueProblem.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{continueProblem.pattern}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-base mt-1">{continueProblem.problemName}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-lg mt-0.5">
                      Approach: {continueProblem.approach || 'Not outlined yet. Open editor to begin.'}
                    </p>
                  </div>
                  
                  <Link href="/dsa" className="shrink-0">
                    <Button size="sm" className="gap-1.5 shadow-sm">
                      Resume Problem
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-pulse" />
                  All current DSA problems are mastered! Add more problems to keep practicing.
                </div>
              )}
            </div>

            {/* Dynamic Activity Log */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-500" />
                Recent Activity
              </h2>
              
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((act) => {
                    const IconComponent = act.icon
                    const formattedDate = new Date(act.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    return (
                      <div key={act.id} className="flex items-start gap-3 text-sm">
                        <div className={`p-2 rounded-lg shrink-0 ${act.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="font-semibold text-foreground">{act.title}</p>
                          <p className="text-xs text-muted-foreground">{act.subtitle}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-secondary px-2 py-0.5 rounded-full font-medium">
                          {formattedDate}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity found. Start completing tasks!</p>
              )}
            </div>
          </div>

          {/* RIGHT: Certification Deadlines & Recent DSA */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Upcoming Certification Deadlines */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Upcoming Deadlines
              </h2>
              
              {upcomingCertifications.length > 0 ? (
                <div className="space-y-3">
                  {upcomingCertifications.map((cert) => {
                    const isOverdue = cert.daysLeft < 0
                    return (
                      <div key={cert.id} className="border border-border rounded-lg p-3 bg-secondary/5 flex items-center justify-between gap-3 text-sm">
                        <div className="truncate min-w-0">
                          <h4 className="font-bold text-foreground truncate">{cert.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{cert.provider}</p>
                        </div>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap shadow-sm ${
                          isOverdue ? 'bg-red-100 text-red-700' :
                          cert.daysLeft <= 7 ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {isOverdue ? 'Overdue' : `${cert.daysLeft}d left`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No upcoming deadlines! All certs completed or not scheduled.
                </div>
              )}
            </div>

            {/* Recent DSA Problems */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-500" />
                Recent DSA Additions
              </h2>

              {recentDSA.length > 0 ? (
                <div className="space-y-3">
                  {recentDSA.map((problem) => (
                    <div key={problem.id} className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0 text-sm">
                      <div className="truncate min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{problem.problemName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{problem.topic || 'General'} • {problem.pattern}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        problem.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border border-green-200' :
                        problem.difficulty === 'Medium' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No problems added yet.</p>
              )}
            </div>

          </div>
        </div>

        {/* Global Controls & Reset section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6 gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">SaaS Tracker Options</h3>
            <p className="text-xs text-muted-foreground">Manage your preparation local storage database settings.</p>
          </div>
          <Button onClick={handleResetData} variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0 gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Storage to Defaults
          </Button>
        </div>

      </div>
    </div>
  )
}
