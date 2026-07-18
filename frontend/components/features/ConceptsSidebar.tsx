'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { STORAGE_KEYS, ConceptTopic } from '@/lib/utils/storage';
import { SEED_CONCEPTS } from '@/lib/utils/mockData';

// List of all 15 sections in order
const SECTIONS = [
  { id: 'sec-1', title: 'Section 1: Basics & Building Blocks' },
  { id: 'sec-2', title: 'Section 2: Sorting & Searching' },
  { id: 'sec-3', title: 'Section 3: Linked Lists' },
  { id: 'sec-4', title: 'Section 4: Stacks & Queues' },
  { id: 'sec-5', title: 'Section 5: Recursion & Backtracking' },
  { id: 'sec-6', title: 'Section 6: Trees' },
  { id: 'sec-7', title: 'Section 7: Heaps / Priority Queues' },
  { id: 'sec-8', title: 'Section 8: Graphs — Traversal' },
  { id: 'sec-9', title: 'Section 9: Graphs — Union-Find (DSU)' },
  { id: 'sec-10', title: 'Section 10: Graphs — Shortest Path & Ordering' },
  { id: 'sec-11', title: 'Section 11: Dynamic Programming' },
  { id: 'sec-12', title: 'Section 12: Greedy Algorithms' },
  { id: 'sec-13', title: 'Section 13: String Algorithms' },
  { id: 'sec-14', title: 'Section 14: Specific "You Won\'t Invent This Yourself" Algorithms' },
  { id: 'sec-15', title: 'Section 15: Advanced / Nice-to-Have' },
];

export function ConceptsSidebar({ collapseTrigger }: { collapseTrigger?: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTopicId = searchParams.get('topicId');

  const [savedConcepts] = useLocalStorage<any[]>(
    STORAGE_KEYS.CONCEPTS,
    []
  );

  const concepts = useMemo(() => {
    return SEED_CONCEPTS.map((staticConcept) => {
      const saved = savedConcepts?.find((c) => c.id === staticConcept.id)
      return {
        ...staticConcept,
        status: saved?.status || 'Not Started',
        notes: saved?.notes || staticConcept.notes,
        codeSnippet: saved?.codeSnippet || staticConcept.codeSnippet,
      }
    })
  }, [savedConcepts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-1': true, // Open Section 1 by default
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Group topics by section, applying search query filter if active
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = SECTIONS.map((sec) => {
      const sectionTopics = concepts.filter((c) => c.sectionId === sec.id);
      const matchedTopics = query
        ? sectionTopics.filter((t) => t.topicName.toLowerCase().includes(query))
        : sectionTopics;

      return {
        ...sec,
        topics: matchedTopics,
        hasMatches: matchedTopics.length > 0,
      };
    });

    return result;
  }, [concepts, searchQuery]);

  // Auto-expand sections that have search matches
  useMemo(() => {
    if (searchQuery.trim()) {
      const newExpanded: Record<string, boolean> = {};
      filteredSections.forEach((sec) => {
        if (sec.hasMatches) {
          newExpanded[sec.id] = true;
        }
      });
      setExpandedSections(newExpanded);
    }
  }, [searchQuery, filteredSections]);



  const handleTopicClick = (topicId: string) => {
    router.push(`/concepts?topicId=${topicId}`);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Search Header */}
      <div className="p-4 border-b border-border bg-sidebar/50 sticky top-0 z-10 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search concepts, patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 pill-soft bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        {collapseTrigger}
      </div>

      {/* Accordion Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredSections.map((section) => {
          // If a search query is active and this section has no matching topics, hide it
          if (searchQuery && !section.hasMatches) return null;

          const isExpanded = expandedSections[section.id];
          const totalInSec = concepts.filter((c) => c.sectionId === section.id).length;
          const masteredInSec = concepts.filter(
            (c) => c.sectionId === section.id && c.status === 'Mastered'
          ).length;

          return (
            <div
              key={section.id}
              className="transition-all"
            >
              {/* Accordion Trigger (clean, minimal header, no boxes!) */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-2 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-2 text-left">
                  <span>{section.title}</span>
                  <span className="text-[9px] text-muted-foreground/75 font-semibold lowercase tracking-normal ml-2">
                    ({masteredInSec}/{totalInSec} mastered)
                  </span>
                </div>
                <div className="flex items-center text-muted-foreground shrink-0 ml-1">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="bg-background/10 py-1 pl-1">
                  {section.topics.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic px-4 py-1">
                      No matching topics found.
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {section.topics.map((topic) => {
                        const isActive = activeTopicId === topic.id;
                        return (
                          <li key={topic.id}>
                            <button
                              onClick={() => handleTopicClick(topic.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-xs transition-colors ${
                                isActive
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-semibold'
                              }`}
                            >
                              {/* Status Dot */}
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span
                                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                    topic.status === 'Mastered' ? 'bg-emerald-500' :
                                    topic.status === 'In Progress' ? 'bg-amber-500' :
                                    'bg-muted-foreground/35'
                                  }`}
                                ></span>
                              </span>

                              <span className="leading-tight truncate pr-1">
                                {topic.topicName}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
