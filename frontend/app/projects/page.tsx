'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, Edit2, ExternalLink, Briefcase, Calendar, Code, Link2, X } from 'lucide-react'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    style={props.style}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchFilter } from '@/components/shared/SearchFilter'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { Project, STORAGE_KEYS, generateId } from '@/lib/utils/storage'
import { SEED_PROJECTS } from '@/lib/utils/mockData'

function ProjectsPageContent() {
  const [projects, setProjects, isLoaded] = useLocalStorage<Project[]>(
    STORAGE_KEYS.PROJECTS,
    SEED_PROJECTS
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})

  const searchParams = useSearchParams()

  useEffect(() => {
    const statusParam = searchParams.get('status') || ''
    setFilterStatus(statusParam)
  }, [searchParams])

  // Calculate stats
  const totalProjects = projects.length
  const done = projects.filter((p) => p.status === 'Done').length
  const inProgress = projects.filter((p) => p.status === 'In Progress').length
  const planned = projects.filter((p) => p.status === 'Planned').length

  // Filter projects
  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const statuses = ['Planned', 'In Progress', 'Done']

  const handleAddProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: 'New Prep Project',
      description: 'An advanced developmental portfolio piece.',
      status: 'Planned',
      techStack: [],
      skillsToLearn: [],
      notes: '',
      link: '',
      githubLink: '',
      liveDemo: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    }
    setFormData(newProject)
    setEditingId('new')
  }

  const handleDeleteConfirm = () => {
    if (!deleteId) return
    setProjects(projects.filter((p) => p.id !== deleteId))
    setDeleteId(null)
  }

  const handleSaveProject = () => {
    if (!formData.name?.trim()) return

    // Ensure techStack is processed into array if it's entered as string
    let techStackArray = formData.techStack || []
    if (typeof techStackArray === 'string') {
      techStackArray = (techStackArray as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    }

    const cleanedProject = {
      ...formData,
      techStack: techStackArray,
    }

    if (editingId === 'new') {
      const newProj: Project = {
        ...(cleanedProject as Omit<Project, 'id'>),
        id: generateId(),
      }
      setProjects([...projects, newProj])
    } else {
      setProjects(
        projects.map((p) => (p.id === editingId ? { ...p, ...cleanedProject } : p))
      )
    }
    setEditingId(null)
    setFormData({})
  }

  const handleEditClick = (project: Project) => {
    setEditingId(project.id)
    setFormData({ ...project })
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterStatus('')
  }

  if (!isLoaded) return <div className="p-6 bg-background min-h-screen text-muted-foreground">Loading Projects...</div>

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Projects"
        icon={Briefcase}
        description="Manage your development projects and placement portfolio pieces."
        accentColor="--color-module-projects"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Portfolio</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{totalProjects}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm border-emerald-500/10">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{done}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-extrabold text-orange-600 mt-1">{inProgress}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Planned</p>
            <p className="text-2xl font-extrabold text-muted-foreground mt-1">{planned}</p>
          </div>
        </div>

        {/* Search / Filter Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-card border border-border rounded-xl p-4 shadow-sm">
          <SearchFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              status: {
                label: 'Status',
                options: statuses.map((s) => ({ label: s, value: s })),
                value: filterStatus,
                onChange: setFilterStatus,
              },
            }}
            onClear={handleClearFilters}
          />
          <Button onClick={handleAddProject} className="gap-2 text-xs h-9 font-bold shrink-0">
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Start building your engineering resume by adding your first project."
            action={{ label: 'Add Project', onClick: handleAddProject }}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary transition-all flex flex-col justify-between shadow-sm hover:shadow-md relative overflow-hidden group"
              >
                
                <div>
                  {/* Top: title & delete */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </h3>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditClick(project)}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/40 transition-all"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(project.id)}
                        className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <Badge variant={
                      project.status === 'Done' ? 'completed' :
                      project.status === 'In Progress' ? 'in-progress' :
                      'not-started'
                    }>
                      {project.status}
                    </Badge>
                  </div>

                  {/* Date fields */}
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3 font-medium bg-secondary/30 w-fit px-2 py-0.5 rounded">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Start'}
                        {' — '}
                        {project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Present'}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {project.description}
                    </p>
                  )}

                  {/* Tech stack tags */}
                  {project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="text-[9px] font-bold bg-secondary text-secondary-foreground border border-border px-2 py-0.5 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes panel */}
                  {project.notes && (
                    <div className="bg-secondary/10 border border-border/40 rounded-lg p-2.5 mb-4 text-[10px] leading-relaxed text-muted-foreground italic">
                      <strong>Takeaways:</strong> {project.notes}
                    </div>
                  )}
                </div>

                {/* External links */}
                <div className="flex gap-3 border-t border-border pt-4 mt-4 justify-start">
                  {project.githubLink ? (
                    <a 
                      href={project.githubLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-auto"
                    >
                      <Button size="sm" variant="outline" className="px-4 text-xs gap-1.5 bg-background shadow-xs font-semibold h-8">
                        <GithubIcon className="w-3.5 h-3.5" />
                        Code
                      </Button>
                    </a>
                  ) : (
                    <div className="opacity-40">
                      <Button size="sm" variant="outline" disabled className="px-4 text-xs gap-1.5 h-8">
                        <GithubIcon className="w-3.5 h-3.5" />
                        No Code
                      </Button>
                    </div>
                  )}

                  {project.liveDemo ? (
                    <a 
                      href={project.liveDemo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-auto"
                    >
                      <Button size="sm" variant="default" className="px-4 text-xs gap-1.5 shadow-xs font-semibold h-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Demo
                      </Button>
                    </a>
                  ) : (
                    <div className="opacity-40">
                      <Button size="sm" disabled className="px-4 text-xs gap-1.5 h-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                        No Demo
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Portfolio Project"
        description="Are you sure you want to delete this project from your tracking log? This deletes all dates, stacks, and personal takeaways."
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Add / Edit Project Dialog */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                {editingId === 'new' ? 'Add Portfolio Project' : 'Edit Project Details'}
              </h3>
              <button 
                onClick={() => setEditingId(null)} 
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[75vh]">
              
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Project Name (Title)</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                  placeholder="e.g. PrepTrack Dashboard"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Status</label>
                <select
                  value={formData.status || 'Planned'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Tech Stack (Comma-separated)</label>
                <input
                  type="text"
                  value={typeof formData.techStack === 'string' ? formData.techStack : formData.techStack?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                  placeholder="e.g. Next.js, React, Redis"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Short Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                  rows={2}
                  placeholder="Provide a description of the project..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">GitHub Link</label>
                  <input
                    type="text"
                    value={formData.githubLink || ''}
                    onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                    placeholder="https://github.com..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Live Demo Link</label>
                  <input
                    type="text"
                    value={formData.liveDemo || ''}
                    onChange={(e) => setFormData({ ...formData, liveDemo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Personal Notes & Key Takeaways</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground"
                  rows={2.5}
                  placeholder="Lessons learned, architecture designs..."
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-secondary/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="h-8 text-xs font-semibold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveProject} className="h-8 text-xs font-semibold">
                Save Project
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Projects...</div>}>
      <ProjectsPageContent />
    </Suspense>
  )
}
