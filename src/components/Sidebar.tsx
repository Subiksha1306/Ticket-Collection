'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ userName, isAdmin }: { userName?: string | null, isAdmin?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: 'home' },
    { name: isAdmin ? 'All Submissions' : 'My Submissions', href: '/submissions', icon: 'folder' },
  ];

  return (
    <div className="w-64 bg-[#1A1D2D] text-white flex flex-col h-full border-r border-gray-800">
      <div className="p-4 py-6 flex items-center justify-center border-b border-gray-800/50">
        <Link href="/" className="flex items-center w-full justify-center px-2">
          <img src="/logo-sidebar.png" alt="Techxle" className="h-12 w-auto object-contain" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[var(--primary)] text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Minimal Icons based on type */}
                {item.icon === 'home' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {item.icon === 'folder' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-4">
          <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-3 px-3">
            WORKSPACE
          </div>
          <Link
            href="/submissions/new"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/submissions/new'
                ? 'bg-[var(--primary)] text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            New Submission
          </Link>
        </div>
      </div>

      <div className="mt-auto px-4 py-4 space-y-2 border-t border-gray-800/50">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Help
        </Link>
        
        {userName && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg bg-gray-800/30">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{userName}</span>
              <span className="text-xs text-gray-400">Logged in</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
