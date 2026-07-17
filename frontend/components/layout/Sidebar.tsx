'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  BarChart3, Book, Code2, Briefcase, Award, Brain,
  HelpCircle, ShieldCheck, CheckCircle2, Circle, Clock, AlertTriangle, ListFilter,
  ChevronLeft, ChevronRight, ChevronDown, FolderOpen, Database, BarChart, Cpu, Wrench
} from 'lucide-react';
import Link from 'next/link';
import { ConceptsSidebar } from '@/components/features/ConceptsSidebar';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resize and collapse states
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Section collapsible states
  const [difficultyOpen, setDifficultyOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [generalOpen, setGeneralOpen] = useState(true);

  // Load configuration from local storage
  useEffect(() => {
    setIsMounted(true);
    const savedWidth = window.localStorage.getItem('preptrack_sidebar_width');
    const savedCollapsed = window.localStorage.getItem('preptrack_sidebar_collapsed');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
    
    // Explicitly make the sidebar open on startup/first load for DSA and Concepts pages
    if (pathname.startsWith('/dsa') || pathname.startsWith('/concepts')) {
      setIsCollapsed(false);
    } else if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, [pathname]);

  // Mouse drag resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(450, e.clientX));
      setSidebarWidth(newWidth);
      window.localStorage.setItem('preptrack_sidebar_width', newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(e.button === 0); // Only left click drag
  };

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    window.localStorage.setItem('preptrack_sidebar_collapsed', nextCollapsed.toString());
  };

  // Sidebar hidden on dashboard and placement (full-width layouts)
  if (pathname === '/' || pathname.startsWith('/placement')) {
    return null;
  }

  if (!isMounted) {
    return <div className="w-64 border-r border-border bg-sidebar shrink-0 hidden md:block" />;
  }

  // Collapse Button Component
  const collapseButton = (
    <button
      onClick={toggleCollapse}
      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0 cursor-pointer"
      title="Collapse sidebar"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );

  // Floating pull-tab handle when sidebar is collapsed (positioned identically and highlighting border)
  if (isCollapsed) {
    return (
      <button
        onClick={toggleCollapse}
        className="fixed top-[72px] left-4 z-50 h-8 w-8 rounded-lg border-2 border-primary bg-background text-primary hover:bg-secondary flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-all animate-in fade-in"
        title="Expand sidebar"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  const isQueryActive = (key: string, value: string | null) => {
    const paramVal = searchParams.get(key);
    return paramVal === value;
  };

  // Sub-section collapsible renderer helper
  const renderCollapsibleSection = (
    title: string,
    isOpen: boolean,
    setIsOpen: (val: boolean) => void,
    items: { label: string; href: string; icon: any; isActive: boolean }[]
  ) => {
    const onDsaPage = pathname.startsWith('/dsa');

    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-2 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
        >
          <span>{title}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
        </button>
        {isOpen && (
          <ul className="space-y-0.5 pl-1">
            {items.map((item) => {
              const isAnchor = item.href.startsWith('#');
              const shouldSmoothScroll = isAnchor && onDsaPage && item.href.includes('section');

              if (shouldSmoothScroll) {
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => {
                        const targetId = item.href.substring(1);
                        const el = document.getElementById(targetId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left cursor-pointer"
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              }

              // Otherwise standard routing link
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs ${
                      item.isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-semibold'
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  // Render context-specific sections
  const renderSidebarContent = () => {
    if (pathname.startsWith('/concepts')) {
      return <ConceptsSidebar collapseTrigger={collapseButton} />;
    }

    const activeDifficulty = searchParams.get('difficulty');
    const activeStatus = searchParams.get('status');
    const activeSubject = searchParams.get('subject') || 'os';
    const activeTab = searchParams.get('tab') || 'aptitude';

    return (
      <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            {pathname.startsWith('/dsa') ? 'LeetCode Tracker' :
             pathname.startsWith('/subjects') ? 'Core Subjects' :
             pathname.startsWith('/prep') ? 'Prep & More' : 'Navigation'}
          </p>
          {collapseButton}
        </div>

        {/* Sections */}
        <div className="space-y-6 flex-1 min-h-0">
          {pathname.startsWith('/dsa') && (
            <>
              {renderCollapsibleSection('Filters', generalOpen, setGeneralOpen, [
                { label: 'All Problems', href: '/dsa', icon: ListFilter, isActive: !activeDifficulty && !activeStatus }
              ])}

              {renderCollapsibleSection('Difficulty', difficultyOpen, setDifficultyOpen, [
                { label: 'Easy', href: '/dsa?difficulty=Easy', icon: Circle, isActive: isQueryActive('difficulty', 'Easy') },
                { label: 'Medium', href: '/dsa?difficulty=Medium', icon: AlertTriangle, isActive: isQueryActive('difficulty', 'Medium') },
                { label: 'Hard', href: '/dsa?difficulty=Hard', icon: ShieldCheck, isActive: isQueryActive('difficulty', 'Hard') }
              ])}

              {renderCollapsibleSection('Status', statusOpen, setStatusOpen, [
                { label: 'Not Started', href: '/dsa?status=Not Started', icon: Circle, isActive: isQueryActive('status', 'Not Started') },
                { label: 'Interview Ready', href: '/dsa?status=Interview Ready', icon: Clock, isActive: isQueryActive('status', 'Interview Ready') },
                { label: 'Mastered', href: '/dsa?status=Mastered', icon: CheckCircle2, isActive: isQueryActive('status', 'Mastered') }
              ])}

              {renderCollapsibleSection('Striver Sections', sectionsOpen, setSectionsOpen, [
                { label: 'Arrays', href: '#section-arrays', icon: Book },
                { label: 'Hashing', href: '#section-hashing', icon: Book },
                { label: 'Linked List', href: '#section-linked-list', icon: Book },
                { label: 'Two Pointers', href: '#section-two-pointers', icon: Book },
                { label: 'Greedy', href: '#section-greedy', icon: Book },
                { label: 'Recursion', href: '#section-recursion', icon: Book },
                { label: 'Backtracking', href: '#section-backtracking', icon: Book },
                { label: 'Binary Search', href: '#section-binary-search', icon: Book },
                { label: 'Heaps', href: '#section-heap', icon: Book },
                { label: 'Stacks', href: '#section-stack', icon: Book },
                { label: 'Queues', href: '#section-queue', icon: Book },
                { label: 'Strings', href: '#section-strings', icon: Book },
                { label: 'Trees', href: '#section-trees', icon: Book },
                { label: 'BST', href: '#section-bst', icon: Book },
                { label: 'Graphs', href: '#section-graphs', icon: Book },
                { label: 'Dynamic Programming', href: '#section-dp', icon: Book }
              ].map(sec => ({ ...sec, isActive: false })))}
            </>
          )}

          {pathname.startsWith('/subjects') && (
            renderCollapsibleSection('Core Subjects', generalOpen, setGeneralOpen, [
              { label: 'Aptitude', href: '/subjects?subject=aptitude', icon: Brain, isActive: activeSubject === 'aptitude' },
              { label: 'Operating Systems', href: '/subjects?subject=os', icon: Book, isActive: activeSubject === 'os' },
              { label: 'Computer Networks', href: '/subjects?subject=networks', icon: Book, isActive: activeSubject === 'networks' },
              { label: 'Database Systems', href: '/subjects?subject=dbms', icon: Book, isActive: activeSubject === 'dbms' },
              { label: 'Object-Oriented Prog.', href: '/subjects?subject=oop', icon: Book, isActive: activeSubject === 'oop' },
              { label: 'System Design', href: '/subjects?subject=systemdesign', icon: Book, isActive: activeSubject === 'systemdesign' },
              { label: 'SQL', href: '/subjects?subject=sql', icon: Database, isActive: activeSubject === 'sql' },
              { label: 'Probability & Statistics', href: '/subjects?subject=probstats', icon: BarChart, isActive: activeSubject === 'probstats' },
              { label: 'Machine Learning', href: '/subjects?subject=ml', icon: Cpu, isActive: activeSubject === 'ml' },
              { label: 'Software Engineering', href: '/subjects?subject=swe', icon: Wrench, isActive: activeSubject === 'swe' },
            ])
          )}

          {pathname.startsWith('/prep') && (
            renderCollapsibleSection('Prep & More', generalOpen, setGeneralOpen, [
              { label: 'Projects', href: '/prep?tab=projects', icon: Code2, isActive: activeTab === 'projects' },
              { label: 'HR Interview Prep', href: '/prep?tab=hr', icon: HelpCircle, isActive: activeTab === 'hr' },
              { label: 'Certifications', href: '/prep?tab=certifications', icon: Award, isActive: activeTab === 'certifications' },
            ])
          )}
        </div>
      </div>
    );
  };

  // Layout wrapper render
  return (
    <aside
      style={{ width: sidebarWidth }}
      className="border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-full shrink-0 relative transition-all duration-75 hidden md:flex"
    >
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {renderSidebarContent()}
      </div>

      {/* Resize Handle Drag Area */}
      <div
        onMouseDown={startResizing}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-30 ${
          isResizing ? 'bg-primary/50' : ''
        }`}
      />
    </aside>
  );
}
