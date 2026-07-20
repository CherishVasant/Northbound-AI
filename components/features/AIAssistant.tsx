'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bot,
  Sparkles,
  SendHorizontal,
  MessageSquare,
  Loader2,
  X,
  Check,
  Copy,
  History,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIMessage, DSAProblem, STORAGE_KEYS, generateId, ChatSession } from '@/lib/utils/storage';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import {
  SEED_HR_QUESTIONS,
  SEED_CONCEPTS,
  SEED_PROJECTS,
  SEED_CERTIFICATIONS,
  SEED_APTITUDE_TOPICS,
} from '@/lib/utils/mockData';
import { getApiUrl } from '@/lib/api';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentProblem?: DSAProblem;
  onAutofillData?: (fields: Partial<DSAProblem>) => void;
}

// Preset database of common problems for offline fallback
const LEETCODE_DATABASE: Record<string, Partial<DSAProblem>> = {
  'two sum': {
    topic: 'Hashing',
    pattern: 'Hash Map',
    difficulty: 'Easy',
    approach: 'Use a hash map to store visited numbers and their corresponding array indices. For each element in the array, look up if its complement (target - nums[i]) already exists in the map.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    recognitionTrigger: 'Need to search for pairs summing to a target with O(N) or better time complexity.',
    keyInsight: 'We can trade memory for speed. Storing previously seen values allows us to check for complements in O(1) time instead of nesting loops.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    pitfalls: 'Make sure not to match a number with itself (the same element cannot be used twice). Ensure indices returned are different.',
    explanation: 'Initialize an empty hash map `seen`. Loop through `nums` with index `i`. Compute `complement = target - num`. If `complement` is in `seen`, return `[seen[complement], i]`. Otherwise, insert `num` with value `i` into `seen`.'
  },
  'reverse linked list': {
    topic: 'Linked List',
    pattern: 'Linked List',
    difficulty: 'Easy',
    approach: 'Iteratively adjust node pointers in-place. Maintain three references: prev (null), curr (head), and next (null). Re-point curr.next to prev, then advance prev and curr forward.',
    constraints: 'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
    recognitionTrigger: 'Reverse the ordering sequence of nodes in a singly linked list in O(1) extra space.',
    keyInsight: 'Before re-pointing the curr.next reference backwards, we must store a pointer to the next node, otherwise we lose access to the remaining list.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    pitfalls: 'Losing reference to the next node before modifying current node\'s next. Returning head instead of prev (the new head is prev).',
    explanation: 'Set prev = null, curr = head. Iterate while curr is not null. Temporarily store `nxt = curr.next`. Update `curr.next = prev`. Move `prev = curr` and `curr = nxt`. Finally, return `prev` as the new head.'
  }
};

// Extract JSON actions
function extractJsonActionBlocks(text: string): { raw: string; parsed: any }[] {
  const blocks: { raw: string; parsed: any }[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') {
        inStr = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const raw = text.slice(i, j + 1);
          if (raw.includes('"action"')) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.action) blocks.push({ raw, parsed });
            } catch {
              // ignore
            }
          }
          i = j;
          break;
        }
      }
    }
  }
  return blocks;
}

// Code Block Component
function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-soft overflow-hidden my-3 bg-secondary/5 border border-border/60 rounded-lg">
      <div className="bg-secondary/40 px-3 py-1.5 border-b border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-bold">
        <span className="uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[10.5px] font-mono leading-relaxed text-foreground bg-secondary/5">
        <code>{content}</code>
      </pre>
    </div>
  );
}

interface AIAssistantInnerProps extends AIAssistantProps {
  agentKey: string;
}

function AIAssistantInner({
  isOpen,
  onClose,
  currentProblem,
  onAutofillData,
  agentKey,
}: AIAssistantInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'chat' | 'autofill'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Autofill form state
  const [apName, setApName] = useState('');
  const [apLink, setApLink] = useState('');
  const [apStatement, setApStatement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modules loading
  const [dsaProblems] = useLocalStorage<any[]>(STORAGE_KEYS.DSA_PROBLEMS, []);
  const [projects, setProjects] = useLocalStorage<any[]>(STORAGE_KEYS.PROJECTS, SEED_PROJECTS);
  const [certifications, setCertifications] = useLocalStorage<any[]>(STORAGE_KEYS.CERTIFICATIONS, SEED_CERTIFICATIONS);
  const [hrQuestions, setHRQuestions] = useLocalStorage<any[]>(STORAGE_KEYS.HR_QUESTIONS, SEED_HR_QUESTIONS);
  const [savedConcepts, setSavedConcepts] = useLocalStorage<any[]>(STORAGE_KEYS.CONCEPTS, SEED_CONCEPTS);

  // Chats and active chat selection state
  const [chats, setChats, isChatsLoaded] = useLocalStorage<ChatSession[]>(STORAGE_KEYS.AI_CHATS, []);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(false);

  const showAutofillTab = pathname.startsWith('/dsa');

  // Auto-select first chat
  useEffect(() => {
    if (isChatsLoaded && chats && chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [isChatsLoaded, chats, activeChatId]);

  // Reset to chat if not DSA
  useEffect(() => {
    if (!showAutofillTab && activeTab === 'autofill') {
      setActiveTab('chat');
    }
  }, [pathname, showAutofillTab, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  // Sync autofill context if LeetCode problem changes
  useEffect(() => {
    if (currentProblem) {
      setApName(currentProblem.problemName);
      setApLink(currentProblem.link);
    }
  }, [currentProblem]);

  const activeChat = chats?.find((c) => c.id === activeChatId) || null;
  const messages = activeChat ? activeChat.messages : [];

  const getPageInfo = () => {
    if (pathname.startsWith('/dsa')) return { page: 'dsa', agent: 'course-agent' };
    if (pathname.startsWith('/concepts')) return { page: 'concepts', agent: 'course-agent' };
    if (pathname.startsWith('/subjects')) return { page: 'subjects', agent: 'course-agent' };
    if (pathname.startsWith('/projects')) return { page: 'projects', agent: 'portfolio-agent' };
    if (pathname.startsWith('/placement')) return { page: 'placement', agent: 'placement-agent' };
    if (pathname.startsWith('/prep')) {
      const tab = searchParams.get('tab') || 'aptitude';
      if (tab === 'hr') return { page: 'prep_hr', agent: 'interview-agent' };
      if (tab === 'aptitude') return { page: 'prep_aptitude', agent: 'aptitude-agent' };
      if (tab === 'certifications') return { page: 'prep_certifications', agent: 'credential-agent' };
    }
    return { page: 'dashboard', agent: 'placement-agent' };
  };

  const createNewChat = (firstMsg?: string) => {
    const info = getPageInfo();
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    let title = 'New Chat';
    if (firstMsg) {
      title = firstMsg.substring(0, 40) + (firstMsg.length > 40 ? '...' : '');
    }

    const newChat: ChatSession = {
      id: newId,
      title,
      pageContext: info.page,
      agent: info.agent,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setChats((prev) => [newChat, ...(prev || [])]);
    setActiveChatId(newId);
    return newChat;
  };

  const executeActionDirectly = (action: string, payload: any) => {
    try {
      if (action === 'AUTOFILL_DSA') {
        if (onAutofillData) {
          onAutofillData(payload);
        }
      } else if (action === 'ADD_PROJECT') {
        setProjects((prev) => {
          const updated = [...(prev || [])];
          const existing = updated.findIndex((p: any) => p.name?.toLowerCase() === payload.name?.toLowerCase());
          const fresh = {
            id: existing > -1 ? updated[existing].id : generateId(),
            name: payload.name,
            description: payload.description || '',
            techStack: payload.techStack || [],
            status: payload.status || 'Planned',
            notes: payload.notes || '',
            lastUpdated: new Date().toISOString(),
          };
          if (existing > -1) {
            updated[existing] = fresh;
          } else {
            updated.push(fresh);
          }
          return updated;
        });
      } else if (action === 'ADD_HR_QUESTION') {
        setHRQuestions((prev) => {
          const updated = [...(prev || [])];
          const existing = updated.findIndex((q: any) => q.question?.toLowerCase() === payload.question?.toLowerCase());
          const fresh = {
            id: existing > -1 ? updated[existing].id : generateId(),
            question: payload.question,
            draftAnswer: payload.draftAnswer || '',
            tags: payload.tags || [],
            source: payload.source || 'AI Agent',
            completed: false,
          };
          if (existing > -1) {
            updated[existing] = fresh;
          } else {
            updated.push(fresh);
          }
          return updated;
        });
      } else if (action === 'ADD_CERTIFICATION') {
        setCertifications((prev) => {
          const updated = [...(prev || [])];
          const existing = updated.findIndex((c: any) => c.name?.toLowerCase() === payload.name?.toLowerCase());
          const fresh = {
            id: existing > -1 ? updated[existing].id : generateId(),
            name: payload.name,
            provider: payload.provider || '',
            status: payload.status || 'Not Started',
            deadline: payload.deadline || '',
            link: payload.link || '',
            notes: payload.notes || '',
          };
          if (existing > -1) {
            updated[existing] = fresh;
          } else {
            updated.push(fresh);
          }
          return updated;
        });
      } else if (action === 'UPDATE_CONCEPT_CODE') {
        setSavedConcepts((prev) => {
          const updated = [...(prev || [])];
          const index = updated.findIndex((c: any) => c.id === payload.conceptId);
          const existing = index > -1 ? updated[index] : SEED_CONCEPTS.find((c) => c.id === payload.conceptId);
          if (!existing) return prev;

          let fresh = { ...existing };
          if (payload.subTopicId && existing.subTopics) {
            const subTopicsList = [...existing.subTopics];
            const subIdx = subTopicsList.findIndex((st) => st.id === payload.subTopicId);
            const subExisting = subIdx > -1 ? subTopicsList[subIdx] : null;

            const subFresh = {
              id: payload.subTopicId,
              name: subExisting ? subExisting.name : 'Updated Subtopic',
              codeSnippet: payload.code,
              notes: payload.notes || '',
            };
            if (subIdx > -1) {
              subTopicsList[subIdx] = { ...subTopicsList[subIdx], ...subFresh };
            } else {
              subTopicsList.push(subFresh);
            }
            fresh = {
              ...existing,
              subTopics: subTopicsList,
              lastUpdated: new Date().toISOString(),
            };
          } else {
            fresh = {
              ...existing,
              codeSnippet: payload.code,
              notes: payload.notes || '',
              lastUpdated: new Date().toISOString(),
            };
          }

          if (index > -1) {
            updated[index] = fresh;
          } else {
            updated.push(fresh);
          }
          return updated;
        });
      }
    } catch (e) {
      console.error('[Action Execution Failed]', e);
    }
  };

  const getChatFallbackResponse = (query: string): string => {
    const canonical = query.trim().toLowerCase();
    const entry = Object.entries(LEETCODE_DATABASE).find(([k]) => canonical.includes(k));
    if (entry) {
      const [, val] = entry;
      return `Here is the offline study guide for **${val.topic} / ${val.pattern}**:\n\n` +
             `* **Topic**: ${val.topic}\n` +
             `* **Pattern**: ${val.pattern}\n` +
             `* **Difficulty**: ${val.difficulty}\n\n` +
             `### Explanation\n${val.explanation}\n\n` +
             `### Key Insight\n${val.keyInsight}\n\n` +
             `### Time Complexity\n\`${val.timeComplexity}\`\n\n` +
             `### Space Complexity\n\`${val.spaceComplexity}\`\n\n` +
             `### Runnable Code Implementation\n\`\`\`python\n# Optimal solution code\n# ...\n\`\`\``;
    }
    return 'I am currently offline or OpenRouter is unavailable. I can help explain core concepts such as sorting, tree traversals, database locks, or STAR frameworks. Please check your internet connectivity.';
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    let currentChatId = activeChatId;
    let isNewChat = false;

    if (!currentChatId) {
      const newChat = createNewChat(chatInput);
      currentChatId = newChat.id;
      isNewChat = true;
    }

    setChats((prev) =>
      (prev || []).map((c) => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: [...c.messages, userMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    const promptToSend = chatInput;
    setChatInput('');
    setIsLoading(true);

    try {
      const totalProblems = dsaProblems?.length || 0;
      const masteredProblems = dsaProblems?.filter((p: any) => p.status === 'Mastered').length || 0;

      let pageContextPrompt = '';

      if (pathname.startsWith('/dsa')) {
        pageContextPrompt = `The user is on the LeetCode Tracker page. 
Current selected problem context: ${currentProblem ? JSON.stringify(currentProblem) : 'None'}.
Explain algorithms, complexities, write clean Python/Java code, and debug. 
If they request to add or autofill a DSA problem, format a JSON block at the end of your response:
{
  "action": "AUTOFILL_DSA",
  "payload": {
    "problemName": "Name of problem",
    "link": "Leetcode URL if any",
    "topic": "Arrays | Strings | Hashing | ...",
    "pattern": "e.g. Sliding Window",
    "difficulty": "Easy | Medium | Hard",
    "approach": "Short optimal algorithm summary",
    "constraints": "Problem constraints",
    "recognitionTrigger": "Why choose this pattern",
    "keyInsight": "Crucial optimization hook",
    "timeComplexity": "O(N) etc",
    "spaceComplexity": "O(1) etc",
    "pitfalls": "Common bugs",
    "explanation": "Detailed explanation",
    "code": "Python/Java solution code"
  }
}`;
      } else if (pathname.startsWith('/concepts')) {
        const urlTopicId = searchParams.get('topicId') || '';
        const activeConcept = SEED_CONCEPTS.find((c) => c.id === urlTopicId);

        let conceptContext = '';
        if (activeConcept) {
          conceptContext = `The user is currently studying this concept:
- Concept Name: "${activeConcept.topicName}"
- Concept ID: "${activeConcept.id}"
- Section Title: "${activeConcept.sectionTitle}"\n`;

          if (activeConcept.subTopics && activeConcept.subTopics.length > 0) {
            conceptContext += `This concept has multiple subtopics. Here is the list of subtopics with their IDs:\n`;
            activeConcept.subTopics.forEach((st) => {
              conceptContext += `  - Subtopic Name: "${st.name}", ID: "${st.id}"\n`;
            });
            conceptContext += `\nIf the user asks to modify, write, optimize, or generate code for a specific subtopic, you MUST set "subTopicId" to that specific subtopic's ID.\n`;
          } else {
            conceptContext += `This concept has no subtopics (it is a single topic). Set "subTopicId" to "${activeConcept.id}" when updating.\n`;
          }
        } else {
          conceptContext = 'The user is browsing the Data Concepts page but has not selected any specific topic yet. Tell them to select a topic from the sidebar.\n';
        }

        pageContextPrompt = `The user is on the DSA Concepts guide page. Explain DSA topics and clarify theoretical data structures.
${conceptContext}
When the user asks you to modify, write, optimize, or generate a Java reference implementation for the selected concept/subtopic, you MUST generate the complete, fully functional, production-ready, and runnable Java algorithm code inside a public class Main (including helper classes/methods like nodes, swaps, or traversals where applicable). 
DO NOT write simple print statement placeholders like 'System.out.println("Code is ready")' or message statements in place of the algorithm. Write the ACTUAL algorithm implementation in full.
At the end of your response, always format a JSON block to apply the code update:
{
  "action": "UPDATE_CONCEPT_CODE",
  "payload": {
    "conceptId": "${urlTopicId}",
    "subTopicId": "SELECT_CORRECT_SUBTOPIC_ID_FROM_LIST",
    "code": "FULL_JAVA_SOURCE_CODE_TEMPLATIZED_IN_CLASS_MAIN",
    "notes": "Logical steps, time complexity details, and explanations"
  }
}`;
      } else if (pathname.startsWith('/subjects')) {
        pageContextPrompt = 'The user is on the Core CS Subjects syllabus page (OS, DBMS, Networks, OOP, System Design). Help them study concepts like paging, deadlocks, transaction ACID properties, system design trade-offs, and index structures.';
      } else if (pathname.startsWith('/projects')) {
        pageContextPrompt = `The user is logging portfolio projects. If they ask to add, draft, or document a project, design the architecture, tech stack, and description, and format a JSON block at the end of your response:
{
  "action": "ADD_PROJECT",
  "payload": {
    "name": "Project Name",
    "description": "Short description",
    "techStack": ["React", "Node", "MongoDB", "etc"],
    "status": "Planned | In Progress | Done",
    "notes": "Blueprint specifications, architectural layers, and milestones"
  }
}
When the user asks you to add multiple projects at once, output one separate JSON block per project.`;
      } else if (pathname.startsWith('/prep')) {
        const activeTab = searchParams.get('tab') || 'aptitude';
        if (activeTab === 'projects') {
          pageContextPrompt = `The user is logging portfolio projects. If they ask to add, draft, or document a project, design the architecture, tech stack, and description, and format a JSON block at the end of your response:
{
  "action": "ADD_PROJECT",
  "payload": {
    "name": "Project Name",
    "description": "Short description",
    "techStack": ["React", "Node", "MongoDB", "etc"],
    "status": "Planned | In Progress | Done",
    "notes": "Blueprint specifications, architectural layers, and milestones"
  }
}
When the user asks you to add multiple projects at once, output one separate JSON block per project.`;
        } else if (activeTab === 'hr') {
          pageContextPrompt = `The user is preparing for HR behavioral interviews. 
Help them formulate the best answer using STAR framework. 
If they want to add a new question to their prep checklist, format a JSON block at the end of your response:
{
  "action": "ADD_HR_QUESTION",
  "payload": {
    "question": "Behavioral question text",
    "draftAnswer": "Refined STAR answer guide",
    "tags": ["communication", "conflict", "etc"],
    "source": "AI Agent / User Scenario"
  }
}
If they want to update an existing question's answer, use the UPDATE_HR_ANSWER action.`;
        } else if (activeTab === 'certifications') {
          pageContextPrompt = `The user is logging their professional certifications. 
If they want to explore, study, or add a certificate (e.g., "add AWS Certified Solutions Architect"), search the web or your knowledge for credentials details, provider details, target deadline, syllabus links, and recommendations to prepare.
You MUST output a JSON block at the end of your response to execute this action.
If there are fields you do not know or are not specified, leave them as empty strings ("") or ask the user, but still output the JSON block with those empty fields.
Format the JSON block exactly like this:
\`\`\`json
{
  "action": "ADD_CERTIFICATION",
  "payload": {
    "name": "Full Certification Name",
    "provider": "AWS | Google | Linux Foundation | Oracle | etc (leave blank if unknown)",
    "status": "Not Started | In Progress | Completed",
    "deadline": "YYYY-MM-DD (leave blank if unknown)",
    "link": "Official credentials/provider syllabus details link (leave blank if unknown)",
    "notes": "Detailed study guide, exam format, domains covered, and recommendations to prepare (leave blank if unknown)"
  }
}
\`\`\``;
        } else {
          pageContextPrompt = 'The user is practicing Quantitative, Logical, or Verbal Aptitude. Solve puzzles, explain formulas, or guide them through aptitude concepts.';
        }
      } else {
        pageContextPrompt = `The user is on the Dashboard. 
Current progress metrics:
- DSA problems: ${masteredProblems}/${totalProblems} mastered.
- Active agent context: "${agentKey}".

If the user asks "In what areas do I need to improve?" or similar, analyze this progress data:
Identify modules with low completion percentages, suggest specific focus areas, and give a motivational, data-backed assessment.`;
      }

      const systemPrompt = `You are Northbound AI, a unified assistant helper for the PrepTrack application. Keep your answers concise, structured, and informative. Use markdown formatting. \n\n${pageContextPrompt}`;

      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          systemPrompt,
          history: messages,
          generateTitle: isNewChat,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      let cleanContent = (data.text || '').trim();

      const actionBlocks = extractJsonActionBlocks(cleanContent);
      for (const block of actionBlocks) {
        if (block.parsed.action && block.parsed.payload) {
          executeActionDirectly(block.parsed.action, block.parsed.payload);
        }
        cleanContent = cleanContent.replace(block.raw, '');
      }
      cleanContent = cleanContent
        .replace(/```(?:json)?\s*```/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanContent || 'I have processed the request and updated the database.',
        timestamp: new Date().toISOString(),
      };

      setChats((prev) =>
        (prev || []).map((c) => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, aiMsg],
              title: data.title || c.title,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      console.error(err);
      const fallbackContent = getChatFallbackResponse(promptToSend);
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ *[OpenRouter Error - offline fallback used]*\n\n${fallbackContent}`,
        timestamp: new Date().toISOString(),
      };
      setChats((prev) =>
        (prev || []).map((c) => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, aiMsg],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAutofillConfig = () => {
    return {
      title: 'LeetCode Autofill Generator',
      desc: 'Generate optimal Approach, Pattern, Complexity, and Solution Code from a problem name.',
      label1: 'Problem Name',
      placeholder1: 'e.g. 3Sum',
      label2: 'LeetCode URL (Optional)',
      placeholder2: 'e.g. https://leetcode.com/problems/3sum/',
      label3: 'Problem Description (Optional)',
      placeholder3: 'Paste description text here...',
    };
  };

  const fillConfig = getAutofillConfig();

  const parseInlineMarkdown = (text: string) => {
    const inlineRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = text.split(inlineRegex);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-secondary/65 px-1 py-0.5 rounded font-mono text-[10.5px] text-primary">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2],
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return (
      <div className="space-y-3 animate-in fade-in-30">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return <CodeBlock key={index} language={part.language || 'plaintext'} content={part.content} />;
          }

          const lines = part.content.split('\n');
          return (
            <div key={index} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();

                if (trimmed.startsWith('### ')) {
                  return (
                    <h5
                      key={lIdx}
                      className="text-xs font-extrabold text-foreground uppercase tracking-wider mt-3 mb-1"
                    >
                      {parseInlineMarkdown(trimmed.slice(4))}
                    </h5>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h4 key={lIdx} className="text-xs font-extrabold text-foreground uppercase tracking-wide mt-3 mb-1">
                      {parseInlineMarkdown(trimmed.slice(3))}
                    </h4>
                  );
                }
                if (trimmed.startsWith('# ')) {
                  return (
                    <h3 key={lIdx} className="text-sm font-extrabold text-foreground mt-4 mb-2">
                      {parseInlineMarkdown(trimmed.slice(2))}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex gap-2 text-[11.5px] leading-relaxed pl-2">
                      <span className="text-primary select-none shrink-0">•</span>
                      <span className="flex-1">{parseInlineMarkdown(trimmed.slice(2))}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s/.test(trimmed)) {
                  const match = trimmed.match(/^(\d+)\.\s(.*)/);
                  const num = match ? match[1] : '1';
                  const content = match ? match[2] : trimmed;
                  return (
                    <div key={lIdx} className="flex gap-2 text-[11.5px] leading-relaxed pl-2">
                      <span className="text-primary select-none font-bold shrink-0">{num}.</span>
                      <span className="flex-1">{parseInlineMarkdown(content)}</span>
                    </div>
                  );
                }

                if (!trimmed) return <div key={lIdx} className="h-1.5" />;
                return (
                  <p key={lIdx} className="text-[11.5px] leading-relaxed text-foreground/90">
                    {parseInlineMarkdown(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const handleUniversalAutofillGenerate = async () => {
    if (!apName.trim() && !apStatement.trim()) return;

    setIsGenerating(true);
    setActiveTab('chat');

    const initialMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Autofill request for problem: "${apName || 'unspecified'}"\nLink: ${apLink || 'None'}\nDescription Context: ${apStatement ? apStatement.substring(0, 100) + '...' : 'None'}`,
      timestamp: new Date().toISOString(),
    };

    let currentChatId = activeChatId;
    if (!currentChatId) {
      const newChat = createNewChat(`Autofill: ${apName || 'DSA'}`);
      currentChatId = newChat.id;
    }

    setChats((prev) =>
      (prev || []).map((c) => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: [...c.messages, initialMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    try {
      const systemPrompt = `You are a LeetCode problem details generator. From the problem name, look up details, pattern, complexity, pitfalls, and write a runnable code implementation.
You MUST format a JSON block at the end of your response to apply details:
{
  "action": "AUTOFILL_DSA",
  "payload": {
    "problemName": "${apName}",
    "link": "${apLink}",
    "topic": "Arrays | Strings | Hashing | ...",
    "pattern": "e.g. Sliding Window",
    "difficulty": "Easy | Medium | Hard",
    "approach": "Short optimal algorithm summary",
    "constraints": "Problem constraints",
    "recognitionTrigger": "Why choose this pattern",
    "keyInsight": "Crucial optimization hook",
    "timeComplexity": "O(N) etc",
    "spaceComplexity": "O(1) etc",
    "pitfalls": "Common bugs",
    "explanation": "Detailed explanation",
    "code": "Python/Java solution code"
  }
}`;

      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate details for DSA problem: ${apName}. Additional context: ${apStatement || 'none'}.`,
          systemPrompt,
          history: [],
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      let cleanContent = (data.text || '').trim();

      const actionBlocks = extractJsonActionBlocks(cleanContent);
      for (const block of actionBlocks) {
        if (block.parsed.action && block.parsed.payload) {
          executeActionDirectly(block.parsed.action, block.parsed.payload);
        }
        cleanContent = cleanContent.replace(block.raw, '');
      }
      cleanContent = cleanContent
        .replace(/```(?:json)?\s*```/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const confirmationMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanContent || '### Autofill Completed\nI have successfully generated the optimal patterns and updated the problem details.',
        timestamp: new Date().toISOString(),
      };

      setChats((prev) =>
        (prev || []).map((c) => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, confirmationMsg],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      setActiveTab('chat');
      setApName('');
      setApLink('');
      setApStatement('');
    } catch (err: any) {
      console.error(err);
      const confirmationMsg: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ **AI generation failed. Please verify credentials/connection.**\n\n*Error: ${err.message}*`,
        timestamp: new Date().toISOString(),
      };
      setChats((prev) =>
        (prev || []).map((c) => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, confirmationMsg],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
      setActiveTab('chat');
      setApName('');
      setApLink('');
      setApStatement('');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[420px] bg-card overlay-soft flex flex-col z-40 animate-in slide-in-from-right-96 border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Northbound AI
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowChatList(!showChatList)}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              showChatList
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
            title="Chat History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu (Only visible if showAutofillTab is true and history is closed) */}
      {showAutofillTab && !showChatList && (
        <div className="flex border-b border-border text-xs font-semibold bg-secondary/10 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Agent Chat
          </button>
          <button
            onClick={() => setActiveTab('autofill')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'autofill'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Autofill Generator
          </button>
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto bg-background animate-in fade-in-50">
        {showChatList ? (
          /* CHATS LIST VIEW */
          <div className="p-4 space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Recent Chats
            </h4>
            <button
              onClick={() => {
                createNewChat();
                setShowChatList(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors border border-primary/25 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>

            {(!chats || chats.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recent chats</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {chats.map((c) => {
                  const isSelected = c.id === activeChatId;
                  const getPageIcon = (page: string) => {
                    if (page === 'placement') return '💼';
                    if (page === 'dsa' || page === 'concepts' || page === 'subjects') return '💻';
                    if (page === 'projects') return '🚀';
                    return '📝';
                  };
                  return (
                    <div
                      key={c.id}
                      className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-foreground'
                          : 'bg-secondary/20 border-transparent hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => {
                        setActiveChatId(c.id);
                        setShowChatList(false);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm shrink-0">{getPageIcon(c.pageContext)}</span>
                        <span className="text-xs font-medium truncate">{c.title || 'New Chat'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChats((prev) => (prev || []).filter((x) => x.id !== c.id));
                          if (activeChatId === c.id) {
                            setActiveChatId(null);
                          }
                        }}
                        className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete chat"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="p-4 space-y-4 min-h-full flex flex-col justify-between">
                <div className="space-y-4 flex-1">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-8 space-y-2">
                      <Bot className="w-8 h-8 text-muted-foreground/50 mx-auto animate-bounce" />
                      <p className="font-bold">Welcome to Northbound AI!</p>
                      <p className="px-6 text-[11px] leading-relaxed">
                        Hello, I'm Northbound AI. I can help you with placement preparation, course planning, lead management, interview guidance, and everything inside PrepTrack.
                      </p>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                            : 'bg-card text-foreground rounded-tl-none markdown'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          renderMarkdown(message.content)
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card rounded-xl rounded-tl-none px-3.5 py-2.5 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* AUTOFILL TAB */}
            {activeTab === 'autofill' && showAutofillTab && (
              <div className="p-5 space-y-4">
                <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3.5 space-y-1.5">
                  <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {fillConfig.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    {fillConfig.desc}
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  {fillConfig.label1 && (
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">{fillConfig.label1}</label>
                      <input
                        type="text"
                        placeholder={fillConfig.placeholder1}
                        value={apName}
                        onChange={(e) => setApName(e.target.value)}
                        className="w-full px-3 py-2 pill-soft bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {fillConfig.label2 && (
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">{fillConfig.label2}</label>
                      <input
                        type="text"
                        placeholder={fillConfig.placeholder2}
                        value={apLink}
                        onChange={(e) => setApLink(e.target.value)}
                        className="w-full px-3 py-2 pill-soft bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {fillConfig.label3 && (
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">{fillConfig.label3}</label>
                      <textarea
                        placeholder={fillConfig.placeholder3}
                        value={apStatement}
                        onChange={(e) => setApStatement(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 pill-soft bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleUniversalAutofillGenerate}
                    disabled={isGenerating || (!apName.trim() && !apStatement.trim())}
                    className="w-full gap-2 h-9 text-xs font-bold cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing & Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate & Populate Details
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat input box */}
      {activeTab === 'chat' && !showChatList && (
        <div className="border-t border-border p-3.5 bg-card shrink-0 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                currentProblem ? `Ask about ${currentProblem.problemName}...` : 'Ask Northbound AI anything...'
              }
              className="flex-1 px-3 py-2 pill-soft bg-secondary/80 text-foreground placeholder-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !chatInput.trim()}
              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AIAssistantContent(props: AIAssistantProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getAgentKey = () => {
    if (pathname.startsWith('/dsa')) return 'leetcode';
    if (pathname.startsWith('/concepts')) return 'concepts';
    if (pathname.startsWith('/subjects')) return 'subjects';
    if (pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/prep')) {
      const tab = searchParams.get('tab') || 'aptitude';
      return `prep_${tab}`;
    }
    return 'dashboard';
  };

  const agentKey = getAgentKey();

  return <AIAssistantInner agentKey={agentKey} {...props} />;
}

export function AIAssistant(props: AIAssistantProps) {
  return (
    <Suspense fallback={null}>
      <AIAssistantContent {...props} />
    </Suspense>
  );
}
