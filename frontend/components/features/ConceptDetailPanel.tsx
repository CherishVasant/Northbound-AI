'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Sparkles, Loader2, Link2, Plus, X, ExternalLink, Check, Terminal, Play, Bookmark, ShieldAlert, CheckCircle, Code } from 'lucide-react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { STORAGE_KEYS, ConceptTopic, ConceptSubTopic } from '@/lib/utils/storage';
import { SEED_CONCEPTS } from '@/lib/utils/mockData';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/api';

// Offline algorithm seeds for popular concepts (Java implementations)
const OFFLINE_CONCEPTS_FALLBACK: Record<string, { code: string; notes: string }> = {
  'reverse linked list — iterative and recursive': {
    code: `public class Main {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode reverseListIterative(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }

    public static ListNode reverseListRecursive(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode p = reverseListRecursive(head.next);
        head.next.next = head;
        head.next = null;
        return p;
    }
}`,
    notes: `Iterative approach: O(N) Time, O(1) Space.
Recursive approach: O(N) Time, O(N) Call Stack Space.`
  }
};

export function ConceptDetailPanel() {
  const searchParams = useSearchParams();
  const activeTopicId = searchParams.get('topicId');

  const [savedConcepts, setSavedConcepts] = useLocalStorage<any[]>(
    STORAGE_KEYS.CONCEPTS,
    []
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [saveIndicator, setSaveIndicator] = useState(false);
  
  // Try It clipboard modal state
  const [showTryItModal, setShowTryItModal] = useState(false);
  const [tryItCode, setTryItCode] = useState('');

  // Merge static concepts with user saved progress
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

  // Find the active topic
  const topic = concepts.find((c) => c.id === activeTopicId);

  // Show auto-save badge
  const triggerSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  };

  const updateSavedConcept = (updater: (existing: any) => any) => {
    if (!topic) return;
    const updated = [...(savedConcepts || [])]
    const index = updated.findIndex((c) => c.id === topic.id)
    const existing = index > -1 ? updated[index] : { id: topic.id }
    const fresh = updater(existing)
    if (index > -1) {
      updated[index] = { ...existing, ...fresh, id: topic.id }
    } else {
      updated.push({ ...fresh, id: topic.id })
    }
    setSavedConcepts(updated)
    triggerSaveIndicator()
  }

  // Safe handler to update parent fields OR nested subtopics array
  const handleSubTopicChange = (subTopicId: string, field: keyof ConceptSubTopic, value: any) => {
    if (!topic) return;

    updateSavedConcept((existing) => {
      let fresh;
      const isMulti = topic.subTopics && topic.subTopics.length > 0;

      if (isMulti) {
        const subTopicsList = [...(existing.subTopics || [])]
        const subIdx = subTopicsList.findIndex((s: any) => s.id === subTopicId)
        const subFresh = { id: subTopicId, [field]: value }
        if (subIdx > -1) {
          subTopicsList[subIdx] = { ...subTopicsList[subIdx], ...subFresh }
        } else {
          subTopicsList.push(subFresh)
        }
        fresh = {
          subTopics: subTopicsList,
          lastUpdated: new Date().toISOString()
        }
      } else {
        let parentKey: any = 'notes';
        if (field === 'codeSnippet') parentKey = 'codeSnippet';
        if (field === 'resourceLinks') parentKey = 'resourceLinks';
        fresh = {
          [parentKey]: value,
          lastUpdated: new Date().toISOString()
        }
      }
      return fresh;
    })
  };

  const handleStatusChange = (status: ConceptTopic['status']) => {
    if (!topic) return;
    updateSavedConcept((existing) => ({
      status,
      lastUpdated: new Date().toISOString()
    }))

    if (status === 'Mastered') {
      window.dispatchEvent(
        new CustomEvent('preptrack_concept_activity', {
          detail: {
            title: `Mastered ${topic.topicName}`,
            section: topic.sectionTitle,
            type: 'mastered',
          },
        })
      );
    }
  };

  const handleAddLink = () => {
    if (!topic || !newLink.trim()) return;
    let url = newLink.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const updatedLinks = [...(topic.resourceLinks || []), url];
    
    updateSavedConcept((existing) => ({
      resourceLinks: updatedLinks,
      lastUpdated: new Date().toISOString()
    }))
    setNewLink('');
  };

  const handleRemoveLink = (indexToRemove: number) => {
    if (!topic) return;
    const updatedLinks = (topic.resourceLinks || []).filter((_: any, idx: number) => idx !== indexToRemove);
    updateSavedConcept((existing) => ({
      resourceLinks: updatedLinks,
      lastUpdated: new Date().toISOString()
    }))
  };

  // Try It compilation click handler
  const handleTryItClick = (code: string) => {
    setTryItCode(code);
    navigator.clipboard.writeText(code);
    setShowTryItModal(true);
  };

  const handleConfirmTryIt = () => {
    setShowTryItModal(false);
    window.open('https://www.programiz.com/java-programming/online-compiler/', '_blank');
  };

  // Fallback offline generation helper
  const handleOfflineFallback = (activeTopic: ConceptTopic) => {
    const lowerTopic = activeTopic.topicName.toLowerCase();
    let fallbackData = OFFLINE_CONCEPTS_FALLBACK[lowerTopic];
    if (!fallbackData) {
      fallbackData = {
        code: `public class Main {\n    // Code for ${activeTopic.topicName}\n    public static void main(String[] args) {\n        System.out.println("DSA Study template ready.");\n    }\n}`,
        notes: `Study notes for ${activeTopic.topicName} reference parameters.`
      };
    }

    updateSavedConcept((existing) => ({
      codeSnippet: fallbackData.code,
      notes: fallbackData.notes,
      lastUpdated: new Date().toISOString()
    }))
  };

  // Consult AI to generate clean reference implementations
  const handleConsultCopilot = async () => {
    if (!topic) return;
    setIsGenerating(true);

    try {
      const isMulti = topic.subTopics && topic.subTopics.length > 0;
      let systemPrompt = '';
      let prompt = '';

      if (isMulti) {
        const subNames = topic.subTopics!.map((st: any) => st.name).join(', ');
        systemPrompt = `You are a DSA concept coach. Analyze the concept and its subtopics, and output a valid JSON object containing an array of subtopics matching this structure. Do not output any markdown formatting, code ticks, or extra wrapper text - return RAW JSON only.
{
  "subTopics": [
    {
      "name": "matching subtopic name from: ${subNames}",
      "overview": "short overview introduction of this subtopic",
      "notes": "short logical steps and explanation",
      "code": "clean, well-commented JAVA code implementation inside a public class Main",
      "timeComplexity": "e.g. O(N^2)",
      "spaceComplexity": "e.g. O(1)",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["disadvantage 1", "disadvantage 2"]
    }
  ]
}`;
        prompt = `Write clean, reference Java implementations and explanations for each of the subtopics under this concept:
Concept Name: ${topic.topicName}
Syllabus: ${topic.sectionTitle}
Subtopics to cover: ${subNames}`;
      } else {
        systemPrompt = `You are a DSA concept coach. Analyze the topic name and output a valid JSON object matching this structure. Do not output any markdown formatting, code ticks, or extra wrapper text - return RAW JSON only.
{
  "overview": "short overview introduction of this concept",
  "code": "clean, well-commented JAVA code implementation inside a public class Main",
  "notes": "short logical steps and explanation",
  "timeComplexity": "e.g. O(N)",
  "spaceComplexity": "e.g. O(1)",
  "pros": ["advantage 1"],
  "cons": ["disadvantage 1"]
}`;
        prompt = `Write an clean, reference Java implementation inside a public class Main and explanation for this algorithm concept:
Topic Name: ${topic.topicName}
Section Name: ${topic.sectionTitle}`;
      }

      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      let text = (data.text || '').trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
      }

      const generated = JSON.parse(text);
      let freshData;

      if (isMulti) {
        const subData = generated.subTopics || [];
        const updatedSubTopics = topic.subTopics!.map((st: any, idx: number) => {
          const aiGen = subData.find((a: any) => a.name.toLowerCase().includes(st.name.toLowerCase()) || st.name.toLowerCase().includes(a.name.toLowerCase())) || subData[idx] || {};
          return {
            id: st.id,
            overview: aiGen.overview || st.overview,
            notes: aiGen.notes || st.notes,
            codeSnippet: aiGen.code || st.codeSnippet,
            timeComplexity: aiGen.timeComplexity || st.timeComplexity,
            spaceComplexity: aiGen.spaceComplexity || st.spaceComplexity,
            pros: aiGen.pros || st.pros,
            cons: aiGen.cons || st.cons
          };
        });

        freshData = {
          subTopics: updatedSubTopics,
          lastUpdated: new Date().toISOString()
        };
      } else {
        freshData = {
          codeSnippet: generated.code || '',
          notes: generated.notes || '',
          lastUpdated: new Date().toISOString()
        };
      }

      updateSavedConcept((existing) => freshData);

      window.dispatchEvent(
        new CustomEvent('preptrack_concept_activity', {
          detail: {
            title: `Generated study guides for ${topic.topicName}`,
            section: topic.sectionTitle,
            type: 'ai_generate',
          },
        })
      );

    } catch (error) {
      console.warn('[AI Concept Generation Failed] Falling back to offline seeds.', error);
      handleOfflineFallback(topic);
    } finally {
      setIsGenerating(false);
    }
  };

  // Scroll to targeted subtopic card anchor smoothly
  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!topic) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/20 min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center text-primary mb-4 shadow-[var(--shadow-pill)]">
          <Bookmark className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Select a DSA Concept</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Expand a syllabus section in the left panel to begin studying clean Java reference code and logging your learning progress.
        </p>
      </div>
    );
  }

  // --- ADAPTER: Normalize to subtopics array ---
  const subTopics: ConceptSubTopic[] = topic.subTopics && topic.subTopics.length > 0
    ? topic.subTopics
    : [{
        id: topic.id,
        name: topic.topicName,
        overview: "An introduction reference section mapping the core parameters of this CS topic.",
        notes: topic.notes || '',
        codeSnippet: topic.codeSnippet || '',
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        pros: ["Standard in-place logic"],
        cons: ["Requires boundary checks"],
        resourceLinks: topic.resourceLinks || []
      }];

  const isMultiSyllabus = topic.subTopics && topic.subTopics.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background pb-16 animate-in fade-in duration-300 relative">
      
      {/* Sticky Content Header */}
      <div className="p-6 border-b border-border bg-card/45 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {topic.sectionTitle}
          </p>
          <h2 className="text-xl font-extrabold text-foreground mt-1 tracking-tight">
            {topic.topicName}
          </h2>
          {topic.lastUpdated && (
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              Last saved: {new Date(topic.lastUpdated).toLocaleDateString()} at {new Date(topic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveIndicator && (
            <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold animate-pulse">
              Auto-saved
            </span>
          )}

          <select
            value={topic.status}
            onChange={(e) => handleStatusChange(e.target.value as ConceptTopic['status'])}
            className={`px-3 py-1.5 pill-soft text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary ${
              topic.status === 'Mastered' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
              topic.status === 'In Progress' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
              'bg-secondary text-muted-foreground'
            }`}
          >
            <option value="Not Started">❌ Not Started</option>
            <option value="In Progress">⏳ In Progress</option>
            <option value="Mastered">🔥 Mastered</option>
          </select>
        </div>
      </div>

      {/* --- QUICK NAVIGATION TABLE OF CONTENTS (ToC) --- */}
      {isMultiSyllabus && (
        <div className="sticky top-0 z-20 px-6 py-3 border-b border-border/80 bg-background/95 backdrop-blur flex items-center gap-3 overflow-x-auto shrink-0 shadow-sm scrollbar-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Quick Navigation:
          </span>
          <div className="flex gap-2">
            {subTopics.map((st) => (
              <button
                key={st.id}
                onClick={() => handleScrollToSection(st.id)}
                className="px-3 py-1 pill-soft pill-soft-interactive bg-card text-[11px] text-foreground font-semibold hover:text-primary whitespace-nowrap"
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pane Scroll Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 w-full">

        {/* Copilot Assistant Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-primary/5 card-soft gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Need clean Java implementations?</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-lg">
                Let the Copilot draft structured implementations for {isMultiSyllabus ? `${subTopics.length} sorting/linked list topics` : topic.topicName} in class Main.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            disabled={isGenerating}
            onClick={handleConsultCopilot}
            className="text-xs font-semibold gap-1.5 shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isGenerating ? 'Drafting implementations...' : 'Ask Copilot'}
          </Button>
        </div>

        {/* --- CARDS: Render each self-contained subtopic --- */}
        <div className="space-y-12">
          {subTopics.map((st) => {
            const lines = (st.codeSnippet || '').split('\n');
            const lineNumbers = Array.from({ length: Math.max(lines.length, 12) }, (_, i) => i + 1);

            return (
              <div
                key={st.id}
                id={st.id}
                className="scroll-mt-24 card-soft card-soft-interactive bg-card overflow-hidden space-y-5 p-6 relative animate-in fade-in duration-300"
              >
                {/* Section Sub-Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground tracking-tight">{st.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
                      {st.overview || "Reference guide for this sub-concept."}
                    </p>
                  </div>

                  {/* Complexities Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                      Time: {st.timeComplexity || 'O(N)'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                      Space: {st.spaceComplexity || 'O(1)'}
                    </span>
                  </div>
                </div>

                {/* Subtopic description & notes details */}
                <div className="grid gap-6 lg:grid-cols-12">
                  
                  {/* Left block: Monospace Java implementation editor (8 columns) */}
                  <div className="lg:col-span-8 space-y-0 flex flex-col justify-end">
                    {/* Mock IDE File Tab Header Bar */}
                    <div className="flex justify-between items-center bg-secondary/35 rounded-t-2xl px-4 py-2 text-[10px] font-bold text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-primary" />
                        <span>Solution.java</span>
                      </div>
                      {st.codeSnippet && (
                        <Button
                          onClick={() => handleTryItClick(st.codeSnippet)}
                          variant="outline"
                          size="sm"
                          className="h-6 text-[9px] gap-1 px-2.5 font-bold hover:bg-primary/5 text-primary transition-all bg-background cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current text-primary" />
                          Run & Test Code
                        </Button>
                      )}
                    </div>

                    {/* Editor Textarea */}
                    <div className="flex font-mono text-sm bg-secondary/15 rounded-b-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 h-[340px]">
                      {/* Lines numbers sidebar */}
                      <div className="bg-secondary/35 select-none text-right py-3.5 px-3 border-r border-border text-[10px] text-muted-foreground/35 w-12 leading-[21px] shrink-0 font-medium">
                        {lineNumbers.map((n) => (
                          <div key={n}>{n}</div>
                        ))}
                      </div>
                      {/* Code Area */}
                      <textarea
                        value={st.codeSnippet || ''}
                        onChange={(e) => handleSubTopicChange(st.id, 'codeSnippet', e.target.value)}
                        className="flex-1 py-3.5 px-4 bg-transparent outline-none border-none text-foreground text-xs leading-[21px] font-mono resize-none h-full overflow-y-auto focus:ring-0"
                        placeholder="// Enter Java source code template..."
                      />
                    </div>
                  </div>

                  {/* Right block: Monospace notes & pros/cons columns (4 columns) */}
                  <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                    {/* Notes Textarea */}
                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Study Notes & logic
                      </label>
                      <textarea
                        value={st.notes || ''}
                        onChange={(e) => handleSubTopicChange(st.id, 'notes', e.target.value)}
                        className="w-full flex-1 min-h-[160px] px-3.5 py-3 rounded-2xl bg-secondary/15 text-foreground text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="Key steps, indices, binary splits or partition parameters..."
                      />
                    </div>

                    {/* Pros and Cons lists side-by-side (non-truncated!) */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-secondary/10 rounded-2xl shrink-0">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Advantages
                        </span>
                        <ul className="text-[10px] text-muted-foreground space-y-1.5 pl-1 list-disc list-inside leading-relaxed">
                          {st.pros && st.pros.length > 0 ? (
                            st.pros.map((p, i) => <li key={i} className="leading-relaxed whitespace-normal text-muted-foreground" title={p}>{p}</li>)
                          ) : (
                            <li className="italic">Simple implementation</li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-red-500" />
                          Drawbacks
                        </span>
                        <ul className="text-[10px] text-muted-foreground space-y-1.5 pl-1 list-disc list-inside leading-relaxed">
                          {st.cons && st.cons.length > 0 ? (
                            st.cons.map((c, i) => <li key={i} className="leading-relaxed whitespace-normal text-muted-foreground" title={c}>{c}</li>)
                          ) : (
                            <li className="italic">Time complexity constraints</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Subtopic specific reference links moved below notes inside subtopic card */}
                {st.resourceLinks && st.resourceLinks.length > 0 && (
                  <div className="mt-4 p-4 bg-secondary/10 rounded-2xl space-y-2">
                    <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      Reference Lectures & Guides
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {st.resourceLinks.map((link: string, idx: number) => {
                        let name = "Video Guide";
                        const low = link.toLowerCase();
                        if (low.includes('striver') || low.includes('takeuforward')) name = "Striver's Video Explanation 🎥";
                        else if (low.includes('neetcode')) name = "NeetCode Video 🎥";
                        else if (low.includes('abdul') || low.includes('bari')) name = "Abdul Bari Lecture 🎥";
                        else if (low.includes('kunal')) name = "Kunal Kushwaha Tutorial 🎥";

                        return (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 pill-soft pill-soft-interactive bg-background hover:bg-primary/5 text-xs font-semibold text-foreground"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                            {name}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* --- TRY IT CLIPBOARD REDIRECTION DIALOG --- */}
      {showTryItModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm overflow-hidden overlay-soft bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Redirection to Java Compiler</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Java code snippet has been automatically copied to your clipboard.
                </p>
              </div>
            </div>

            <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the <strong>Open Compiler</strong> button.</li>
                <li>In the new tab, select all text in the editor and delete it.</li>
                <li>Paste the copied Java code (<strong>Ctrl + V</strong>).</li>
                <li>Click the <strong>Run</strong> button to test your implementation.</li>
              </ol>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTryItModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmTryIt}
                className="text-xs font-semibold gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Compiler
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
