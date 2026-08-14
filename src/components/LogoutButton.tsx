'use client';
import { signOut } from 'next-auth/react';

export default function LogoutButton({ initial }: { initial: string }) {

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center justify-center px-4 py-2 rounded-md bg-[var(--primary)] text-white hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
      title="Sign Out"
    >
      Signout
    </button>
  );
}
