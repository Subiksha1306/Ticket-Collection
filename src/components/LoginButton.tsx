'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn('azure-ad', { callbackUrl: '/' });
  };

  return (
    <button 
      onClick={handleLogin} 
      disabled={loading}
      className="w-full primary-btn flex justify-center items-center gap-3 py-3 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 24H0V12.6h11.4V24ZM24 24H12.6V12.6H24V24ZM11.4 11.4H0V0h11.4v11.4ZM24 11.4H12.6V0H24v11.4Z" />
      </svg>
      {loading ? 'Connecting to Microsoft...' : 'Sign in with Microsoft'}
    </button>
  );
}
