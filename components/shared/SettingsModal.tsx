'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Check, Loader2 } from 'lucide-react';
import { getApiUrl, parseResponseBody } from '@/lib/api';

interface SettingsModalProps {
  username: string;
  onClose: () => void;
}

const inputClass =
  'pill-soft w-full bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground';
const labelClass = 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground';

export function SettingsModal({ username, onClose }: SettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Checked here as well as on the server so the mismatch is caught before a
    // round trip; the server stays authoritative.
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      });
      const body = await parseResponseBody<{ error?: string } | string>(
        res,
        `Unexpected server response (HTTP ${res.status}).`,
      );
      const parsed = typeof body === 'string' ? { error: body } : (body ?? {});
      if (!res.ok) throw new Error(parsed.error || 'Could not change the password.');

      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Rendered into <body>. This modal is mounted from the navbar, whose header
   * uses backdrop-blur — and a backdrop-filter ancestor becomes the containing
   * block for `fixed` descendants, so without a portal the overlay positions
   * against the 64px header and gets clipped instead of covering the viewport.
   */
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="overlay-soft flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 id="settings-title" className="text-sm font-bold text-foreground">
            Settings
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

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">Change password</p>
              <p className="text-[10px] text-muted-foreground">
                Signed in as <span className="font-mono">{username}</span>
              </p>
            </div>
          </div>

          {done ? (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Check className="h-3.5 w-3.5" />
                Password updated.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Use the new password next time you sign in. You stay signed in here.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="pill-soft pill-soft-interactive self-end bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="sm-current">
                  Current password
                </label>
                <input
                  id="sm-current"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="sm-new">
                  New password
                </label>
                <input
                  id="sm-new"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="sm-confirm">
                  Confirm new password
                </label>
                <input
                  id="sm-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Repeat the new password"
                />
              </div>

              {error && (
                <p role="alert" className="text-[11px] font-medium text-destructive">
                  ⚠️ {error}
                </p>
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
                  disabled={busy || !currentPassword || !newPassword || !confirmPassword}
                  className="pill-soft pill-soft-interactive flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                  {busy ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
