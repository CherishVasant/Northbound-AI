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
  Maximize2,
  Minimize2,
  FileText,
  FileCode,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Table,
  ExternalLink,
  Download,
  GripVertical,
  Sparkles,
  Edit3,
  Save,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIMessage, STORAGE_KEYS, generateId, ChatSession, ArtifactItem, ArtifactVersion } from '@/lib/utils/storage';
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
  currentProblem?: any;
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

// Interactive Artifact Modal with live editing options
interface ArtifactModalProps {
  content: string;
  title?: string;
  onClose: () => void;
  onSave?: (updatedContent: string) => void;
}

function ArtifactModal({ content: initialContent, title: initialTitle, onClose, onSave }: ArtifactModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const lines = content.split('\n');
  const lineCount = lines.length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  const rawFirstLine = (lines[0] || '').replace(/^[#*`\s-]+/, '').trim();
  const artifactTitle = initialTitle || (rawFirstLine && rawFirstLine.length < 45 ? rawFirstLine : 'Pasted Text Document');
  const isCode = content.includes('function ') || content.includes('const ') || content.includes('import ') || (content.includes('{') && content.includes('}')) || content.includes('class ');
  const docType = isCode ? 'Code Snippet' : 'Markdown Document';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isCode ? 'txt' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    setIsSaved(true);
    setIsEditing(false);
    if (onSave) onSave(content);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {isCode ? <FileCode className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>{artifactTitle}</span>
                {isEditing && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Editing Mode
                  </span>
                )}
                {isSaved && (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {docType} • {lineCount} lines • {wordCount} words ({charCount} characters)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer border border-primary/20"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Content
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors cursor-pointer"
              title="Copy text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors cursor-pointer"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-background/50 font-mono text-xs leading-relaxed">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 bg-background text-foreground font-mono text-xs leading-relaxed resize-none focus:outline-none rounded-xl border border-primary/30"
              placeholder="Edit your document or text content..."
            />
          ) : (
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-secondary/20">
                  <span className="table-cell pr-4 text-right text-muted-foreground/40 select-none w-10 text-[10px] py-0.5">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre-wrap break-words text-foreground py-0.5">
                    {line || ' '}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// User Artifact Card for large pasted content or code
function UserArtifactCard({ content }: { content: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  const lines = currentContent.split('\n');
  const lineCount = lines.length;
  const wordCount = currentContent.trim().split(/\s+/).filter(Boolean).length;

  const rawFirstLine = (lines[0] || '').replace(/^[#*`\s-]+/, '').trim();
  const artifactTitle = rawFirstLine && rawFirstLine.length < 45 ? rawFirstLine : 'Pasted Text Document';
  const isCode = currentContent.includes('function ') || currentContent.includes('const ') || currentContent.includes('import ') || (currentContent.includes('{') && currentContent.includes('}'));
  const docType = isCode ? 'Code Snippet' : 'Markdown Document';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="w-full bg-card border border-primary/30 rounded-xl overflow-hidden shadow-md my-2 transition-all hover:border-primary/50 text-xs">
        <div className="bg-primary/10 px-3.5 py-2.5 border-b border-primary/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/15 text-primary shrink-0">
              {isCode ? <FileCode className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-bold text-foreground truncate text-xs leading-tight">
                {artifactTitle}
              </span>
              <span className="text-[9.5px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                <span>{docType}</span>
                <span>•</span>
                <span>{lineCount} lines</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy artifact content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Edit artifact"
            >
              <Pencil className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>

        {/* Snippet Preview */}
        <div className="p-3 bg-secondary/15 text-[11px] font-mono text-muted-foreground border-b border-border/40">
          <div className="line-clamp-3 leading-relaxed whitespace-pre-wrap">
            {currentContent.substring(0, 180)}...
          </div>
        </div>

        {/* Click to open Full Artifact Popup */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 px-3 bg-primary/5 hover:bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-t border-primary/10"
        >
          <span>Click to View & Edit Artifact</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {isModalOpen && (
        <ArtifactModal
          content={currentContent}
          title={artifactTitle}
          onClose={() => setIsModalOpen(false)}
          onSave={(updated) => setCurrentContent(updated)}
        />
      )}
    </>
  );
}

// Detail Artifact Item for long text fields in preview cards
function DetailArtifactItem({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-secondary/30 border border-border/60 rounded-md p-2 text-[10.5px] mt-0.5">
      <div className="flex items-center justify-between gap-1 text-[9.5px] font-semibold text-muted-foreground mb-1">
        <span className="truncate">{content.length} characters</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="hover:text-foreground transition-colors p-0.5 cursor-pointer"
            title="Copy text"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
          >
            {isExpanded ? (
              <>Less <ChevronUp className="w-2.5 h-2.5" /></>
            ) : (
              <>Expand Artifact <ChevronDown className="w-2.5 h-2.5" /></>
            )}
          </button>
        </div>
      </div>
      <div className={`whitespace-pre-wrap break-words leading-relaxed text-foreground font-mono text-[10px] bg-background/60 p-2 rounded border border-border/30 ${isExpanded ? 'max-h-[350px] overflow-y-auto' : 'line-clamp-3'}`}>
        {content}
      </div>
    </div>
  );
}

// Side Window Component for active artifact (Dual-Pane View)
interface ArtifactSideWindowProps {
  artifact: ArtifactItem;
  onClose: () => void;
  onVersionSelect?: (versionNum: number) => void;
}

function ArtifactSideWindow({ artifact, onClose, onVersionSelect }: ArtifactSideWindowProps) {
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(artifact.currentVersion);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedVersionNum(artifact.currentVersion);
  }, [artifact.currentVersion, artifact.versions?.length]);

  const activeVersion = artifact.versions?.find((v) => v.version === selectedVersionNum) || {
    version: artifact.currentVersion,
    content: artifact.content,
    timestamp: artifact.updatedAt,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeVersion.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeVersion.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${activeVersion.version}.${
      artifact.type === 'code' ? 'txt' : 'md'
    }`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = activeVersion.content.split('\n');
  const wordCount = activeVersion.content.trim().split(/\s+/).filter(Boolean).length;
  const isTable = artifact.type === 'table' || (activeVersion.content.includes('|') && activeVersion.content.includes('-|-'));

  return (
    <div className="h-full flex flex-col bg-card border-l border-border animate-in slide-in-from-right-20 duration-200">
      {/* Artifact Header */}
      <div className="p-3.5 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            {isTable ? (
              <Table className="w-4 h-4" />
            ) : artifact.type === 'code' ? (
              <FileCode className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex flex-col">
            <h4 className="font-bold text-xs text-foreground truncate">{artifact.title}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
              <span className="capitalize">{artifact.type}</span>
              <span>•</span>
              <span>{lines.length} lines</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>

        {/* Version Step Navigator & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {artifact.versions && artifact.versions.length > 1 && (
            <div className="flex items-center gap-1 bg-secondary/50 border border-border/60 rounded-lg p-1 text-[11px] font-semibold">
              <button
                disabled={selectedVersionNum <= 1}
                onClick={() => {
                  const nextV = Math.max(1, selectedVersionNum - 1);
                  setSelectedVersionNum(nextV);
                  if (onVersionSelect) onVersionSelect(nextV);
                }}
                className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Previous version"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[10.5px]">
                v{selectedVersionNum} / v{artifact.versions.length}
              </span>
              <button
                disabled={selectedVersionNum >= artifact.versions.length}
                onClick={() => {
                  const nextV = Math.min(artifact.versions.length, selectedVersionNum + 1);
                  setSelectedVersionNum(nextV);
                  if (onVersionSelect) onVersionSelect(nextV);
                }}
                className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Next version"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Download document"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-l border-border/60 pl-2 ml-1"
            title="Close artifact side window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Artifact Body Viewer with line numbers */}
      <div className="flex-1 overflow-y-auto p-4 bg-background/50 font-mono text-xs leading-relaxed">
        <div className="table w-full">
          {lines.map((line, idx) => (
            <div key={idx} className="table-row hover:bg-secondary/20">
              <span className="table-cell pr-4 text-right text-muted-foreground/35 select-none w-8 text-[10px] py-0.5">
                {idx + 1}
              </span>
              <span className="table-cell whitespace-pre-wrap break-words text-foreground py-0.5">
                {line || ' '}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline Reference Pill for Chat feed
interface InlineArtifactRefPillProps {
  artifact: ArtifactItem;
  version?: number;
  onClick: () => void;
}

function InlineArtifactRefPill({ artifact, version, onClick }: InlineArtifactRefPillProps) {
  const displayVersion = version || artifact.currentVersion;
  const isTable = artifact.type === 'table' || artifact.content.includes('|');

  return (
    <button
      onClick={onClick}
      className="w-full text-left my-1.5 bg-card hover:bg-secondary/30 border border-primary/30 hover:border-primary/60 rounded-xl p-3 shadow-sm transition-all group cursor-pointer flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
          {isTable ? (
            <Table className="w-4 h-4" />
          ) : artifact.type === 'code' ? (
            <FileCode className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="font-bold text-foreground truncate text-xs group-hover:text-primary transition-colors">
            {artifact.title}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.2 rounded">
              v{displayVersion}
            </span>
            <span>•</span>
            <span>Open in artifact window ▸</span>
          </span>
        </div>
      </div>
      <div className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

interface AIAssistantInnerProps extends AIAssistantProps {
  agentKey: string;
}

export interface PreSendArtifact {
  id: string;
  title: string;
  type: 'markdown' | 'code' | 'table' | 'text';
  content: string;
  wordCount: number;
  lineCount: number;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number>(460);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const [attachments, setAttachments] = useState<PreSendArtifact[]>([]);
  const [activeModalArtifact, setActiveModalArtifact] = useState<PreSendArtifact | null>(null);

  const updatePanelWidth = (newWidth: number) => {
    const clamped = Math.max(340, Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.85 : 1200, newWidth));
    setPanelWidth(clamped);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--ai-panel-width', `${clamped}px`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePanelWidth(panelWidth);
    }
  }, [isOpen]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startX - moveEvent.clientX;
      updatePanelWidth(startWidth + deltaX);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const words = pastedText.trim().split(/\s+/).filter(Boolean).length;
    const lines = pastedText.split('\n');

    if (words > 30 || lines.length > 3 || pastedText.length > 180) {
      e.preventDefault();

      const rawFirstLine = (lines[0] || '').replace(/^[#*`\s-]+/, '').trim();
      const derivedTitle = rawFirstLine && rawFirstLine.length < 40
        ? rawFirstLine
        : `Attachment ${attachments.length + 1}`;

      const isCode = pastedText.includes('function ') || pastedText.includes('const ') || pastedText.includes('import ') || (pastedText.includes('{') && pastedText.includes('}'));
      const artType = isCode ? 'code' : 'markdown';

      const newAttachment: PreSendArtifact = {
        id: generateId(),
        title: derivedTitle,
        type: artType,
        content: pastedText,
        wordCount: words,
        lineCount: lines.length,
      };

      setAttachments((prev) => [...prev, newAttachment]);
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
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
  const [dsaProblems, setDsaProblems] = useLocalStorage<any[]>(STORAGE_KEYS.DSA_PROBLEMS, []);
  const [, setSavedConcepts] = useLocalStorage<any[]>(STORAGE_KEYS.CONCEPTS, SEED_CONCEPTS);
  const [, setSubjects] = useLocalStorage<any[]>(STORAGE_KEYS.SUBJECTS, []);
  const [projects, setProjects] = useLocalStorage<any[]>(STORAGE_KEYS.PROJECTS, SEED_PROJECTS);
  const [certifications, setCertifications] = useLocalStorage<any[]>(STORAGE_KEYS.CERTIFICATIONS, SEED_CERTIFICATIONS);
  const [hrQuestions, setHRQuestions] = useLocalStorage<any[]>(STORAGE_KEYS.HR_QUESTIONS, SEED_HR_QUESTIONS);
  const [placementCompanies, setPlacementCompanies] = useLocalStorage<any[]>(STORAGE_KEYS.PLACEMENT_COMPANIES, []);

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

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, chats, activeChatId]);

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
        if (operation === 'create' || operation === 'update') {
          setPlacementCompanies((prev) => {
            const updated = [...(prev || [])];

            const targetIdNum = typeof payload.id === 'number'
              ? payload.id
              : (typeof payload.id === 'string' && !isNaN(Number(payload.id)) ? Number(payload.id) : null);

            let existingIdx = updated.findIndex(
              (c: any) =>
                (targetIdNum !== null && c.id === targetIdNum) ||
                (payload.name && c.name?.toLowerCase().trim() === payload.name?.toLowerCase().trim())
            );

            if (operation === 'update' && existingIdx === -1 && updated.length > 0) {
              existingIdx = updated.findIndex(
                (c: any) => c.name?.toLowerCase().trim() === payload.name?.toLowerCase().trim()
              );
            }

            if (existingIdx > -1) {
              const existing = updated[existingIdx];
              const mergedSkills = Array.from(new Set([
                ...(existing.skills || []),
                ...(Array.isArray(payload.skills) ? payload.skills : []),
              ]));
              const mergedHistory = [...(existing.history || [])];
              if (Array.isArray(payload.history)) {
                payload.history.forEach((h: any) => {
                  const at = mergedHistory.findIndex((eh: any) => eh.stage === h.stage);
                  if (at === -1) {
                    mergedHistory.push(h);
                  } else {
                    mergedHistory[at] = {
                      ...h,
                      ...mergedHistory[at],
                      date: mergedHistory[at].date || h.date || '',
                      time: mergedHistory[at].time || h.time || '',
                      notes: mergedHistory[at].notes || h.notes || '',
                    };
                  }
                });
              }
              const mergedMiscNotes = payload.miscellaneousNotes
                ? (existing.miscellaneousNotes && existing.miscellaneousNotes.trim()
                    ? (existing.miscellaneousNotes.includes(payload.miscellaneousNotes.trim())
                        ? existing.miscellaneousNotes
                        : `${existing.miscellaneousNotes.trim()}\n${payload.miscellaneousNotes.trim()}`)
                    : payload.miscellaneousNotes)
                : existing.miscellaneousNotes;

              const mergedNotes = payload.notes
                ? (existing.notes && existing.notes.trim()
                    ? (existing.notes.includes(payload.notes.trim())
                        ? existing.notes
                        : `${existing.notes.trim()}\n${payload.notes.trim()}`)
                    : payload.notes)
                : existing.notes;

              const derivedYear = payload.year === 'third' || payload.year === 'fourth'
                ? payload.year
                : (existing.year || (payload.kind === 'internship' ? 'third' : 'fourth'));

              const derivedKind = ['placement', 'internship', 'internship_placement', 'internship_ppo'].includes(payload.kind)
                ? payload.kind
                : (existing.kind || 'placement');

              const derivedComp = payload.compensation
                ? {
                    amount: Number(payload.compensation.amount) || 0,
                    unit: payload.compensation.unit === 'per-month' ? 'per-month' : 'LPA',
                  }
                : existing.compensation;

              updated[existingIdx] = {
                ...existing,
                ...payload,
                year: derivedYear,
                kind: derivedKind,
                compensation: derivedComp,
                skills: mergedSkills,
                notes: mergedNotes,
                miscellaneousNotes: mergedMiscNotes,
                history: mergedHistory,
              };
            } else {
              const nextId = updated.reduce((max, c) => (typeof c.id === 'number' && Number.isFinite(c.id) && c.id > max ? c.id : max), 0) + 1;
              const derivedYear = payload.year === 'third' || payload.year === 'fourth'
                ? payload.year
                : (payload.kind === 'internship' ? 'third' : 'fourth');

              const derivedKind = ['placement', 'internship', 'internship_placement', 'internship_ppo'].includes(payload.kind)
                ? payload.kind
                : 'placement';

              const derivedComp = {
                amount: Number(payload.compensation?.amount) || 0,
                unit: payload.compensation?.unit === 'per-month' ? 'per-month' : 'LPA',
              };

              const rawHistory = Array.isArray(payload.history) && payload.history.length > 0
                ? payload.history
                : [
                    {
                      stage: 'Resume/CGPA',
                      status: 'Preparing',
                      date: new Date().toISOString().slice(0, 10),
                      time: '',
                      notes: '',
                    },
                  ];

              const fresh = {
                id: nextId,
                name: String(payload.name || 'Untitled Company').trim(),
                role: String(payload.role || 'Software Engineer').trim(),
                year: derivedYear,
                kind: derivedKind,
                compensation: derivedComp,
                startDate: typeof payload.startDate === 'string' ? payload.startDate : '',
                endDate: typeof payload.endDate === 'string' ? payload.endDate : '',
                durationMonths: Number(payload.durationMonths) || 0,
                location: String(payload.location || '').trim(),
                optedIn: typeof payload.optedIn === 'boolean' ? payload.optedIn : payload.optedIn !== false && payload.optedIn !== 'false',
                registered: Boolean(payload.registered),
                deadlineDate: typeof payload.deadlineDate === 'string' ? payload.deadlineDate : '',
                deadlineTime: typeof payload.deadlineTime === 'string' ? payload.deadlineTime : '',
                reason: String(payload.reason || '').trim(),
                skills: Array.isArray(payload.skills) ? payload.skills.map(String) : [],
                notes: typeof payload.notes === 'string' ? payload.notes : '',
                aboutCompany: typeof payload.aboutCompany === 'string' ? payload.aboutCompany : '',
                jobDescription: typeof payload.jobDescription === 'string' ? payload.jobDescription : '',
                registrationLink: typeof payload.registrationLink === 'string' ? payload.registrationLink : '',
                miscellaneousNotes: typeof payload.miscellaneousNotes === 'string' ? payload.miscellaneousNotes : '',
                history: rawHistory,
                schedule: [],
              };
              updated.push(fresh);
            }
            return updated;
          });
        }
      } else if (entity === 'leetcode') {
        if (operation === 'create' || operation === 'update') {
          setDsaProblems((prev) => {
            const updated = [...(prev || [])];
            const existingIdx = operation === 'update'
              ? updated.findIndex(
                  (p: any) =>
                    p.id === payload.id ||
                    (p.problemName?.toLowerCase() === payload.problemName?.toLowerCase() && !payload.id) ||
                    (p.link === payload.link && !payload.id)
                )
              : -1;
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
            const existingIdx = operation === 'update'
              ? updated.findIndex(
                  (p: any) => p.id === payload.id || (p.name?.toLowerCase() === payload.name?.toLowerCase() && !payload.id)
                )
              : -1;
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
            const existingIdx = operation === 'update'
              ? updated.findIndex(
                  (c: any) => c.id === payload.id || (c.name?.toLowerCase() === payload.name?.toLowerCase() && !payload.id)
                )
              : -1;
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
            const existingIdx = operation === 'update'
              ? updated.findIndex(
                  (q: any) => q.id === payload.id || (q.question?.toLowerCase() === payload.question?.toLowerCase() && !payload.id)
                )
              : -1;
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

  const handleActionResponseState = (
    messageId: string,
    status: 'approved' | 'cancelled',
    forcedOperation?: 'create' | 'update',
    targetId?: any,
    actionIndex?: number
  ) => {
    // Commit approval state locally to message metadata and sync
    setChats((prev) =>
      (prev || []).map((c) => {
        if (c.id === activeChatId) {
          const nextMsgs = c.messages.map((m) => {
            if (m.id === messageId) {
              const payload = m.payload;
              if (status === 'approved' && payload) {
                const actionObj = Array.isArray(payload) ? payload[actionIndex!] : payload;
                if (actionObj) {
                  const finalAction = {
                    ...actionObj,
                    operation: forcedOperation || actionObj.operation,
                    payload: {
                      ...actionObj.payload,
                      id: targetId !== undefined ? targetId : actionObj.payload?.id,
                    }
                  };
                  executeOrchestratedAction(finalAction);
                }
              }
              
              const nextMetadata = { ...m.metadata };
              if (actionIndex !== undefined && Array.isArray(payload)) {
                const nextStatuses = [...(nextMetadata.confirmationStatuses || [])];
                // Make sure array is padded up to actionIndex
                while (nextStatuses.length <= actionIndex) {
                  nextStatuses.push('pending');
                }
                nextStatuses[actionIndex] = status;
                nextMetadata.confirmationStatuses = nextStatuses;
              } else {
                nextMetadata.confirmationStatus = status;
              }

              return {
                ...m,
                metadata: nextMetadata,
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
    if (isLoading || (!chatInput.trim() && attachments.length === 0)) return;

    const currentContext = getPageContextKey();
    const currentAttachments = [...attachments];

    let fullPromptText = chatInput.trim();
    if (currentAttachments.length > 0) {
      const attText = currentAttachments
        .map((att, idx) => `--- ATTACHED DOCUMENT ${idx + 1}: ${att.title} ---\n${att.content}`)
        .join('\n\n');
      fullPromptText = fullPromptText ? `${fullPromptText}\n\n${attText}` : attText;
    }

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim() || (currentAttachments.length > 0 ? 'Pasted attachment for review' : ''),
      timestamp: new Date().toISOString(),
      metadata: {
        pageContext: currentContext,
        attachments: currentAttachments,
      },
    };

    let currentChatId = activeChatId;
    let isNewChat = false;

    if (!currentChatId) {
      const chatTitleHint = chatInput.trim() || currentAttachments[0]?.title || 'New Chat';
      const newChat = createNewChat(chatTitleHint);
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

    const promptToSend = fullPromptText;
    setChatInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const filteredHistory = messages.filter(
        (m) => !m.metadata?.pageContext || m.metadata.pageContext === currentContext
      );

      // Extract current table data context for the AI Orchestrator
      let contextData: any = null;
      if (currentContext === 'placement') {
        contextData = (placementCompanies || []).map((c, idx) => ({
          serialNumber: idx + 1,
          id: c.id,
          name: c.name,
          role: c.role,
          year: c.year,
          kind: c.kind,
          compensation: c.compensation,
          location: c.location,
          optedIn: c.optedIn,
          registered: c.registered,
          status: c.history?.[c.history.length - 1]?.status || 'Preparing',
          stage: c.history?.[c.history.length - 1]?.stage || 'Resume/CGPA',
          skills: c.skills || [],
          aboutCompany: c.aboutCompany || '',
          jobDescription: c.jobDescription || '',
        }));
      } else if (currentContext === 'dsa') {
        contextData = (dsaProblems || []).map((p, idx) => ({
          serialNumber: idx + 1,
          id: p.id,
          problemName: p.problemName,
          difficulty: p.difficulty,
          status: p.status,
          pattern: p.pattern,
        }));
      } else if (currentContext === 'projects') {
        contextData = (projects || []).map((p, idx) => ({
          serialNumber: idx + 1,
          id: p.id,
          name: p.name,
          status: p.status,
          techStack: p.techStack || [],
        }));
      }

      const response = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          pageContext: currentContext,
          history: filteredHistory,
          generateTitle: isNewChat,
          contextData,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const conversationalText = data.response || 'I have completed the task.';
      let rawActionObj = data.action || null;

      const normalizeSingleAction = (act: any) => {
        if (!act || typeof act !== 'object') return null;
        const reqConfRaw = act.requiresConfirmation;
        const requiresConfirmation = typeof reqConfRaw === 'boolean'
          ? reqConfRaw
          : typeof reqConfRaw === 'string'
          ? reqConfRaw.toLowerCase() === 'true'
          : true;
        return {
          ...act,
          requiresConfirmation,
        };
      };

      let actionObj = Array.isArray(rawActionObj)
        ? rawActionObj.map(normalizeSingleAction).filter(Boolean)
        : normalizeSingleAction(rawActionObj);

      // Fallback action recovery if the model omitted action JSON due to conversational memory
      if (!actionObj && (promptToSend.toLowerCase().includes('add') || promptToSend.toLowerCase().includes('infosys') || promptToSend.toLowerCase().includes('pixel') || promptToSend.toLowerCase().includes('zomato') || promptToSend.toLowerCase().includes('eternal') || promptToSend.toLowerCase().includes('ion') || promptToSend.toLowerCase().includes('juspay') || promptToSend.toLowerCase().includes('ubs') || promptToSend.toLowerCase().includes('workindia') || promptToSend.toLowerCase().includes('fischer') || promptToSend.toLowerCase().includes('sabre') || conversationalText.toLowerCase().includes('infosys') || conversationalText.toLowerCase().includes('pixel') || conversationalText.toLowerCase().includes('zomato') || conversationalText.toLowerCase().includes('eternal') || conversationalText.toLowerCase().includes('ion') || conversationalText.toLowerCase().includes('juspay') || conversationalText.toLowerCase().includes('ubs') || conversationalText.toLowerCase().includes('workindia') || conversationalText.toLowerCase().includes('fischer') || conversationalText.toLowerCase().includes('sabre'))) {
        const textToSearch = `${promptToSend} ${conversationalText}`;
        const isInfosys = /infosys/i.test(textToSearch);
        const isPixel = /pixel/i.test(textToSearch);
        const isEternal = /eternal|zomato/i.test(textToSearch);
        const isIon = /ion/i.test(textToSearch);
        const isJuspay = /juspay/i.test(textToSearch);
        const isUbs = /ubs/i.test(textToSearch);
        const isWorkIndia = /work\s*india/i.test(textToSearch);
        const isFischerJordan = /fischer/i.test(textToSearch);
        const isSabre = /sabre/i.test(textToSearch);

        if (isSabre) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'Sabre',
              subtitle: 'Software Development Engineer · 18 LPA (Super Dream Offer)',
              details: {
                "Company": 'Sabre',
                "Role": 'Software Development Engineer (SDE)',
                "Package": '18 LPA (Stipend ₹50,000 / month)',
                "Eligibility": 'B.Tech CSE / IT / ECE (70% X/XII, 7.5 CGPA B.Tech)',
                "Deadline": '2026-07-22, 5:00 PM',
                "Location": 'Bangalore (Work from Office)',
              }
            },
            payload: {
              name: 'Sabre',
              role: 'Software Development Engineer',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 18, unit: 'LPA' },
              stipendAmount: 50000,
              baseSalary: 15,
              joiningBonus: 100000,
              ctcDetails: 'CTC: ₹18.0 LPA (Fixed: ₹15 LPA + ₹1L Joining Bonus + Performance Bonus). Internship Stipend: ₹50,000 / month.',
              durationMonths: 6,
              location: 'Bangalore',
              optedIn: true,
              deadlineDate: '2026-07-22',
              deadlineTime: '17:00',
              skills: ['Java', 'C++', 'Data Structures', 'Algorithms', 'Distributed Systems', 'Spring Boot', 'Cloud Computing', 'SQL'],
              aboutCompany: 'Sabre Corporation is a leading global travel technology SaaS company headquartered in Southlake, Texas, powering airline booking, operations, and global distribution platforms.',
              jobDescription: '• Role: Software Development Engineer (SDE) / Technology Analyst\n• Category: Super Dream Internship / Placement\n• Compensation: Total CTC ₹18 LPA | Internship Stipend: ₹50,000 / month\n• Eligibility: 2027 Batch B.Tech CSE / IT / ECE related branches. Minimum 70% in 10th & 12th, 7.5 CGPA in B.Tech with no active backlogs.\n• Work Location: Sabre India Development Center, Bangalore\n• Hiring Process: Online Coding Assessment (DSA & CS Fundamentals) -> Technical Interviews -> HR & Cultural Assessment.',
              registrationLink: 'https://www.sabre.com/careers',
              notes: '- Super Dream Offer (₹18 LPA CTC, ₹50,000/mo stipend)\n- Work Location: Sabre Development Center, Bangalore\n- Registration Deadline: 22nd July 2026 (5:00 PM)',
              miscellaneousNotes: 'Global travel technology SaaS pioneer (Southlake, Texas & Bangalore).',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-21', time: '17:00', notes: 'Registration open on campus portal until 22-07-2026 5:00 PM' },
                { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-28', time: '', notes: 'Online Coding Assessment (DSA & CS Fundamentals)' }
              ]
            }
          };
        } else if (isFischerJordan) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'Fischer Jordan',
              subtitle: 'Data Analyst / Software Engineer · 31 LPA (Super Dream Offer)',
              details: {
                "Company": 'Fischer Jordan',
                "Roles": 'Data Analyst / Software Engineer (SWE)',
                "Package": '31 LPA (Stipend ₹50,000 / month)',
                "Eligibility": 'B.Tech CSE/IT (75% X/XII, 60% B.Tech, No Standing Arrears)',
                "Work Mode": 'Remote (US Hours, 55-60 hrs/wk)',
                "Contract": '3-Year Service Agreement (+20%/yr base increase)',
                "Deadline": '2026-07-21, 3:00 PM',
              }
            },
            payload: {
              name: 'Fischer Jordan',
              role: 'Data Analyst / Software Engineer',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 31, unit: 'LPA' },
              stipendAmount: 50000,
              baseSalary: 18,
              joiningBonus: 100000,
              ctcDetails: 'Total CTC: ₹30.7 - 32.8 LPA (SWE: ₹32.8 LPA, DA: ₹30.7 LPA). Base: ₹16-18 LPA + Bonuses + Revenue Share. Stipend: ₹50,000/month.',
              durationMonths: 6,
              location: 'Remote (US Hours)',
              optedIn: true,
              deadlineDate: '2026-07-21',
              deadlineTime: '15:00',
              skills: ['Python', 'SQL', 'ReactJS', 'Next.js', 'Django', 'Node.js', 'AWS', 'Docker', 'DevOps', 'Generative AI', 'LLMs', 'RAG'],
              aboutCompany: 'Fischer Jordan is a New York-headquartered analytics, tech, and management consulting firm working closely with US-based enterprise clients, central banks, and financial institutions.',
              jobDescription: '• Roles Offered: Data Analyst & Software Engineer (SWE - Frontend & Backend)\n• Category: Super Dream Internship / Placement\n• Total CTC: ₹30.7 - 32.8 LPA (SWE: ₹32.8 LPA, DA: ₹30.7 LPA). Internship Stipend: ₹50,000 / month.\n• Work Mode: Remote (working US timezones, 55-60 hours/week).\n• Contract: 3-Year Service Agreement (+20% base increase per year in Y2 & Y3, Signing bonus ₹1L, Retention bonus ₹1L, US visit option for 2 weeks after Y2).\n• Eligibility: 2027 Batch B.Tech CSE / IT related branches. Minimum 75% in 10th & 12th, 60% / 6.0 CGPA in B.Tech, with no standing arrears.\n• Hiring Process: CV Screening with Video Resume + 3 rounds of Personal Interview (Google Meet).\n• Registration: NEO PAT portal on or before 21st July 2026 (03:00 PM).',
              registrationLink: 'https://fischerjordan.com/',
              notes: '- Super Dream Offer (₹30 - 31 LPA CTC, ₹50,000/mo stipend)\n- 3-Year Contract Service Agreement (Early termination fee applies)\n- Work Mode: Remote (US Hours, 55-60 hours/week)\n- Roles: Data Analyst & Software Engineer (SWE)\n- Hiring Process: Video Resume CV Screening -> 3 Personal Interview Rounds (Google Meet)\n- Bonus & Benefits: ₹1L Signing Bonus, ₹1L Retention Bonus at Year 3, 2-week US Visit option after Year 2\n- Registration Deadline: 21st July 2026 (3:00 PM) on NEO PAT',
              miscellaneousNotes: '- Base salary increases by +20% in Year 2 and +20% in Year 3.\n- Video Resume required along with CV.',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-20', time: '15:00', notes: 'Last date for registration on NEO PAT: 21st July 2026 (3:00 PM)' },
                { stage: 'Resume/CGPA', status: 'Preparing', date: '', time: '', notes: 'CV Screening with Video Resume' },
                { stage: 'Technical Interview', status: 'Preparing', date: '', time: '', notes: '3 rounds of Personal Interview via Google Meet' }
              ]
            }
          };
        } else if (isWorkIndia) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'WorkIndia',
              subtitle: 'Software Development Engineer (SDE) · 16 LPA (Super Dream Offer)',
              details: {
                "Company": 'WorkIndia',
                "Role": 'Software Development Engineer (SDE)',
                "Package": '16 LPA (Stipend ₹40,000 / month for 6 mos)',
                "Eligibility": 'B.Tech CS & IT Branches (60% X/XII, 80% B.Tech, No Standing Arrears)',
                "Deadline": '2026-07-21, 2:00 PM',
                "Location": 'HSR Layout, Bangalore (Onsite)',
                "Visit Date": '31st July 2026',
              }
            },
            payload: {
              name: 'WorkIndia',
              role: 'Software Development Engineer',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 16, unit: 'LPA' },
              stipendAmount: 40000,
              baseSalary: 16,
              joiningBonus: 0,
              ctcDetails: 'CTC: ₹16 LPA (if converted). Internship Stipend: ₹40,000 / month for 6 months.',
              durationMonths: 6,
              location: 'HSR Layout, Bangalore',
              optedIn: true,
              deadlineDate: '2026-07-21',
              deadlineTime: '14:00',
              skills: ['Python', 'JavaScript', 'Go', 'ReactJS', 'PostgreSQL', 'MySQL', 'MongoDB', 'Elasticsearch', 'Kubernetes'],
              aboutCompany: 'WorkIndia (Eloquent Info Solutions Pvt Ltd) is India’s largest tech-driven marketplace for blue-collar hiring, connecting 2.8+ crore job seekers and 1.7 million employers.',
              jobDescription: '• Role: Software Development Engineer (SDE)\n• Category: Super Dream Internship / Placement\n• CTC: ₹16 LPA (if converted). Internship Stipend: ₹40,000 / month for 6 months.\n• Eligibility: 2027 Batch B.Tech CS & IT related branches. Minimum 60% in 10th & 12th, 80% / 8.0 CGPA in B.Tech, with no standing arrears.\n• Date of Visit: 31st July 2026\n• Location: Onsite at HSR Layout, Bangalore (No. 437, HustleHub, 3rd Floor, 17th Cross, Sector 4, HSR Layout, Bengaluru)\n• Key Tech Skills: Python, Javascript, Go, Reactjs, PostgreSQL, MySQL, MongoDB, Elasticsearch, Kubernetes\n• Registration: NEOPAT portal on or before 21st July 2026 (2:00 PM).',
              registrationLink: 'http://www.workindia.in',
              notes: '- Super Dream Offer (₹16 LPA CTC if converted, ₹40,000/mo stipend for 6 months)\n- Date of Visit: 31st July 2026\n- End-to-end product ownership, metrics driving, and tech innovation\n- Location: Onsite in Bangalore (HSR Layout)\n- Registration Deadline: 21st July 2026 (2:00 PM) on NEOPAT portal',
              miscellaneousNotes: '- Corporate Office: No. 437, HustleHub, 3rd Floor, 17th Cross, Sector 4, HSR Layout, Bengaluru\n- Email: people@workindia.in\n- Minimum 80% in B.Tech, 60% in 10th & 12th, No Standing Arrears',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-21', time: '14:00', notes: 'Last date for registration on NEOPAT portal: 21st July 2026 2:00 pm' },
                { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-31', time: '', notes: 'Date of Visit: 31st July 2026' }
              ]
            }
          };
        } else if (isUbs) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'UBS (2027 Batch)',
              subtitle: 'Technology Intern / Full-Time Graduate · 13 LPA (Super Dream Internship/Placement)',
              details: {
                "Company": 'UBS (2027 Batch)',
                "Role": 'Technology Intern / Full-Time Graduate',
                "Package": '13 LPA (Stipend ₹60,000 / month)',
                "Eligibility": 'B.Tech CS & IT Branches (70% / 7.0 CGPA, No Standing Arrears)',
                "Deadline": '2026-07-21, 2:00 PM',
                "Locations": 'Pune / Hyderabad',
                "Campus Visit": '17-08-2026 Virtual PPT | 19-08-2026 Interviews (Vellore Campus)',
              }
            },
            payload: {
              name: 'UBS (2027 Batch)',
              role: 'Technology Intern / Full-Time Graduate',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 13, unit: 'LPA' },
              stipendAmount: 60000,
              baseSalary: 13,
              joiningBonus: 0,
              ctcDetails: 'CTC: ₹13 LPA (if converted). Internship Stipend: ₹60,000 / month.',
              durationMonths: 6,
              location: 'Pune / Hyderabad',
              optedIn: true,
              deadlineDate: '2026-07-21',
              deadlineTime: '14:00',
              skills: ['Computer Science', 'Information Technology', 'Cognitive Aptitude', 'AON Assessment', 'Financial Technology'],
              aboutCompany: 'UBS is a leading global financial services firm headquartered in Switzerland, offering wealth management, asset management, and investment banking services across 50+ countries.',
              jobDescription: '• Role: Technology Intern / Full-Time Graduate (Super Dream Internship / Placement for 2027 Batch)\n• Category: Super Dream Internship / Placement\n• CTC: ₹13 LPA (if converted). Internship Stipend: ₹60,000 / month.\n• Eligibility: B.Tech CS & IT related branches only. Minimum 70% / 7.0 CGPA in 10th, 12th & B.Tech, with no standing arrears.\n• Location: Pune / Hyderabad\n• Assessment Requirements: Mandatory Culture Aptitude Test and Cognitive Ability Test (AON) prior to 13th August 2026.\n• Resume Guidelines: All CVs must include a photograph and clearly state year of passing (2025–2027).\n• Key Dates:\n  - 17-08-2026: Virtual PPT\n  - 19-08-2026: Physical Interviews at Vellore Campus\n• Registration: Both Neo PAT portal and company link on or before 21-07-2026 (2:00 PM).',
              registrationLink: 'https://ubs.com/careers',
              notes: '- Super Dream Offer (₹13 LPA CTC, ₹60,000/mo stipend)\n- Separate 2027 Batch Entry\n- Mandatory Assessment: AON Culture Aptitude & Cognitive Ability Test prior to 13th August 2026\n- Resume Requirement: Must include photograph and passing year (2025–2027)\n- 17-08-2026: Virtual PPT | 19-08-2026: Physical Interviews at Vellore Campus\n- Locations: Pune / Hyderabad\n- Registration Deadline: 21st July 2026 (2:00 PM) on Neo PAT and UBS company link',
              miscellaneousNotes: '- Must register in BOTH Neo PAT and UBS company link.\n- False passing year info will lead to rejection.',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-20', time: '14:00', notes: 'Last date for registration on Neo PAT and UBS company link: 21-07-2026 (2.00 pm)' },
                { stage: 'Online Coding Round', status: 'Preparing', date: '2026-08-13', time: '', notes: 'Mandatory AON Culture Aptitude & Cognitive Ability Test prior to 13th August 2026' },
                { stage: 'Technical Interview', status: 'Preparing', date: '2026-08-19', time: '', notes: 'Physical Interviews at Vellore Campus (PPT Virtual on 17-08-2026)' }
              ]
            }
          };
        } else if (isJuspay) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'Juspay',
              subtitle: 'Software Development Engineer (SDE) · 27 LPA (Super Dream Internship/PPO)',
              details: {
                "Company": 'Juspay',
                "Role": 'Software Development Engineer (SDE)',
                "Package": '27 LPA (Stipend ₹40,000 / month)',
                "Eligibility": 'B.Tech CSE & M.Tech CSE (60% / 6.0 CGPA, No Standing Arrears)',
                "Deadline": '2026-07-17, 12:00 PM',
                "On-Campus Visit": '29th July 2026 (Vellore Campus)',
              }
            },
            payload: {
              name: 'Juspay',
              role: 'Software Development Engineer',
              year: 'fourth',
              kind: 'internship_ppo',
              compensation: { amount: 27, unit: 'LPA' },
              stipendAmount: 40000,
              baseSalary: 27,
              joiningBonus: 0,
              ctcDetails: 'CTC: ₹27.0 LPA. Internship Stipend: ₹40,000 / month (1-year internship starting August).',
              startDate: '2026-08-01',
              durationMonths: 12,
              location: 'Bangalore',
              optedIn: true,
              deadlineDate: '2026-07-17',
              deadlineTime: '12:00',
              skills: ['Data Structures', 'Algorithms', 'Computer Science Fundamentals', 'Problem Solving', 'System Architecture', 'Coding'],
              aboutCompany: 'Juspay is a leading multinational payments technology company processing over 300 million daily transactions exceeding $1 trillion TPV with 99.999% reliability. Headquartered in Bangalore, with 1,500+ experts across global offices.',
              jobDescription: '• Role: Software Development Engineer (SDE)\n• Category: Super Dream Internship / PPO (1-year internship starting August for students with no pending credits)\n• CTC: ₹27 LPA (Stipend: ₹40,000 / month)\n• Eligibility: 2027 Batch B.Tech CSE (no pending credits, available from August) & M.Tech CSE. Minimum 60% / 6.0 CGPA in 10th, 12th & B.Tech, with no standing arrears.\n• Hiring Process:\n  1. Written & Online Assessment (On-Campus on 29-07-2026): Pre-Assessment Coding + Pen & Paper MCQ + Hackathon Part A\n  2. Eliminatory Technical Interview (Online): DSA & CS Fundamentals\n  3. Hackathon (1-Day Event): Hands-on coding challenge\n  4. Final Interview: Technical & Cultural Fit at Juspay Bangalore Office (1st week of August)\n• Registration: Neo PAT portal on or before 17-07-2026 12:00 noon.',
              registrationLink: 'http://Inflection.io',
              notes: '- Super Dream Internship / PPO (₹27 LPA CTC, ₹40,000/month stipend)\n- 1-year internship starting August 2026 (Students MUST have no pending credits and be available from August)\n- Eligible: B.Tech CSE & M.Tech CSE (60% / 6.0 CGPA, No Standing Arrears)\n- Physical PPT & Rounds at Vellore Campus on 29th July 2026\n- Final Interviews at Juspay Office Bangalore in 1st week of August\n- Deadline: 17th July 2026 (12:00 PM noon)',
              miscellaneousNotes: '- Hiring Process: Pre-Assessment Coding + Pen & Paper MCQ + Hackathon Part A -> Online Tech Interview -> 1-Day Hackathon -> Final Interview.\n- Headquartered in Bangalore (Inflection.io / Juspay).',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-16', time: '12:00', notes: 'Last date for registration on Neo PAT portal: 17-07-2026 12 noon' },
                { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-29', time: '', notes: 'Physical process at Vellore campus: PPT + Pre-Assessment Coding + MCQ + Hackathon Part A' },
                { stage: 'Technical Interview', status: 'Preparing', date: '2026-08-01', time: '', notes: 'Interviews 1st week of August at Juspay Office Bangalore' }
              ]
            }
          };
        } else if (isIon) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'ION Group',
              subtitle: 'Software Developer / Technical Product Analyst · 17.3 LPA (Super Dream Offer)',
              details: {
                "Company": 'ION Group',
                "Roles": 'Software Developer / Technical Product Analyst',
                "Package": '17.3 LPA (₹15 LPA Fixed)',
                "Eligibility": 'B.Tech CSE, IT, ECE (80% / 8.0 CGPA, No Standing Arrears)',
                "Deadline": '2026-07-15, 7:00 PM',
                "Location": 'Noida',
              }
            },
            payload: {
              name: 'ION Group',
              role: 'Software Developer / Technical Product Analyst',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 17.3, unit: 'LPA' },
              stipendAmount: 0,
              baseSalary: 15,
              joiningBonus: 0,
              ctcDetails: 'CTC: ₹17.3 LPA (₹15 LPA Fixed). Super Dream Offer.',
              durationMonths: 6,
              location: 'Noida',
              optedIn: true,
              deadlineDate: '2026-07-15',
              deadlineTime: '19:00',
              skills: ['Data Analytics', 'AI & Automation', 'Product Analysis', 'Data Engineering', 'React', 'Python', 'SQL', 'Problem Solving'],
              aboutCompany: 'ION Group (founded 1999) is a global financial technology company providing trading and workflow automation software, analytics, and strategic consulting to Tier 1 banks, central banks, and Fortune 100 corporations.',
              jobDescription: '• Roles Offered: Software Developer & Technical Product Analyst (apply for any one role)\n• Category: Super Dream Offer (Internship + Full Time)\n• CTC: ₹17.3 LPA (₹15 LPA Fixed)\n• Eligibility: 2027 Batch B.Tech CSE (all branches), B.Tech IT, B.Tech ECE (all branches). Minimum 80% / 8.0 CGPA in 10th, 12th & B.Tech, with no standing arrears.\n• Hiring Process:\n  - Round 1 & 2: Online Assessment & Online Rounds\n  - Final Rounds (ION Day): On-site at ION’s Noida Office\n• Registration: Neo PAT portal & ION application link on or before 15-07-2026 7:00 PM. Registered college email ID must be used.',
              registrationLink: 'http://www.iongroup.com',
              notes: '- Super Dream Offer (₹17.3 LPA CTC, ₹15 LPA Fixed)\n- Two Role Tracks: Software Developer & Technical Product Analyst\n- Eligible: B.Tech CSE, IT, ECE (80% / 8.0 CGPA, No Standing Arrears)\n- Hiring Process: Online Assessment -> Online Rounds -> Final ION Day at Noida Office\n- Deadline: 15th July 2026 (7:00 PM)',
              miscellaneousNotes: '- Final rounds conducted in-person at ION Noida Office (ION Day).\n- Must use registered college email ID for ION application link.',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-14', time: '19:00', notes: 'Last date for registration on Neo PAT & ION link: 15-07-2026 7:00 PM' },
                { stage: 'Online Coding Round', status: 'Preparing', date: '', time: '', notes: 'Round 1 & 2 conducted online' },
                { stage: 'Technical Interview', status: 'Preparing', date: '', time: '', notes: 'Final Rounds (ION Day) at ION Noida Office' }
              ]
            }
          };
        } else if (isEternal) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'Eternal (Zomato)',
              subtitle: 'Software Development Engineer (SDE) · 59 LPA (Super Dream Offer)',
              details: {
                "Company": 'Eternal (Zomato)',
                "Role": 'Software Development Engineer (SDE)',
                "Package": '59 LPA (₹24L Fixed + ₹35L Bonus over 4 yrs: Yr 1 ₹5L, Yr 2 ₹10L, Yr 3 ₹10L, Yr 4 ₹10L)',
                "Stipend": '₹1,00,000 / month',
                "Location": 'Gurugram',
                "Eligibility": 'All B.Tech Branches (70% / 7.0 CGPA, No Standing Arrears)',
                "Deadline": '2026-07-20, 8:00 AM',
                "Online Assessment": '27th July 2026',
              }
            },
            payload: {
              name: 'Eternal (Zomato)',
              role: 'Software Development Engineer',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 59, unit: 'LPA' },
              stipendAmount: 100000,
              baseSalary: 24,
              joiningBonus: 500000,
              ctcDetails: '₹59 LPA CTC (₹24L Fixed + ₹35L Bonus over 4 years: 1st yr ₹5L, 2nd yr ₹10L, 3rd yr ₹10L, 4th yr ₹10L). Internship Stipend: ₹1L / month.',
              location: 'Gurugram',
              optedIn: true,
              deadlineDate: '2026-07-20',
              deadlineTime: '08:00',
              skills: ['Data Structures', 'Algorithms', 'Software Development', 'System Design', 'Problem Solving'],
              aboutCompany: 'Eternal (Zomato) is a technology corporation comprising Zomato, Blinkit, District, and Hyperpure.',
              jobDescription: '• Role: Software Development Engineer (SDE)\n• Super Dream Placement / Internship for 2027 Batch (All B.Tech branches eligible)\n• Date of Visit / Assessment: 27-07-2026 (Online mode)\n• CTC: ₹59 LPA (₹24L Fixed + ₹35L Bonus over 4 years: 1st yr ₹5L, 2nd yr ₹10L, 3rd yr ₹10L, 4th yr ₹10L)\n• Internship Stipend: ₹1,00,000 per month (₹1L/month)\n• Eligibility: 70% / 7.0 CGPA in 10th, 12th & B.Tech, with no standing arrears. Open to all B.Tech branches.\n• Registration: NEOPAT portal on or before 20-07-2026 (8:00 AM)',
              registrationLink: 'http://www.eternal.com',
              notes: '- Super Dream Offer (₹59 LPA total CTC)\n- Fixed Salary: ₹24 LPA, Bonus: ₹35 LPA over 4 years (Year 1: ₹5L, Year 2: ₹10L, Year 3: ₹10L, Year 4: ₹10L)\n- Internship Stipend: ₹1L per month\n- Online Assessment Date: 27th July 2026\n- Registration on NEOPAT portal by 20th July 2026 (8:00 AM)',
              miscellaneousNotes: '- Eligible: All B.Tech branches with minimum 70% / 7.0 CGPA and no standing arrears.\n- Job Location: Gurugram',
              history: [
                { stage: 'Registration', status: 'Preparing', date: '2026-07-17', time: '08:00', notes: 'Last date for registration on NEOPAT portal: 20-07-2026 (8.00 am)' },
                { stage: 'Online Coding Round', status: 'Preparing', date: '2026-07-27', time: '', notes: 'Date of Visit: 27-07-2026 (Online mode)' }
              ]
            }
          };
        } else if (isPixel) {
          actionObj = {
            entity: 'placement',
            operation: 'create',
            requiresConfirmation: false,
            preview: {
              title: 'Pixel Compute Technologies Pvt Ltd',
              subtitle: 'Full-Stack Developer · 20 LPA (Super Dream Offer)',
              details: {
                "Company": 'Pixel Compute Technologies Pvt Ltd',
                "Role": 'Full-Stack Developer (6-month Internship + Full-Time)',
                "Package": '20 LPA (Fixed 10 LPA + 10L Retention Bonus over 3 yrs)',
                "Stipend": '₹42,000 / month',
                "Location": 'Bhubaneswar, Odisha (On-site)',
                "Eligibility": '2027 Batch, B.Tech CSE/IT/CS/CE, 80% / 8.0 CGPA',
                "Deadline": '2026-07-17, 9:00 AM',
              }
            },
            payload: {
              name: 'Pixel Compute Technologies Pvt Ltd',
              role: 'Full-Stack Developer',
              year: 'fourth',
              kind: 'internship_placement',
              compensation: { amount: 20, unit: 'LPA' },
              stipendAmount: 42000,
              baseSalary: 10,
              joiningBonus: 0,
              ctcDetails: 'Fixed CTC: ₹10 LPA + Retention Bonus: ₹10 Lakh over 3 years (Yr 1: ₹2L, Yr 2: ₹3L, Yr 3: ₹5L). Internship Stipend: ₹42,000/month.',
              durationMonths: 6,
              location: 'Infocity, Patia, Bhubaneswar, Odisha',
              optedIn: true,
              deadlineDate: '2026-07-17',
              deadlineTime: '09:00',
              skills: ['HTML', 'CSS', 'JavaScript', 'ReactJS', 'Ruby', 'Ruby on Rails', 'Full-Stack Development'],
              aboutCompany: 'PixelCompute is a technology company focused on building high-quality, real-world software products, backed by BigBinary (Miami & Pune consultancy with 14+ years Rails experience).',
              jobDescription: '• Role: Full-Stack Developer (6-month full-time internship + conversion to full-time role)\n• Location: SRB Tower, 2nd Floor, Infocity, Patia, Bhubaneswar, Odisha (Work from office)\n• Internship Stipend: ₹42,000 per month during 6-month training\n• Full-Time CTC: Fixed ₹10 LPA + ₹10 Lakh Retention Bonus over 3 years (Yr 1: ₹2L, Yr 2: ₹3L, Yr 3: ₹5L) Total CTC: ₹20 LPA\n• Eligibility: 2027 Batch B.Tech CSE/IT/CS/CE with 80% or 8.0 CGPA in 10th, 12th & B.Tech, with no active backlogs\n• Technical Requirements: HTML, CSS, JavaScript, ReactJS, and willingness to learn Ruby and Ruby on Rails\n• Service Bond: No service bond',
              registrationLink: 'http://www.pixelcompute.com',
              notes: '- Super Dream Offer (₹20 LPA total CTC)\n- 6-month internship at ₹42,000/month stipend leading to Full-Time Full-Stack Developer\n- Fixed Salary: ₹10 LPA, Retention Bonus: ₹10 Lakh over 3 years (Yr 1: ₹2L, Yr 2: ₹3L, Yr 3: ₹5L)\n- Work Mode: On-site at Bhubaneswar office (No hybrid/remote)\n- No service bond',
              miscellaneousNotes: '- Backed by BigBinary (Miami & Pune)\n- Registration Deadline: 17th July 2026 (9:00 AM)\n- Minimum 80% / 8.0 CGPA in 10th, 12th, and B.Tech',
              history: [
                { stage: 'Registration', status: 'Done', date: '2026-07-16', time: '09:00', notes: 'Last date for registration: 17th July 2026 (9:00 AM)' },
                { stage: 'Pre-Placement Talk', status: 'Scheduled', date: '2026-07-22', time: '08:30 AM', notes: 'Pre-Placement Talk (PPT) | Duration: 60 mins | Venue: MG Auditorium' },
                { stage: 'Online Coding Round', status: 'Scheduled', date: '2026-07-22', time: '10:00 AM', notes: 'Online Assessment | Duration: 120 mins | Venue: AB2-602' }
              ],
              schedule: [
                { id: 'pixel-ppt', title: 'Pixel Compute PPT', date: '2026-07-22', time: '08:30 AM', location: 'MG Auditorium' },
                { id: 'pixel-test', title: 'Pixel Compute Online Assessment', date: '2026-07-22', time: '10:00 AM', location: 'AB2-602' }
              ]
            }
          };
        } else {
          const nameMatch = isInfosys
            ? ['Infosys', 'Infosys']
            : textToSearch.match(/(?:add|create|generate|added)\s+([A-Z][a-zA-Z0-9\s]{2,30})/i);

          if (nameMatch && nameMatch[1]) {
            const compName = nameMatch[1].trim();
            if (compName && compName.toLowerCase() !== 'it' && compName.toLowerCase() !== 'the card') {
              actionObj = {
                entity: 'placement',
                operation: 'create',
                requiresConfirmation: false,
                preview: {
                  title: compName,
                  subtitle: isInfosys ? 'Specialist Programmer / Digital Specialist Engineer · 21 LPA' : `${compName} Opportunity`,
                  details: {
                    "Company": compName,
                    "Package": isInfosys ? '21 LPA / 16 LPA / 10 LPA' : 'TBD',
                    "Eligibility": isInfosys ? 'July 2027 Graduation Batch' : 'Eligible',
                    "Hiring Process": isInfosys ? '3-Hour Programming Assessment' : 'Standard Process',
                  }
                },
                payload: {
                  name: compName,
                  role: isInfosys ? 'Specialist Programmer / Digital Specialist Engineer' : 'Software Engineer',
                  year: 'fourth',
                  kind: 'placement',
                  compensation: { amount: isInfosys ? 21 : 0, unit: 'LPA' },
                  optedIn: true,
                  skills: isInfosys ? ['Programming', 'Data Structures', 'Algorithms'] : [],
                  jobDescription: isInfosys
                    ? 'Specialist Programmer (Trainee) and Digital Specialist Engineer (Trainee) roles. 3-hour programming assessment format for July 2027 graduation batch.'
                    : 'Extracted company details.',
                  notes: isInfosys ? 'Critical guidelines about official email requirements and July 2nd nomination deadline.\n• MANDATORY: Must bring original Govt ID proof (Aadhaar, PAN card, etc.) & College ID without fail. No xerox or digital proof allowed.' : '',
                  miscellaneousNotes: isInfosys ? 'Salary bands: INR 21 LPA, 16 LPA, and 10 LPA.\nVerification Rule: Original Govt ID & College ID required. Xerox or digital proof strictly forbidden.' : '',
                  history: isInfosys ? [
                    { stage: 'Resume/CGPA', status: 'Done', date: '2026-07-10', time: '', notes: '' },
                    { stage: 'Online Coding Round', status: 'Scheduled', date: '2026-07-23', time: 'Slot 2', notes: 'Infosys Online Test | Slot 2 | Location: AB2 502. MANDATORY: Original Govt ID proof (Aadhaar, PAN card, etc.) & College ID without fail. No xerox or digital proof.' }
                  ] : [],
                  schedule: isInfosys ? [
                    { id: 'infosys-test', title: 'Infosys Online Test', date: '2026-07-23', time: 'Slot 2', location: 'AB2 502' }
                  ] : [],
                }
              };
            }
          }
        }
      }

      // Auto-execute actions that do not require confirmation
      if (actionObj) {
        if (Array.isArray(actionObj)) {
          actionObj.forEach((act: any) => {
            if (act && !act.requiresConfirmation) {
              executeOrchestratedAction(act);
            }
          });
        } else if (!actionObj.requiresConfirmation) {
          executeOrchestratedAction(actionObj);
        }
      }

      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: conversationalText,
        timestamp: new Date().toISOString(),
        action: actionObj
          ? (Array.isArray(actionObj)
              ? actionObj.map((act: any) => act ? `${act.entity}:${act.operation}` : '').join(',')
              : `${actionObj.entity}:${actionObj.operation}`)
          : undefined,
        payload: actionObj || undefined,
        metadata: {
          pageContext: currentContext,
          confirmationStatus: actionObj && !Array.isArray(actionObj)
            ? (actionObj.requiresConfirmation ? 'pending' : 'approved')
            : undefined,
          confirmationStatuses: actionObj && Array.isArray(actionObj)
            ? actionObj.map((act: any) => act && act.requiresConfirmation ? 'pending' : 'approved')
            : undefined,
        },
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

  const renderSingleActionCard = (message: AIMessage, action: any, actionIndex?: number) => {
    if (!action) return null;

    const preview = action.preview || {
      title: action.payload?.name || action.payload?.problemName || action.payload?.question || 'Proposed Action',
      subtitle: `${action.entity || 'Item'} · ${action.operation || 'create'}`,
      details: action.payload || {},
    };

    const status = actionIndex !== undefined
      ? (message.metadata?.confirmationStatuses?.[actionIndex] || 'pending')
      : (message.metadata?.confirmationStatus || 'pending');

    // Identify matches to let user pick between create/update
    const entityList =
      action.entity === 'placement' ? (placementCompanies || []) :
      action.entity === 'leetcode' ? (dsaProblems || []) :
      action.entity === 'project' ? (projects || []) :
      action.entity === 'certification' ? (certifications || []) :
      action.entity === 'hr_question' ? (hrQuestions || []) : [];

    const getMatchedName = (item: any) => {
      if (action.entity === 'leetcode') return item.problemName;
      if (action.entity === 'hr_question') return item.question;
      return item.name;
    };

    const getPayloadName = () => {
      if (action.entity === 'leetcode') return action.payload?.problemName;
      if (action.entity === 'hr_question') return action.payload?.question;
      return action.payload?.name;
    };

    const getDisplayDetails = (item: any) => {
      if (action.entity === 'placement') return `${item.role || '—'} (${item.kind || 'placement'})`;
      if (action.entity === 'leetcode') return `Pattern: ${item.pattern || '—'}`;
      if (action.entity === 'project') return `Tech: ${item.techStack?.join(', ') || '—'}`;
      if (action.entity === 'certification') return `Provider: ${item.provider || '—'}`;
      return '';
    };

    const payloadName = getPayloadName();
    const matches = payloadName
      ? entityList
          .map((item: any, idx: number) => ({
            ...item,
            serial: idx + 1,
            matchedName: getMatchedName(item),
            details: getDisplayDetails(item),
          }))
          .filter((item: any) => item.matchedName?.toLowerCase() === payloadName.toLowerCase())
      : [];

    return (
      <div className="mt-3 bg-secondary/10 border border-border/60 rounded-lg p-3.5 space-y-2.5 text-xs w-full max-w-[95%]">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
          <div>
            <h4 className="font-bold text-foreground">{preview.title}</h4>
            <p className="text-[10px] text-muted-foreground">{preview.subtitle}</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
            Draft Action {actionIndex !== undefined ? `#${actionIndex + 1}` : ''}
          </span>
        </div>

        {preview.details && Object.keys(preview.details).length > 0 && (
          <div className="flex flex-col gap-2.5 text-[10.5px] py-1.5 border-b border-border/40 max-h-[300px] overflow-y-auto pr-1">
            {Object.entries(preview.details).map(([key, val]) => {
              const strVal = String(val || '—');
              const isLongText = strVal.length > 180 || strVal.includes('\n');
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                      {key}
                    </span>
                    {isLongText && (
                      <span className="text-[8.5px] bg-primary/10 text-primary font-bold px-1 rounded">
                        Document Artifact
                      </span>
                    )}
                  </div>
                  {isLongText ? (
                    <DetailArtifactItem content={strVal} />
                  ) : (
                    <span className="text-foreground font-medium whitespace-pre-wrap break-words leading-relaxed">
                      {strVal}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {status === 'pending' ? (
            <>
              <button
                onClick={() => handleActionResponseState(message.id, 'cancelled', undefined, undefined, actionIndex)}
                className="px-2 py-1 rounded bg-secondary/50 hover:bg-rose-500/10 text-rose-600 hover:text-rose-700 text-[10.5px] font-semibold transition-colors cursor-pointer"
              >
                Reject
              </button>
              
              <button
                onClick={() => handleActionResponseState(message.id, 'approved', 'create', undefined, actionIndex)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-[10.5px] font-semibold text-white transition-colors cursor-pointer"
              >
                Create New Entry
              </button>

              {matches.map((match: any, idx: number) => (
                <button
                  key={match.id ? `${match.id}-${idx}` : `match-${match.serial || idx}`}
                  onClick={() => handleActionResponseState(message.id, 'approved', 'update', match.id, actionIndex)}
                  className="px-2.5 py-1 rounded bg-primary hover:bg-primary/90 text-[10.5px] font-semibold text-primary-foreground flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Update Row #{match.serial} ({match.details})
                </button>
              ))}

              {matches.length === 0 && (
                <button
                  onClick={() => handleActionResponseState(message.id, 'approved', 'update', undefined, actionIndex)}
                  className="px-2.5 py-1 rounded bg-secondary/80 hover:bg-secondary text-[10.5px] font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Update Existing
                </button>
              )}
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

  const renderConfirmationCard = (message: AIMessage) => {
    const payload = message.payload;
    if (!payload) return null;

    if (Array.isArray(payload)) {
      return (
        <div className="space-y-3 w-full">
          {payload.map((action, idx) => (
            <div key={idx} className="w-full">
              {renderSingleActionCard(message, action, idx)}
            </div>
          ))}
        </div>
      );
    }

    return renderSingleActionCard(message, payload);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : `${panelWidth}px`,
      }}
      className={`fixed right-0 top-0 h-screen bg-card overlay-soft flex flex-col z-40 animate-in slide-in-from-right-96 border-l border-border ${
        isResizing ? 'select-none transition-none' : 'transition-[width] duration-150 ease-out'
      }`}
    >
      {/* Draggable Resize Handle on Left Edge */}
      <div
        onMouseDown={startResizing}
        onDoubleClick={() => updatePanelWidth(panelWidth > 550 ? 460 : 850)}
        className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize group z-50 flex items-center justify-center hover:bg-primary/20 transition-colors"
        title="Click and drag left/right to resize panel (Double click to reset)"
      >
        <div className="w-1 h-14 rounded-full bg-border/80 group-hover:bg-primary group-active:bg-primary transition-colors shadow-sm" />
      </div>

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
            onClick={() => {
              const targetWidth = panelWidth > 550 ? 460 : 850;
              updatePanelWidth(targetWidth);
              setIsExpanded(targetWidth > 550);
            }}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={panelWidth > 550 ? "Collapse Width" : "Expand Width"}
          >
            {panelWidth > 550 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-background animate-in fade-in-50">
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
                    className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-[11.5px] leading-relaxed shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                        : 'bg-card text-foreground rounded-tl-none markdown'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="space-y-2">
                        {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

                        {/* Pre-Send Attached Artifacts rendered in chat feed */}
                        {message.metadata?.attachments && message.metadata.attachments.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            {message.metadata.attachments.map((att: any) => (
                              <UserArtifactCard key={att.id || att.title} content={att.content} />
                            ))}
                          </div>
                        ) : (
                          (() => {
                            const wordCount = message.content.trim().split(/\s+/).filter(Boolean).length;
                            const isArtifact = wordCount > 30 || message.content.length > 180 || message.content.split('\n').length > 3;
                            return isArtifact ? (
                              <UserArtifactCard key={message.id} content={message.content} />
                            ) : null;
                          })()
                        )}
                      </div>
                    ) : (
                      renderMarkdown(message.content)
                    )}
                  </div>
                  {/* Action Confirmation Card */}
                  {message.role === 'assistant' &&
                    message.payload &&
                    (Array.isArray(message.payload)
                      ? message.payload.some((act: any) => act && act.requiresConfirmation)
                      : message.payload.requiresConfirmation) &&
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
          {/* Pre-Send Attachment Chips Bar */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm group transition-all"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setActiveModalArtifact(att)}
                    className="hover:underline truncate max-w-[150px] cursor-pointer"
                    title="Click to view & edit attachment before sending"
                  >
                    {att.title} ({att.wordCount} words)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={attachments.length > 0 ? "Type your prompt instruction..." : "Ask Northbound AI anything or paste document..."}
              className="flex-1 px-3 py-2 bg-secondary/80 text-foreground placeholder-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto max-h-[120px] rounded-lg leading-normal"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!chatInput.trim() && attachments.length === 0)}
              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Artifact Modal for Pre-Send Attachment Preview / Edit */}
      {activeModalArtifact && (
        <ArtifactModal
          content={activeModalArtifact.content}
          title={activeModalArtifact.title}
          onClose={() => setActiveModalArtifact(null)}
          onSave={(updatedContent) => {
            setAttachments((prev) =>
              prev.map((att) =>
                att.id === activeModalArtifact.id
                  ? {
                      ...att,
                      content: updatedContent,
                      wordCount: updatedContent.trim().split(/\s+/).filter(Boolean).length,
                      lineCount: updatedContent.split('\n').length,
                    }
                  : att
              )
            );
            setActiveModalArtifact(null);
          }}
        />
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
    if (pathname.startsWith('/placement')) return 'placement';
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
