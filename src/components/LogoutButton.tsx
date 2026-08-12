'use client';
import { signOut } from 'next-auth/react';

export default function LogoutButton({ initial }: { initial: string }) {

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
      title="Sign Out"
    >
      {initial}
    </button>
  );
}
