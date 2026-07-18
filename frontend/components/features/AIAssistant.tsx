'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  Bot, Sparkles, SendHorizontal, MessageSquare, Loader2, X, Check, 
  Award, Briefcase, Code, Bookmark, Copy 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIMessage, DSAProblem, STORAGE_KEYS, generateId } from '@/lib/utils/storage'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import {
  SEED_HR_QUESTIONS, SEED_CONCEPTS, SEED_PROJECTS, SEED_CERTIFICATIONS,
  SEED_APTITUDE_TOPICS
} from '@/lib/utils/mockData'
import { getApiUrl } from '@/lib/api'

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  currentProblem?: DSAProblem
  onAutofillData?: (fields: Partial<DSAProblem>) => void
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
}

// Robustly extract EVERY balanced { ... } object that contains an "action" field.
// A lazy regex (\{...?"action"...?\}) stops at the first "}", which truncates any
// payload that has a nested object — producing invalid JSON that silently fails to
// parse. This scanner tracks brace depth (ignoring braces inside strings), so it
// captures each complete action block, including multiple blocks in one response
// (e.g. adding several projects at once).
function extractJsonActionBlocks(text: string): { raw: string; parsed: any }[] {
  const blocks: { raw: string; parsed: any }[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue
    let depth = 0
    let inStr = false
    let esc = false
    for (let j = i; j < text.length; j++) {
      const ch = text[j]
      if (inStr) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === '"') inStr = false
      } else if (ch === '"') {
        inStr = true
      } else if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
        if (depth === 0) {
          const raw = text.slice(i, j + 1)
          if (raw.includes('"action"')) {
            try {
              const parsed = JSON.parse(raw)
              if (parsed && parsed.action) blocks.push({ raw, parsed })
            } catch {
              /* not valid JSON — ignore this candidate */
            }
          }
          i = j // resume scanning after this object
          break
        }
      }
    }
  }
  return blocks
}

// Code Block renderer with copy capabilities
function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card-soft overflow-hidden my-3 bg-secondary/5">
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
  )
}

interface AIAssistantInnerProps extends AIAssistantProps {
  agentKey: string
}

function AIAssistantInner({ isOpen, onClose, currentProblem, onAutofillData, agentKey }: AIAssistantInnerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'chat' | 'autofill'>('chat')
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Autofill form state (Universal fields)
  const [apName, setApName] = useState('')
  const [apLink, setApLink] = useState('')
  const [apStatement, setApStatement] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Load all localStorage modules for contextual advisor & editing capability with matching page seeds
  const [dsaProblems] = useLocalStorage<any[]>(STORAGE_KEYS.DSA_PROBLEMS, [])
  const [, setSubjects] = useLocalStorage<any[]>(STORAGE_KEYS.SUBJECTS, [])
  const [projects, setProjects] = useLocalStorage<any[]>(STORAGE_KEYS.PROJECTS, SEED_PROJECTS)
  const [certifications, setCertifications] = useLocalStorage<any[]>(STORAGE_KEYS.CERTIFICATIONS, SEED_CERTIFICATIONS)
  const [hrQuestions, setHRQuestions] = useLocalStorage<any[]>(STORAGE_KEYS.HR_QUESTIONS, SEED_HR_QUESTIONS)
  const [aptitudeTopics, setAptitudeTopics] = useLocalStorage<any[]>(STORAGE_KEYS.APTITUDE_TOPICS, SEED_APTITUDE_TOPICS)
  const [savedConcepts, setSavedConcepts] = useLocalStorage<any[]>(STORAGE_KEYS.CONCEPTS, SEED_CONCEPTS)

  const showAutofillTab = pathname.startsWith('/dsa')

  // Load and persist chat history using standard React state + manual atomic localStorage updates
  const [messages, setMessages] = useState<AIMessage[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const historyKey = `preptrack_chat_history_${agentKey}`
      const saved = window.localStorage.getItem(historyKey)
      if (saved) {
        try {
          setMessages(JSON.parse(saved))
        } catch (e) {
          setMessages([])
        }
      } else {
        setMessages([])
      }
    }
  }, [agentKey])

  // Reset to chat tab if the autofill generator is not supported on this page
  useEffect(() => {
    if (!showAutofillTab && activeTab === 'autofill') {
      setActiveTab('chat')
    }
  }, [pathname, showAutofillTab, activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync autofill form name context if LeetCode problem changes
  useEffect(() => {
    if (currentProblem) {
      setApName(currentProblem.problemName)
      setApLink(currentProblem.link)
    }
  }, [currentProblem])

  // Get chatbot title depending on current route
  const getChatTitle = () => {
    if (pathname.startsWith('/dsa')) return 'LeetCode Copilot'
    if (pathname.startsWith('/concepts')) return 'Concepts Coach'
    if (pathname.startsWith('/subjects')) return 'CS Core Tutor'
    if (pathname.startsWith('/projects')) return 'Portfolio Builder'
    if (pathname.startsWith('/prep')) {
      const tab = searchParams.get('tab') || 'aptitude'
      if (tab === 'projects') return 'Portfolio Builder'
      if (tab === 'hr') return 'HR Interview Coach'
      if (tab === 'certifications') return 'Credential Specialist'
      return 'Aptitude Mentor'
    }
    return 'Placement Advisor'
  }

  // Fallbacks for Chat
  const getChatFallbackResponse = (query: string): string => {
    const probName = currentProblem?.problemName || 'the problem'
    const queryLower = query.toLowerCase()

    if (queryLower.includes('approach') || queryLower.includes('explain') || queryLower.includes('solve')) {
      return `Here is the optimal approach for **${probName}**:\n\n1. **Optimal Pattern**: ${currentProblem?.pattern || 'Detect pattern'}\n2. **Logic**: ${currentProblem?.approach || 'Apply optimal traversal'}\n3. **Key Step**: ${currentProblem?.keyInsight || 'Identify main optimization loop.'}`
    } else if (queryLower.includes('complexity') || queryLower.includes('time') || queryLower.includes('space')) {
      return `Complexity analysis for **${probName}**:\n\n- **Time Complexity**: ${currentProblem?.timeComplexity || 'O(N)'}\n- **Space Complexity**: ${currentProblem?.spaceComplexity || 'O(1)'}`
    } else if (queryLower.includes('pitfall') || queryLower.includes('mistake') || queryLower.includes('error')) {
      return `Watch out for these pitfalls on **${probName}**:\n\n- ${currentProblem?.pitfalls || 'Index out of bounds on edge values.'}\n- Handing null inputs or single node lists.`
    }
    return `I am here to guide you. Try asking about the concepts, study topics, or profile recommendations.`
  }

  // --- AUTOMATIC AGENT ACTION EXECUTION WITH FUNCTIONAL STATE UPDATERS ---
  const executeActionDirectly = (action: string, payload: any) => {
    try {
      if (action === 'ADD_PROJECT') {
        const newProj = {
          ...payload,
          id: generateId(),
          techStack: payload.techStack || [],
          skillsToLearn: payload.skillsToLearn || [],
          notes: payload.notes || '',
          link: payload.link || '',
          githubLink: payload.githubLink || '',
          liveDemo: payload.liveDemo || '',
          startDate: payload.startDate || new Date().toISOString().split('T')[0],
          endDate: payload.endDate || '',
        }
        setProjects((prev: any[]) => [...(prev || []), newProj])
      }
      else if (action === 'ADD_CERTIFICATION') {
        const newCert = {
          id: generateId(),
          name: payload.name || 'New Certification',
          provider: payload.provider || '',
          status: payload.status || 'Not Started',
          deadline: payload.deadline || '',
          link: payload.link || '',
          notes: payload.notes || '',
          certificateLink: payload.certificateLink || '',
          earnedDate: payload.earnedDate || '',
        }
        setCertifications((prev: any[]) => [...(prev || []), newCert])
      }
      else if (action === 'UPDATE_HR_ANSWER') {
        setHRQuestions((prev: any[]) => {
          const updated = [...(prev || [])]
          const index = updated.findIndex((q: any) => q.id === payload.questionId)
          const existing = index > -1 ? updated[index] : {}
          const fresh = {
            ...existing,
            id: payload.questionId,
            draftAnswer: payload.draftAnswer,
            completed: true
          }
          if (index > -1) {
            updated[index] = fresh
          } else {
            updated.push(fresh)
          }
          return updated
        })
      }
      else if (action === 'ADD_HR_QUESTION') {
        const newQ = {
          id: generateId(),
          question: payload.question || 'New Behavioral Question',
          draftAnswer: payload.draftAnswer || '',
          completed: true,
          tags: payload.tags || ['behavioral'],
          source: payload.source || 'AI Agent'
        }
        setHRQuestions((prev: any[]) => [...(prev || []), newQ])
      }
      else if (action === 'AUTOFILL_DSA') {
        if (onAutofillData) {
          onAutofillData(payload)
        }
        window.dispatchEvent(new CustomEvent('preptrack_ai_autofill_dsa', { detail: payload }))
      }
      else if (action === 'UPDATE_CONCEPT_CODE') {
        setSavedConcepts((prev: any[]) => {
          const updated = [...(prev || [])]
          const index = updated.findIndex((c) => c.id === payload.conceptId)
          const existing = index > -1 ? updated[index] : { id: payload.conceptId }
          
          let fresh;
          const targetSubId = payload.subTopicId || payload.conceptId;
          const staticConcept = SEED_CONCEPTS.find(c => c.id === payload.conceptId);
          const isMulti = staticConcept && staticConcept.subTopics && staticConcept.subTopics.length > 0;
          
          if (isMulti) {
            const subTopicsList = [...(existing.subTopics || [])]
            const subIdx = subTopicsList.findIndex((s: any) => s.id === targetSubId)
            const subFresh = { id: targetSubId, codeSnippet: payload.code, notes: payload.notes || '' }
            if (subIdx > -1) {
              subTopicsList[subIdx] = { ...subTopicsList[subIdx], ...subFresh }
            } else {
              subTopicsList.push(subFresh)
            }
            fresh = {
              ...existing,
              subTopics: subTopicsList,
              lastUpdated: new Date().toISOString()
            }
          } else {
            fresh = {
              ...existing,
              codeSnippet: payload.code,
              notes: payload.notes || '',
              lastUpdated: new Date().toISOString()
            }
          }

          if (index > -1) {
            updated[index] = fresh
          } else {
            updated.push(fresh)
          }
          return updated
        })
      }
    } catch (e) {
      console.error('[Action Execution Failed]', e)
    }
  }

  // --- SEND CHAT MESSAGE ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    }

    // Atomic update user message immediately to state and storage
    setMessages(prev => {
      const updated = [...(prev || []), userMsg]
      window.localStorage.setItem(`preptrack_chat_history_${agentKey}`, JSON.stringify(updated))
      return updated
    })

    const promptToSend = chatInput
    setChatInput('')
    setIsLoading(true)

    try {
      // Metrics analysis helper context
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
        const activeConcept = SEED_CONCEPTS.find(c => c.id === urlTopicId);
        
        let conceptContext = '';
        if (activeConcept) {
          conceptContext = `The user is currently studying this concept:
- Concept Name: "${activeConcept.topicName}"
- Concept ID: "${activeConcept.id}"
- Section Title: "${activeConcept.sectionTitle}"\n`;
          
          if (activeConcept.subTopics && activeConcept.subTopics.length > 0) {
            conceptContext += `This concept has multiple subtopics. Here is the list of subtopics with their IDs:\n`;
            activeConcept.subTopics.forEach(st => {
              conceptContext += `  - Subtopic Name: "${st.name}", ID: "${st.id}"\n`;
            });
            conceptContext += `\nIf the user asks to modify, write, optimize, or generate code for a specific subtopic, you MUST set "subTopicId" to that specific subtopic's ID.\n`;
          } else {
            conceptContext += `This concept has no subtopics (it is a single topic). Set "subTopicId" to "${activeConcept.id}" when updating.\n`;
          }
        } else {
          conceptContext = `The user is browsing the Data Concepts page but has not selected any specific topic yet. Tell them to select a topic from the sidebar.\n`;
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
        pageContextPrompt = `The user is on the Core CS Subjects syllabus page (OS, DBMS, Networks, OOP, System Design). Help them study concepts like paging, deadlocks, transaction ACID properties, system design trade-offs, and index structures.`;
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
          pageContextPrompt = `The user is practicing Quantitative, Logical, or Verbal Aptitude. Solve puzzles, explain formulas, or guide them through aptitude concepts.`;
        }
      } else {
        pageContextPrompt = `The user is on the Dashboard. 
Current progress metrics:
- DSA problems: ${masteredProblems}/${totalProblems} mastered.
- Active agent context: "${agentKey}".

If the user asks "In what areas do I need to improve?" or similar, analyze this progress data:
Identify modules with low completion percentages, suggest specific focus areas, and give a motivational, data-backed assessment.`;
      }

      const systemPrompt = `You are PrepTrack AI, a helpful placement preparation assistant. Help the user understand algorithms, solve problems, analyze time/space complexities, write clean code, project specs, and HR answers. Keep your answers concise, structured, and informative. Use markdown formatting. \n\n${pageContextPrompt}`

      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          systemPrompt,
          history: messages,
        }),
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      let cleanContent = (data.text || '').trim()

      // Extract and execute EVERY action block the model emitted (handles nested
      // JSON payloads and multiple actions per reply, e.g. several projects).
      const actionBlocks = extractJsonActionBlocks(cleanContent)
      for (const block of actionBlocks) {
        if (block.parsed.action && block.parsed.payload) {
          executeActionDirectly(block.parsed.action, block.parsed.payload)
        }
        // Remove the raw JSON from the text the user will see
        cleanContent = cleanContent.replace(block.raw, '')
      }
      // Clean up any now-empty code fences and collapsed blank lines left behind
      cleanContent = cleanContent
        .replace(/```(?:json)?\s*```/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanContent || 'I have processed the request and updated the database.',
        timestamp: new Date().toISOString()
      }

      // Atomic update AI response to state and storage
      setMessages(prev => {
        const updated = [...(prev || []), aiMsg]
        window.localStorage.setItem(`preptrack_chat_history_${agentKey}`, JSON.stringify(updated))
        return updated
      })

    } catch (err: any) {
      console.error(err)
      const fallbackContent = getChatFallbackResponse(promptToSend)
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ *[OpenRouter Error - offline fallback used]*\n\n${fallbackContent}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => {
        const updated = [...(prev || []), aiMsg]
        window.localStorage.setItem(`preptrack_chat_history_${agentKey}`, JSON.stringify(updated))
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  // --- DYNAMIC AUTOFILL GENERATOR CONFIGURATION (Only for LeetCode) ---
  const getAutofillConfig = () => {
    return {
      title: 'LeetCode Autofill Generator',
      desc: 'Generate optimal Approach, Pattern, Complexity, and Solution Code from a problem name.',
      label1: 'Problem Name',
      placeholder1: 'e.g. 3Sum',
      label2: 'LeetCode URL (Optional)',
      placeholder2: 'e.g. https://leetcode.com/problems/3sum/',
      label3: 'Problem Description (Optional)',
      placeholder3: 'Paste description text here...'
    }
  }

  const fillConfig = getAutofillConfig()

  // --- UNIVERSAL AI AUTOFILL GENERATOR HANDLER (Only for LeetCode) ---
  const handleUniversalAutofillGenerate = async () => {
    if (!apName.trim() && !apStatement.trim()) return

    setIsGenerating(true)

    try {
      const systemPrompt = `You are a DSA placement preparation assistant. Analyze the problem details and output a valid JSON object matching the structure:
{
  "topic": "Arrays | Strings | Hashing | Two Pointers | Sliding Window | Binary Search | Stack | Queue | Linked List | Trees | BST | Heap | Graphs | Tries | Greedy | Dynamic Programming | Backtracking",
  "pattern": "Identify primary pattern",
  "difficulty": "Easy | Medium | Hard",
  "approach": "Explain the step-by-step logic in 1-2 sentences",
  "constraints": "State standard key constraints",
  "recognitionTrigger": "Why choose this pattern",
  "keyInsight": "Crucial optimization hook",
  "timeComplexity": "O(N) etc",
  "spaceComplexity": "O(1) etc",
  "pitfalls": "Common bugs",
  "explanation": "Detailed explanation",
  "code": "Provide clean code class Solution"
}`;
      const promptText = `Analyze and generate details for the DSA Problem: "${apName}". Link: "${apLink}". Additional details/statement: "${apStatement}".`;

      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          systemPrompt,
        }),
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      let jsonText = (data.text || '').trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(json)?\n/, '').replace(/\n```$/, '')
      }

      const generated = JSON.parse(jsonText)
      
      const generatedFields: Partial<DSAProblem> = {
        problemName: apName,
        link: apLink,
        topic: generated.topic || 'Arrays',
        pattern: generated.pattern || 'Array Traversal',
        difficulty: generated.difficulty || 'Medium',
        approach: generated.approach || '',
        constraints: generated.constraints || '',
        recognitionTrigger: generated.recognitionTrigger || '',
        keyInsight: generated.keyInsight || '',
        timeComplexity: generated.timeComplexity || 'O(N)',
        spaceComplexity: generated.spaceComplexity || 'O(1)',
        pitfalls: generated.pitfalls || '',
        explanation: generated.explanation || '',
        code: generated.code || '',
        personalNotes: 'Generated by AI Autofiller.'
      }
      
      if (onAutofillData) {
        onAutofillData(generatedFields)
      }
      window.dispatchEvent(new CustomEvent('preptrack_ai_autofill_dsa', { detail: generatedFields }))
      
      const confirmationMsg: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✨ **Autofilled problem details for "${apName}"!**\n\nUpdates are loaded into your active editor row.`,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => {
        const updated = [...(prev || []), confirmationMsg]
        window.localStorage.setItem(`preptrack_chat_history_${agentKey}`, JSON.stringify(updated))
        return updated
      })

      setActiveTab('chat')
      setApName('')
      setApLink('')
      setApStatement('')
    } catch (err: any) {
      console.error(err)
      const confirmationMsg: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ **AI generation failed. Please verify credentials/connection.**\n\n*Error: ${err.message}*`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => {
        const updated = [...(prev || []), confirmationMsg]
        window.localStorage.setItem(`preptrack_chat_history_${agentKey}`, JSON.stringify(updated))
        return updated
      })
      setActiveTab('chat')
      setApName('')
      setApLink('')
      setApStatement('')
    } finally {
      setIsGenerating(false)
    }
  }

  // --- INLINE NATIVE MARKDOWN RENDERING IN JSX ---
  const parseInlineMarkdown = (text: string) => {
    const inlineRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = text.split(inlineRegex);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-secondary/65 px-1 py-0.5 rounded font-mono text-[10.5px] text-primary">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }

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
                    <h5 key={lIdx} className="text-xs font-extrabold text-foreground uppercase tracking-wider mt-3 mb-1">
                      {parseInlineMarkdown(trimmed.slice(4))}
                    </h5>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h4 key={lIdx} className="text-sm font-extrabold text-foreground mt-4 mb-1">
                      {parseInlineMarkdown(trimmed.slice(3))}
                    </h4>
                  );
                }
                if (trimmed.startsWith('# ')) {
                  return (
                    <h3 key={lIdx} className="text-base font-extrabold text-foreground mt-4 mb-2">
                      {parseInlineMarkdown(trimmed.slice(2))}
                    </h3>
                  );
                }

                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-2 leading-relaxed">
                      <span className="text-primary mt-1 shrink-0">•</span>
                      <span>{parseInlineMarkdown(trimmed.slice(2))}</span>
                    </div>
                  );
                }

                const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-2 leading-relaxed">
                      <span className="text-primary font-bold shrink-0">{numMatch[1]}.</span>
                      <span>{parseInlineMarkdown(numMatch[2])}</span>
                    </div>
                  );
                }

                if (trimmed === '') {
                  return <div key={lIdx} className="h-1.5" />;
                }

                return (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInlineMarkdown(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-screen w-[420px] bg-card overlay-soft flex flex-col z-40 animate-in slide-in-from-right-96">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{getChatTitle()}</h3>
            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
              {currentProblem ? `Context: ${currentProblem.problemName}` : 'AI Co-pilot Agent Active'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Menu (Only visible if showAutofillTab is true) */}
      {showAutofillTab && (
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
        
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4 min-h-full flex flex-col justify-between">
            <div className="space-y-4 flex-1">
              {(!messages || messages.length === 0) && (
                <div className="text-center text-muted-foreground text-xs py-8 space-y-2">
                  <Bot className="w-8 h-8 text-muted-foreground/50 mx-auto animate-bounce" />
                  <p className="font-bold">Welcome to PrepTrack Agent!</p>
                  <p className="px-6 text-[11px] leading-relaxed">
                    This is your context-aware co-pilot. Describe project specs, certifications, or behavioral answers in text paragraphs. The Agent will extract details, generate standard JSON definitions internally, and update your page lists instantly.
                  </p>
                </div>
              )}
              {messages && messages.map((message) => (
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
      </div>

      {/* Chat input box */}
      {activeTab === 'chat' && (
        <div className="border-t border-border p-3.5 bg-card shrink-0 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={currentProblem ? `Ask about ${currentProblem.problemName}...` : "Ask co-pilot agent anything..."}
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
  )
}

function AIAssistantContent(props: AIAssistantProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getAgentKey = () => {
    if (pathname.startsWith('/dsa')) return 'leetcode'
    if (pathname.startsWith('/concepts')) return 'concepts'
    if (pathname.startsWith('/subjects')) return 'subjects'
    if (pathname.startsWith('/projects')) return 'projects'
    if (pathname.startsWith('/prep')) {
      const tab = searchParams.get('tab') || 'aptitude'
      return `prep_${tab}`
    }
    return 'dashboard'
  }

  const agentKey = getAgentKey()

  return <AIAssistantInner key={agentKey} agentKey={agentKey} {...props} />
}

export function AIAssistant(props: AIAssistantProps) {
  return (
    <Suspense fallback={null}>
      <AIAssistantContent {...props} />
    </Suspense>
  )
}
