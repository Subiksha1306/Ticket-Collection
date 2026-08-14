'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchInput({ initialValue = '' }: { initialValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  // Keep local state in sync if URL changes externally
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (query === initialValue) return;
    
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        router.push(`?q=${encodeURIComponent(query)}`);
      } else {
        router.push(`?`);
      }
      router.refresh();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, router, initialValue]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm transition-colors"
      placeholder="Search by ticket number or title..."
    />
  );
}
