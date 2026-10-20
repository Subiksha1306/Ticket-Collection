'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import FrsionCanvasDecor from '@/components/ui/FrsionCanvasDecor';
import TechxleAsciiLogo from '@/components/ui/TechxleAsciiLogo';

interface AppShellProps {
  userName?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

function renderNavIcon(type: string) {
  switch (type) {
    case 'home':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'folder':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'star':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="3" strokeWidth={1.75} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case 'new':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'drafts':
      return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    default:
      return null;
  }
}

interface SidebarViewProps {
  mainNav: NavItem[];
  workspaceNav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  userName: string;
  initial: string;
}

function SidebarView({
  mainNav,
  workspaceNav,
  pathname,
  onNavigate,
  userName,
  initial,
}: SidebarViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand Logo in Papillon Serif Font centered */}
      <div className="pt-2 pb-6 px-3 flex justify-center text-center">
        <Link href="/" onClick={onNavigate} className="inline-flex items-center justify-center group focus:outline-none text-center">
          <span className="font-papillon text-[28px] tracking-[0.04em] text-[var(--text)] select-none leading-none transition-transform group-hover:scale-[1.02]">
            Impact<span className="text-[var(--primary)]">X</span>
          </span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !pathname.startsWith('/submissions/new'));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[14px] text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--primary)] text-white font-semibold shadow-[0_4px_14px_rgba(61,90,140,0.25)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-white/50'
              }`}
            >
              {renderNavIcon(item.icon)}
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Workspace Section */}
        <div className="pt-6 pb-2">
          <p className="text-[11px] font-semibold text-[var(--text-3)] tracking-wider uppercase px-3.5 mb-2">
            WORKSPACE
          </p>
          <div className="space-y-1.5">
            {workspaceNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[14px] text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--primary)] text-white font-semibold shadow-[0_4px_14px_rgba(61,90,140,0.25)]'
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-white/50'
                  }`}
                >
                  {renderNavIcon(item.icon)}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Profile Pill at Bottom */}
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-3 p-3 rounded-[18px] bg-white/60 border border-white/75 shadow-[0_2px_8px_rgba(44,66,110,0.04)]">
          <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
            {initial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[var(--text)] truncate leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-[var(--text-2)] leading-normal">
              Logged in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionsSearchBar() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    try {
      const currentQ = new URLSearchParams(window.location.search).get('q') || '';
      setQuery(currentQ);
    } catch (_) {}
  }, []);

  return (
    <form action="/submissions" method="GET" className="relative w-full">
      <div className="relative">
        <input
          type="text"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ticket, title, or person..."
          className="w-full pl-5 pr-10 py-2.5 rounded-full bg-white/50 backdrop-blur-md border border-white/80 text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all shadow-[0_2px_8px_rgba(44,66,110,0.04)]"
        />
        <button
          type="submit"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--primary)] transition-colors"
          aria-label="Search"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
}

export const AppShell: React.FC<AppShellProps> = ({
  userName = 'User',
  userEmail,
  isAdmin = false,
  children,
}) => {
  const pathname = usePathname();
  const isSubmissionsPage = pathname === '/submissions' || pathname === '/submissions/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('impactx_theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (_) {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('impactx_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (_) {}
  };

  const mainNav: NavItem[] = [
    { name: 'Home', href: '/', icon: 'home' },
    { name: isAdmin ? 'All submissions' : 'My submissions', href: '/submissions', icon: 'folder' },
    ...(isAdmin ? [{ name: 'Manager dashboard', href: '/manager', icon: 'chart' }] : []),
    { name: 'Awards and summary', href: '/awards', icon: 'star' },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: 'settings' }] : []),
  ];

  const workspaceNav: NavItem[] = [
    { name: 'New submission', href: '/submissions/new', icon: 'new' },
    { name: 'Drafts', href: '/drafts', icon: 'drafts' },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] relative overflow-x-hidden text-[var(--text)] font-sans antialiased selection:bg-[var(--primary)] selection:text-white transition-colors duration-300">
      {/* Background Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'var(--glow)' }}
        aria-hidden="true"
      />

      {/* Techxle ASCII / Halftone Logo merging into canvas background */}
      <div
        className="fixed -top-12 -right-16 md:right-0 lg:right-4 w-[620px] md:w-[780px] lg:w-[920px] max-w-[65vw] h-auto pointer-events-none z-0 select-none opacity-[0.16] dark:opacity-[0.20] text-[#2c426e] dark:text-sky-300 transition-opacity duration-500"
        aria-hidden="true"
      >
        <TechxleAsciiLogo variant="emblem" fadeDirection="left" showAsciiText={true} />
      </div>

      {/* 3D Decorative Orbs & Glass Elements matching FrsionOS */}
      <FrsionCanvasDecor />

      {/* Main Page Container with 20px padding */}
      <div className="relative z-10 p-4 sm:p-6 min-h-screen flex gap-6 max-w-[1600px] mx-auto">
        {/* Floating Glass Sidebar (Desktop) */}
        <aside
          className="w-[240px] shrink-0 hidden lg:flex flex-col master-acrylic-canvas p-5 h-[calc(100vh-48px)] sticky top-6 z-20"
        >
          <SidebarView
            mainNav={mainNav}
            workspaceNav={workspaceNav}
            pathname={pathname}
            userName={displayName}
            initial={initial}
          />
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-slate-900/40 backdrop-blur-sm flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-[280px] h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-[24px] border-r border-white/80 dark:border-white/10 p-5 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-black/5 text-[var(--text-2)]"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarView
                mainNav={mainNav}
                workspaceNav={workspaceNav}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
                userName={displayName}
                initial={initial}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Top Bar with Search & Sign Out */}
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              {/* Mobile hamburger menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/15 text-[var(--text-2)] hover:text-[var(--text)] shadow-sm"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Pill Search Input - Only shown on All Submissions page */}
              {isSubmissionsPage && <SubmissionsSearchBar />}
            </div>

            {/* Theme Toggle & Sign Out Pill Buttons */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to night theme'}
                title={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to night theme'}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/15 text-[var(--text)] hover:text-[var(--primary)] shadow-[0_2px_8px_rgba(44,66,110,0.06)] hover:shadow-md transition-all active:scale-95 text-xs font-semibold select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="w-4 h-4 text-amber-300 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Day</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[var(--text-2)] group-hover:text-[var(--primary)] group-hover:-rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>Night</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="frsion-pill-dark"
              >
                Sign out
              </button>
            </div>
          </header>

          {/* Page Body inside Master Acrylic Glass Canvas */}
          <main className="flex-1 flex flex-col gap-6 master-acrylic-canvas p-6 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
