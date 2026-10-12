'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

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
      {/* Brand Logo */}
      <div className="pt-2 pb-6 px-3">
        <Link href="/" onClick={onNavigate} className="inline-flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="ImpactX"
            className="h-8 max-w-[155px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-xl font-bold tracking-tight text-[var(--text)] select-none">
            Impact<span className="text-[var(--primary)] font-extrabold">X</span>
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

export const AppShell: React.FC<AppShellProps> = ({
  userName = 'User',
  userEmail,
  isAdmin = false,
  children,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[var(--bg)] relative overflow-x-hidden text-[var(--text)] font-sans antialiased selection:bg-[var(--primary)] selection:text-white">
      {/* Background Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'var(--glow)' }}
        aria-hidden="true"
      />

      {/* Main Page Container with 20px padding */}
      <div className="relative z-10 p-4 sm:p-5 min-h-screen flex gap-5 max-w-[1600px] mx-auto">
        {/* Floating Glass Sidebar (Desktop) */}
        <aside
          className="w-[240px] shrink-0 hidden lg:flex flex-col rounded-[24px] bg-white/65 backdrop-blur-[18px] border border-white/85 shadow-[0_8px_30px_rgba(44,66,110,0.08)] p-5 h-[calc(100vh-40px)] sticky top-5"
          style={{
            WebkitBackdropFilter: 'blur(18px)',
          }}
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
              className="w-[280px] h-full bg-white/90 backdrop-blur-[24px] border-r border-white/80 p-5 shadow-2xl flex flex-col"
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
                className="lg:hidden p-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-[var(--text-2)] hover:text-[var(--text)] shadow-sm"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Pill Search Input */}
              <form action="/submissions" method="GET" className="relative w-full">
                <div className="relative">
                  <input
                    type="text"
                    name="q"
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
            </div>

            {/* Sign Out Pill Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-6 py-2.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(61,90,140,0.25)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 active:scale-95"
              >
                Sign out
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 flex flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
