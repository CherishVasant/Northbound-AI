'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bot,
  SendHorizontal,
  Loader2,
  X,
  Check,
  Copy,
  History,
  Plus,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIMessage, STORAGE_KEYS, generateId, ChatSession } from '@/lib/utils/storage';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import {
  SEED_HR_QUESTIONS,
  SEED_CONCEPTS,
  SEED_PROJECTS,
  SEED_CERTIFICATIONS,
} from '@/lib/utils/mockData';
import { getApiUrl } from '@/lib/api';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
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
    <div className="card-soft overflow-hidden my-3 bg-secondary/5 border border-border/40 rounded-lg">
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
  agentKey,
}: AIAssistantInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [chatInput]);

  // Load all storage modules for reactive execution of actions
  const [, setDsaProblems] = useLocalStorage<any[]>(STORAGE_KEYS.DSA_PROBLEMS, []);
  const [, setSavedConcepts] = useLocalStorage<any[]>(STORAGE_KEYS.CONCEPTS, SEED_CONCEPTS);
  const [, setSubjects] = useLocalStorage<any[]>(STORAGE_KEYS.SUBJECTS, []);
  const [, setProjects] = useLocalStorage<any[]>(STORAGE_KEYS.PROJECTS, SEED_PROJECTS);
  const [, setCertifications] = useLocalStorage<any[]>(STORAGE_KEYS.CERTIFICATIONS, SEED_CERTIFICATIONS);
  const [, setHRQuestions] = useLocalStorage<any[]>(STORAGE_KEYS.HR_QUESTIONS, SEED_HR_QUESTIONS);
  const [, setPlacementCompanies] = useLocalStorage<any[]>(STORAGE_KEYS.PLACEMENT_COMPANIES, []);

  // Unified Chat Persistence via STORAGE_KEYS.AI_CHATS
  const [chats, setChats, isChatsLoaded] = useLocalStorage<ChatSession[]>(STORAGE_KEYS.AI_CHATS, []);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(false);

  // Auto-select first chat
  useEffect(() => {
    if (isChatsLoaded && chats && chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [isChatsLoaded, chats, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const activeChat = chats?.find((c) => c.id === activeChatId) || null;
  const messages = activeChat ? activeChat.messages : [];

  const getPageContextKey = () => {
    if (pathname.startsWith('/dsa')) return 'dsa';
    if (pathname.startsWith('/concepts')) return 'concepts';
    if (pathname.startsWith('/subjects')) return 'subjects';
    if (pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/placement')) return 'placement';
    if (pathname.startsWith('/prep')) {
      const tab = searchParams.get('tab') || 'aptitude';
      if (tab === 'hr') return 'prep_hr';
      if (tab === 'certifications') return 'prep_certifications';
    }
    return 'dashboard';
  };

  const createNewChat = (firstMsg?: string) => {
    const context = getPageContextKey();
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    let title = 'New Chat';
    if (firstMsg) {
      title = firstMsg.substring(0, 40) + (firstMsg.length > 40 ? '...' : '');
    }

    const newChat: ChatSession = {
      id: newId,
      title,
      pageContext: context,
      agent: context,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setChats((prev) => [newChat, ...(prev || [])]);
    setActiveChatId(newId);
    return newChat;
  };

  // --- ACTIONS EXECUTOR LAYER ---
  const executeOrchestratedAction = (action: any) => {
    if (!action || !action.entity || !action.operation || !action.payload) return;
    const { entity, operation, payload } = action;

    try {
      if (entity === 'placement') {
        if (operation === 'create') {
          setPlacementCompanies((prev) => {
            const updated = [...(prev || [])];
            const fresh = {
              id: generateId(),
              ...payload,
              createdAt: new Date().toISOString(),
              history: [
                {
                  stage: 'Applied',
                  status: 'Applied',
                  date: new Date().toISOString().split('T')[0],
                  notes: 'Added by Northbound AI',
                },
              ],
              schedule: [],
            };
            updated.push(fresh);
            return updated;
          });
        }
      } else if (entity === 'leetcode') {
        if (operation === 'create' || operation === 'update') {
          setDsaProblems((prev) => {
            const updated = [...(prev || [])];
            const existingIdx = updated.findIndex(
              (p: any) =>
                p.problemName?.toLowerCase() === payload.problemName?.toLowerCase() ||
                p.link === payload.link
            );
            const fresh = {
              id: existingIdx > -1 ? updated[existingIdx].id : generateId(),
              ...payload,
            };
            if (existingIdx > -1) {
              updated[existingIdx] = fresh;
            } else {
              updated.push(fresh);
            }
            return updated;
          });
        }
      } else if (entity === 'dsa_concept') {
        if (operation === 'update') {
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
      } else if (entity === 'subject') {
        if (operation === 'toggle_complete') {
          setSubjects((prev) => {
            const updated = [...(prev || [])];
            let subjIdx = updated.findIndex((s) => s.id === payload.subjectId);
            if (subjIdx === -1) {
              updated.push({ id: payload.subjectId, topics: [] });
              subjIdx = updated.length - 1;
            }
            const subj = { ...updated[subjIdx] };
            subj.topics = [...(subj.topics || [])];

            payload.topicIds.forEach((topicId: string) => {
              const topicIdx = subj.topics.findIndex((t: any) => t.id === topicId);
              if (topicIdx > -1) {
                subj.topics[topicIdx] = {
                  ...subj.topics[topicIdx],
                  completed: true,
                  notes: payload.notes || subj.topics[topicIdx].notes || '',
                };
              } else {
                subj.topics.push({ id: topicId, completed: true, notes: payload.notes || '' });
              }
            });

            updated[subjIdx] = subj;
            return updated;
          });
        }
      } else if (entity === 'project') {
        if (operation === 'create' || operation === 'update') {
          setProjects((prev) => {
            const updated = [...(prev || [])];
            const existingIdx = updated.findIndex(
              (p: any) => p.name?.toLowerCase() === payload.name?.toLowerCase()
            );
            const fresh = {
              id: existingIdx > -1 ? updated[existingIdx].id : generateId(),
              ...payload,
              lastUpdated: new Date().toISOString(),
            };
            if (existingIdx > -1) {
              updated[existingIdx] = fresh;
            } else {
              updated.push(fresh);
            }
            return updated;
          });
        }
      } else if (entity === 'certification') {
        if (operation === 'create' || operation === 'update') {
          setCertifications((prev) => {
            const updated = [...(prev || [])];
            const existingIdx = updated.findIndex(
              (c: any) => c.name?.toLowerCase() === payload.name?.toLowerCase()
            );
            const fresh = {
              id: existingIdx > -1 ? updated[existingIdx].id : generateId(),
              ...payload,
            };
            if (existingIdx > -1) {
              updated[existingIdx] = fresh;
            } else {
              updated.push(fresh);
            }
            return updated;
          });
        }
      } else if (entity === 'hr_question') {
        if (operation === 'create' || operation === 'update') {
          setHRQuestions((prev) => {
            const updated = [...(prev || [])];
            const existingIdx = updated.findIndex(
              (q: any) => q.question?.toLowerCase() === payload.question?.toLowerCase()
            );
            const fresh = {
              id: existingIdx > -1 ? updated[existingIdx].id : generateId(),
              ...payload,
              completed: !!payload.draftAnswer,
            };
            if (existingIdx > -1) {
              updated[existingIdx] = fresh;
            } else {
              updated.push(fresh);
            }
            return updated;
          });
        }
      }
    } catch (e) {
      console.error('[Action Execution Layer Error]', e);
    }
  };

  const handleActionResponseState = (messageId: string, status: 'approved' | 'cancelled') => {
    // Commit approval state locally to message metadata and sync
    setChats((prev) =>
      (prev || []).map((c) => {
        if (c.id === activeChatId) {
          const nextMsgs = c.messages.map((m) => {
            if (m.id === messageId) {
              const actionObj = m.payload;
              if (status === 'approved' && actionObj) {
                executeOrchestratedAction(actionObj);
              }
              return {
                ...m,
                metadata: {
                  ...m.metadata,
                  confirmationStatus: status,
                },
              };
            }
            return m;
          });
          return {
            ...c,
            messages: nextMsgs,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
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
      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          pageContext: getPageContextKey(),
          history: messages,
          generateTitle: isNewChat,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const conversationalText = data.response || 'I have completed the task.';
      const actionObj = data.action || null;

      // Auto-execute if confirmation is not required
      if (actionObj && !actionObj.requiresConfirmation) {
        executeOrchestratedAction(actionObj);
      }

      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: conversationalText,
        timestamp: new Date().toISOString(),
        action: actionObj ? `${actionObj.entity}:${actionObj.operation}` : undefined,
        payload: actionObj || undefined,
        metadata: actionObj
          ? {
              confirmationStatus: actionObj.requiresConfirmation ? 'pending' : 'approved',
            }
          : undefined,
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
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ *[Northbound AI Connection Error]*\n\nI was unable to communicate with the orchestrator backend. Please check your network and API Key configurations.`,
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
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || 'plaintext', content: match[2] });
      lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return (
      <div className="space-y-2 animate-in fade-in-30">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return <CodeBlock key={index} language={part.language || 'plaintext'} content={part.content} />;
          }
          return (
            <div key={index} className="space-y-1">
              {part.content.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('### ')) {
                  return (
                    <h5 key={lIdx} className="text-xs font-extrabold uppercase mt-2 mb-0.5 text-foreground">
                      {parseInlineMarkdown(trimmed.slice(4))}
                    </h5>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h4 key={lIdx} className="text-xs font-extrabold uppercase mt-2 mb-0.5 text-foreground">
                      {parseInlineMarkdown(trimmed.slice(3))}
                    </h4>
                  );
                }
                if (trimmed.startsWith('# ')) {
                  return (
                    <h3 key={lIdx} className="text-xs font-bold mt-3 mb-1 text-foreground">
                      {parseInlineMarkdown(trimmed.slice(2))}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex gap-1.5 pl-2 leading-relaxed text-[11px]">
                      <span className="text-primary select-none shrink-0">•</span>
                      <span>{parseInlineMarkdown(trimmed.slice(2))}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s/.test(trimmed)) {
                  return (
                    <div key={lIdx} className="flex gap-1.5 pl-2 leading-relaxed text-[11px]">
                      <span className="text-primary font-bold shrink-0">{trimmed.match(/^(\d+)\.\s/)?.[1]}.</span>
                      <span>{parseInlineMarkdown(trimmed.replace(/^\d+\.\s/, ''))}</span>
                    </div>
                  );
                }
                if (!trimmed) return <div key={lIdx} className="h-1" />;
                return (
                  <p key={lIdx} className="text-[11px] leading-relaxed">
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

  const renderConfirmationCard = (message: AIMessage) => {
    const action = message.payload;
    if (!action || !action.preview) return null;

    const preview = action.preview;
    const status = message.metadata?.confirmationStatus || 'pending';

    return (
      <div className="mt-3 bg-secondary/10 border border-border/60 rounded-lg p-3 space-y-2 text-xs w-full max-w-[90%]">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
          <div>
            <h4 className="font-bold text-foreground">{preview.title}</h4>
            <p className="text-[10px] text-muted-foreground">{preview.subtitle}</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
            Draft Action
          </span>
        </div>

        {preview.details && Object.keys(preview.details).length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px] py-1 border-b border-border/40">
            {Object.entries(preview.details).map(([key, val]) => (
              <div key={key} className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                  {key}
                </span>
                <span className="text-foreground font-medium truncate" title={String(val)}>
                  {String(val) || '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {status === 'pending' ? (
            <>
              <button
                onClick={() => handleActionResponseState(message.id, 'cancelled')}
                className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-[10.5px] font-semibold text-muted-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleActionResponseState(message.id, 'approved')}
                className="px-2.5 py-1 rounded bg-primary hover:bg-primary/90 text-[10.5px] font-semibold text-primary-foreground flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3 h-3" />
                Approve
              </button>
            </>
          ) : status === 'approved' ? (
            <span className="text-[10.5px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Check className="w-3.5 h-3.5" /> Approved & Synced
            </span>
          ) : (
            <span className="text-[10.5px] font-bold text-muted-foreground flex items-center gap-1 bg-secondary/30 border border-border px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> Discarded
            </span>
          )}
        </div>
      </div>
    );
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

            {!chats || chats.length === 0 ? (
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
          /* CHAT WINDOW */
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
                    className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-[11.5px] leading-relaxed shadow-sm ${
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
                  {/* Action Confirmation Card */}
                  {message.role === 'assistant' &&
                    message.payload &&
                    message.payload.requiresConfirmation &&
                    renderConfirmationCard(message)}
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
      </div>

      {/* Chat input box */}
      {!showChatList && (
        <div className="border-t border-border p-3.5 bg-card shrink-0 space-y-2">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Northbound AI anything..."
              className="flex-1 px-3 py-2 bg-secondary/80 text-foreground placeholder-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto max-h-[120px] rounded-lg leading-normal"
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
