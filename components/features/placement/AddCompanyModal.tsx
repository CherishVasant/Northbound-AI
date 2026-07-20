'use client';

import { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import {
  COMPENSATION_UNITS,
  KINDS,
  type CompensationUnit,
  type OpportunityKind,
} from '@/lib/constants/placement';

export interface NewCompanyDraft {
  name: string;
  role: string;
  kind: OpportunityKind;
  amount: number;
  unit: CompensationUnit;
  location: string;
  deadlineDate: string;
  deadlineTime: string;
  optedIn: boolean;
  reason: string;
  skills: string[];
  notes: string;
}

interface AddCompanyModalProps {
  /** Placement unless the user says otherwise. */
  defaultKind: OpportunityKind;
  onCreate: (draft: NewCompanyDraft) => void;
  onClose: () => void;
}

const inputClass =
  'pill-soft w-full bg-secondary/40 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground';
const labelClass = 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground';

export function AddCompanyModal({ defaultKind, onCreate, onClose }: AddCompanyModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [pkg, setPkg] = useState('');
  const [kind, setKind] = useState<OpportunityKind>(defaultKind);
  // Internships are quoted per month far more often than as an annual figure.
  const [unit, setUnit] = useState<CompensationUnit>(
    defaultKind === 'internship' ? 'per-month' : 'LPA',
  );
  const [location, setLocation] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [optedIn, setOptedIn] = useState(true);
  const [reason, setReason] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [notes, setNotes] = useState('');

  const addSkill = () => {
    const value = skillDraft.trim();
    if (!value) return;
    // Case-insensitive dedupe, matching the detail panel's editor.
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkillDraft('');
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillDraft('');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      role: role.trim(),
      kind,
      amount: Number(pkg) || 0,
      unit,
      location: location.trim(),
      deadlineDate,
      deadlineTime,
      optedIn,
      reason: optedIn ? '' : reason.trim(),
      skills,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-company-title"
        className="overlay-soft flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 id="add-company-title" className="text-sm font-bold text-foreground">
            Add Company
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="ac-name">
              Company name <span className="text-destructive">*</span>
            </label>
            <input
              id="ac-name"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Groww"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className={labelClass}>Type</span>
            <div className="flex items-center gap-1">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => {
                    setKind(k.value);
                    setUnit(k.value === 'internship' ? 'per-month' : 'LPA');
                  }}
                  className={`flex-1 rounded-[10px] px-2 py-1.5 text-xs font-semibold transition-colors ${
                    kind === k.value
                      ? 'bg-[var(--nav-active-bg)] text-primary'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="ac-role">Role</label>
              <input
                id="ac-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
                placeholder="e.g. SDE"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="ac-package">Package</label>
              <div className="flex items-center gap-1.5">
                <input
                  id="ac-package"
                  type="number"
                  min="0"
                  step="0.1"
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value)}
                  className={`${inputClass} font-mono`}
                  placeholder={unit === 'LPA' ? '12.5' : '135000'}
                />
                <select
                  aria-label="Package unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as CompensationUnit)}
                  className="pill-soft shrink-0 cursor-pointer bg-secondary/40 px-1.5 py-1.5 font-mono text-[10px] text-foreground"
                >
                  {COMPENSATION_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="ac-location">Location</label>
            <input
              id="ac-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder="e.g. Bangalore"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="ac-date">Deadline date</label>
              <input
                id="ac-date"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="ac-time">Deadline time</label>
              <input
                id="ac-time"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="ac-skills">Skills required</label>
            {skills.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="pill-soft inline-flex items-center gap-1 bg-secondary/60 py-0.5 pl-2 pr-1 font-mono text-[10px] text-foreground"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                      aria-label={`Remove ${s}`}
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                id="ac-skills"
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter must not submit the form while adding a tag.
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className={`${inputClass} font-mono`}
                placeholder="Type a skill, press Enter"
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={!skillDraft.trim()}
                aria-label="Add skill"
                className="pill-soft pill-soft-interactive flex h-7 w-7 shrink-0 items-center justify-center bg-secondary/60 text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="ac-notes">Notes</label>
            <textarea
              id="ac-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputClass} resize-y`}
              placeholder="Anything worth remembering about this company"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <span className={labelClass}>Opted in</span>
            <ToggleSwitch checked={optedIn} onChange={setOptedIn} label="Opted in" />
          </div>

          {/* Mutually exclusive with the deadline — only meaningful when skipping. */}
          {!optedIn && (
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="ac-reason">Reason for not opting in</label>
              <input
                id="ac-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={inputClass}
                placeholder="e.g. Low package, location mismatch"
              />
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="pill-soft pill-soft-interactive bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="pill-soft pill-soft-interactive bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Add Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
