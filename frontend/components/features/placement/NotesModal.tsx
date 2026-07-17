'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, FileText, Clock } from 'lucide-react';
import { PlacementCompany, PlacementNotes } from '@/lib/utils/storage';

interface NotesModalProps {
  company: PlacementCompany;
  onSave: (notes: PlacementNotes) => void;
  onClose: () => void;
}

const PLACEHOLDER = `Notes for this company…

— Interview Questions
— Coding Questions / Topics
— MCQ Topics
— Aptitude Style
— Culture Fit Hints
— Feedback Received
— Recruiter Comments
— Mistakes to Avoid
— Preparation Checklist
— Any Other Notes`;

export function NotesModal({ company, onSave, onClose }: NotesModalProps) {
  const [content, setContent] = useState(company.notes.content);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Debounced auto-save
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setContent(val);
      setSaved(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSave({
          content: val,
          lastEdited: new Date().toISOString(),
        });
        setSaved(true);
      }, 1000);
    },
    [onSave]
  );

  // Save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Flush final save
        onSave({ content, lastEdited: new Date().toISOString() });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastEdited = company.notes.lastEdited
    ? new Date(company.notes.lastEdited).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {company.company || 'Untitled Company'} — Notes
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {company.jobRole || 'No role set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save indicator */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {saved
                ? lastEdited
                  ? `Saved ${lastEdited}`
                  : 'Saved'
                : 'Saving…'}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={handleChange}
          placeholder={PLACEHOLDER}
          className="flex-1 w-full p-5 resize-none bg-card text-foreground text-sm font-mono leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
          autoFocus
          spellCheck={false}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 shrink-0">
          <span className="text-xs text-muted-foreground">
            {content.length > 0 ? `${content.length} chars` : 'Start typing your notes…'}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
