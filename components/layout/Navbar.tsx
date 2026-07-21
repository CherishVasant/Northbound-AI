'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, BarChart3, Book, BookOpen, Code2, Briefcase, Award, Bot, Menu, X, Cloud, RefreshCw, AlertCircle, LogOut, HelpCircle, Building2, MoonStar, SunMedium, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { NorthboundBrand } from '@/components/shared/NorthboundBrand';
import { SettingsModal } from '@/components/shared/SettingsModal';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/placement', label: 'Placement', icon: Building2 },
  { href: '/concepts', label: 'DSA Concepts', icon: BookOpen },
  { href: '/dsa', label: 'LeetCode Tracker', icon: BarChart3 },
  { href: '/subjects', label: 'Core Subjects', icon: Book },
  { href: '/prep', label: 'Prep & More', icon: Briefcase },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = window.localStorage.getItem('northbound-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : (prefersDark ? 'dark' : 'light');

    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');

    // Initial username load
    setUsername(window.localStorage.getItem('preptrack_username'));

    const handleProfileChanged = (e: any) => {
      setUsername(e.detail);
    };

    const handleSyncStatus = (e: any) => {
      setSyncStatus(e.detail);
    };

    window.addEventListener('preptrack_profile_changed' as any, handleProfileChanged);
    window.addEventListener('preptrack_sync_status' as any, handleSyncStatus);

    return () => {
      window.removeEventListener('preptrack_profile_changed' as any, handleProfileChanged);
      window.removeEventListener('preptrack_sync_status' as any, handleSyncStatus);
    };
  }, []);

  const handleSwitchProfile = () => {
    window.dispatchEvent(new CustomEvent('preptrack_profile_switch'));
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const handleToggleAI = () => {
    window.dispatchEvent(new CustomEvent('preptrack_toggle_ai'));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    window.localStorage.setItem('northbound-theme', nextTheme);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[var(--shadow-pill)]">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Left: Brand Logo & Horizontal Nav */}
        <div className="flex items-center gap-6">
          <NorthboundBrand className="hidden sm:flex" />
          <div className="sm:hidden">
            <NorthboundBrand compact />
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`flex items-center gap-0 px-2 py-2 rounded-[10px] text-sm font-medium transition-all xl:gap-2 xl:px-3 ${
                    isActive
                      ? 'bg-[var(--nav-active-bg)] text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions (Sync Status, Profile & AI Toggle) */}
        <div className="flex items-center gap-3">
          {username && (
            <div className="flex items-center gap-2 bg-accent/40 pill-soft px-2.5 py-1 shrink-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 flex items-center justify-center font-bold text-xs text-primary shadow-sm shrink-0">
                {getInitials(username)}
              </div>
              <span className="text-xs font-semibold capitalize text-foreground max-w-[80px] truncate hidden sm:inline-block">
                {username}
              </span>

              {/* Sync status */}
              <div className="flex items-center ml-1 border-l border-border/80 pl-2">
                {syncStatus === 'saved' && (
                  <span title="All changes saved to cloud">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                )}
                {syncStatus === 'saving' && (
                  <span title="Saving changes...">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span title="Sync connection error">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  </span>
                )}
              </div>

              {/* Logout/Switch */}
              <button
                onClick={() => setShowSettings(true)}
                title="Settings"
                aria-label="Open settings"
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                <Settings className="w-3 h-3" />
              </button>

              <button
                onClick={handleSwitchProfile}
                title="Switch Profile"
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="pill-soft pill-soft-interactive bg-background/70 p-2 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
            suppressHydrationWarning
          >
            {mounted && theme === 'dark' ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </button>

          {/* AI Toggle Action */}
          <button
            onClick={handleToggleAI}
            className="p-2 pill-soft pill-soft-interactive hover:bg-primary/5 text-muted-foreground hover:text-primary flex items-center justify-center relative shrink-0"
            title="Open AI Copilot Panel"
            suppressHydrationWarning
          >
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 pill-soft pill-soft-interactive hover:bg-accent md:hidden text-muted-foreground hover:text-foreground"
            suppressHydrationWarning
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background py-4 px-6 shadow-[var(--shadow-overlay)] animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
      {showSettings && username && (
        <SettingsModal username={username} onClose={() => setShowSettings(false)} />
      )}
    </header>
  );
}
