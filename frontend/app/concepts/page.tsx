'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, GraduationCap, Award, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConceptDetailPanel } from '@/components/features/ConceptDetailPanel';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { STORAGE_KEYS, ConceptTopic } from '@/lib/utils/storage';
import { SEED_CONCEPTS } from '@/lib/utils/mockData';
import { formatPercentage } from '@/lib/utils';

// Section metadata for index checking
const SECTIONS = [
  { id: 'sec-1', title: 'Sec 1' },
  { id: 'sec-2', title: 'Sec 2' },
  { id: 'sec-3', title: 'Sec 3' },
  { id: 'sec-4', title: 'Sec 4' },
  { id: 'sec-5', title: 'Sec 5' },
  { id: 'sec-6', title: 'Sec 6' },
  { id: 'sec-7', title: 'Sec 7' },
  { id: 'sec-8', title: 'Sec 8' },
  { id: 'sec-9', title: 'Sec 9' },
  { id: 'sec-10', title: 'Sec 10' },
  { id: 'sec-11', title: 'Sec 11' },
  { id: 'sec-12', title: 'Sec 12' },
  { id: 'sec-13', title: 'Sec 13' },
  { id: 'sec-14', title: 'Sec 14' },
  { id: 'sec-15', title: 'Sec 15' },
];

function ConceptsPageContent() {
  const [savedConcepts, setSavedConcepts, isLoaded] = useLocalStorage<any[]>(
    STORAGE_KEYS.CONCEPTS,
    []
  );

  // Merge static concepts with user saved progress ticks
  const concepts = useMemo(() => {
    return SEED_CONCEPTS.map((staticConcept) => {
      const saved = savedConcepts?.find((c) => c.id === staticConcept.id)
      if (!saved) return staticConcept
      return {
        ...staticConcept,
        ...saved,
        subTopics: staticConcept.subTopics?.map((staticSub) => {
          const savedSub = saved?.subTopics?.find((s: any) => s.id === staticSub.id)
          if (!savedSub) return staticSub
          return {
            ...staticSub,
            ...savedSub,
          }
        }) || staticConcept.subTopics,
      }
    })
  }, [savedConcepts]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading Concepts...</p>
        </div>
      </div>
    );
  }

  // --- Calculations for segmented progress bars ---
  const totalConceptsCount = concepts.length;
  const masteredConceptsCount = concepts.filter((c) => c.status === 'Mastered').length;
  const inProgressConceptsCount = concepts.filter((c) => c.status === 'In Progress').length;
  
  const overallConceptsProgress = totalConceptsCount > 0 ? (masteredConceptsCount / totalConceptsCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col h-full overflow-hidden">
      
      {/* Header section */}
      {/* Header section */}
      <PageHeader
        title="DSA Concepts"
        icon={BookOpen}
        description="Organize and study core CS data structures and algorithms implementations by syllabus section."
        progressValue={overallConceptsProgress}
        progressLabel="DSA Concepts Mastered"
        accentColor="--color-module-dsa"
      />

      {/* Main pane content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ConceptDetailPanel />
      </div>

    </div>
  );
}

export default function ConceptsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Initializing Concept Panel...</p>
        </div>
      </div>
    }>
      <ConceptsPageContent />
    </Suspense>
  );
}
