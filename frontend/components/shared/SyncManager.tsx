'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { getApiUrl, parseResponseBody } from '@/lib/api';

export function SyncManager() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState('');

  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const storedUser = window.localStorage.getItem('preptrack_username');
    setUsername(storedUser);

    // Listen for profile switches/logouts
    const handleProfileSwitch = () => {
      window.localStorage.removeItem('preptrack_username');
      window.sessionStorage.removeItem('preptrack_synced');
      setUsername(null);
      setErrorMsg('');
      setLoginInput('');
      setLoginPassword('');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setActiveTab('login');
    };

    window.addEventListener('preptrack_profile_switch', handleProfileSwitch);

    const handleStorageChange = () => {
      const stored = window.localStorage.getItem('preptrack_username');
      if (stored !== username) {
        setUsername(stored);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('preptrack_profile_switch', handleProfileSwitch);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [username]);

  // Load database sync data for a validated username
  const syncProfileData = async (targetUsername: string) => {
    setIsSyncing(true);
    setErrorMsg('');

    try {
      const res = await fetch(getApiUrl(`/api/sync/${targetUsername}`));

      if (!res.ok) {
        throw new Error('Failed to load profile data from sync server.');
      }

      const syncPayload = await parseResponseBody<Record<string, unknown> | string>(res, {});
      const syncData = typeof syncPayload === 'object' && syncPayload !== null ? syncPayload : {};

      // Write synced collections directly into localStorage
      Object.entries(syncData).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
        // Dispatch storage update event for live UI synchrony
        window.dispatchEvent(
          new CustomEvent('preptrack_storage_update', { detail: { key, value } })
        );
      });

      // Commit login states
      window.sessionStorage.setItem('preptrack_synced', 'true');
      window.localStorage.setItem('preptrack_username', targetUsername);
      setUsername(targetUsername);

      window.dispatchEvent(
        new CustomEvent('preptrack_profile_changed', { detail: targetUsername })
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Server connection failed during profile sync.');
      
      // Fallback: login offline if database sync fails
      window.localStorage.setItem('preptrack_username', targetUsername);
      setUsername(targetUsername);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync if logged in but not synced this session
  useEffect(() => {
    if (!username) return;

    const isSyncedThisSession = window.sessionStorage.getItem('preptrack_synced') === 'true';
    if (!isSyncedThisSession) {
      const autoSync = async () => {
        try {
          const res = await fetch(getApiUrl(`/api/sync/${username}`));
          if (res.ok) {
            const syncPayload = await parseResponseBody<Record<string, unknown> | string>(res, {});
            const syncData = typeof syncPayload === 'object' && syncPayload !== null ? syncPayload : {};
            Object.entries(syncData).forEach(([key, value]) => {
              window.localStorage.setItem(key, JSON.stringify(value));
              window.dispatchEvent(
                new CustomEvent('preptrack_storage_update', { detail: { key, value } })
              );
            });
            window.sessionStorage.setItem('preptrack_synced', 'true');
          }
        } catch (err) {
          console.warn('[SyncManager] Auto-sync failed, running in local-offline state.', err);
        }
      };
      autoSync();
    }
  }, [username]);

  // Form handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !loginPassword) {
      setErrorMsg('Please fill in all login fields.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: loginInput.trim(),
          password: loginPassword,
        }),
      });

      const data = await parseResponseBody<{ error?: string; username?: string } | string>(response, 'Unexpected server response.');
      const parsedData = typeof data === 'string' ? { error: data } : (data ?? {});
      if (!response.ok) {
        throw new Error(parsedData.error || 'Authentication failed.');
      }

      // Logged in successfully, load user data collections
      if (!parsedData.username) {
        throw new Error('Authentication succeeded but no username was returned.');
      }
      await syncProfileData(parsedData.username);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Login request failed.');
      setIsSyncing(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword || !regConfirmPassword) {
      setErrorMsg('Please fill in all required sign-up fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data = await parseResponseBody<{ error?: string; username?: string } | string>(response, 'Unexpected server response.');
      const parsedData = typeof data === 'string' ? { error: data } : (data ?? {});
      if (!response.ok) {
        throw new Error(parsedData.error || 'Registration failed.');
      }

      // Automatically sign in upon registration
      if (!parsedData.username) {
        throw new Error('Registration succeeded but no username was returned.');
      }
      await syncProfileData(parsedData.username);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Registration request failed.');
      setIsSyncing(false);
    }
  };

  if (!isMounted || username) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md overflow-hidden border border-border bg-card rounded-2xl shadow-2xl relative p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Northbound Study Hub</h2>
          <p className="text-xs text-muted-foreground">
            Sign in to load your study statistics and resume your preparation.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-xl border border-border">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Forms */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  disabled={isSyncing}
                  required
                  className="w-full h-10 pl-9 pr-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSyncing}
                  required
                  className="w-full h-10 pl-9 pr-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full h-10 mt-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 shadow text-xs transition-colors"
            >
              {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Username (required)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                disabled={isSyncing}
                required
                className="w-full h-10 pl-9 pr-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email Address (optional)"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={isSyncing}
                className="w-full h-10 pl-9 pr-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                disabled={isSyncing}
                required
                className="w-full h-10 pl-9 pr-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                disabled={isSyncing}
                required
                className="w-full h-10 pl-9 pr-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full h-10 mt-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 shadow text-xs transition-colors"
            >
              {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </form>
        )}

        {/* Error notification */}
        {errorMsg && (
          <p className="text-xs text-destructive text-center font-medium mt-2 animate-pulse">
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Background Sync Loader */}
        {isSyncing && (
          <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-2 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Synchronizing prep tracker collections...</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
