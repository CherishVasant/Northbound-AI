'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { AIAssistant } from '../features/AIAssistant';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = useState(false);
  const [contextProblem, setContextProblem] = useState<any>(undefined);

  useEffect(() => {
    const handleToggle = () => setAiOpen((prev) => !prev);
    const handleOpen = () => setAiOpen(true);
    const handleClose = () => setAiOpen(false);
    const handleSetContext = (e: any) => setContextProblem(e.detail);

    window.addEventListener('preptrack_toggle_ai', handleToggle);
    window.addEventListener('preptrack_open_ai', handleOpen);
    window.addEventListener('preptrack_close_ai', handleClose);
    window.addEventListener('preptrack_ai_set_context' as any, handleSetContext);

    // Check if we should open AI on load (from redirect)
    const openOnLoad = window.localStorage.getItem('preptrack_open_ai_on_load');
    if (openOnLoad === 'true') {
      setAiOpen(true);
      window.localStorage.removeItem('preptrack_open_ai_on_load');
    }

    return () => {
      window.removeEventListener('preptrack_toggle_ai', handleToggle);
      window.removeEventListener('preptrack_open_ai', handleOpen);
      window.removeEventListener('preptrack_close_ai', handleClose);
      window.removeEventListener('preptrack_ai_set_context' as any, handleSetContext);
    };
  }, []);

  /**
   * The `ai-open` body class used to exist so CSS could shrink the placement
   * table's columns when this panel opened. The table now measures its own
   * container, which notices the change without being told, so the class had no
   * remaining consumers and the 420px literal no longer had to be kept in sync
   * with a matching set of breakpoints.
   */

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <Suspense fallback={<div className="w-64 border-r border-border bg-sidebar" />}>
        <Sidebar />
      </Suspense>
      <main
        className={`flex-1 overflow-y-auto transition-all duration-150 ${aiOpen ? 'hidden sm:block' : ''}`}
        style={{ marginRight: aiOpen && typeof window !== 'undefined' && window.innerWidth >= 640 ? 'var(--ai-panel-width, 460px)' : '0px' }}
      >
        {children}
      </main>
      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        currentProblem={contextProblem}
      />
    </div>
  );
}
