'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent } from 'react';

export default function AdminMonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentMonthParam = searchParams.get('month');
  
  let currentMonthValue = '';
  if (currentMonthParam) {
    currentMonthValue = currentMonthParam;
  } else {
    const now = new Date();
    // format as YYYY-MM
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    currentMonthValue = `${year}-${month}`;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    if (newMonth) {
      router.push(`/admin?month=${newMonth}`);
    } else {
      router.push(`/admin`);
    }
  };

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden w-fit">
      <div className="pl-3 pr-2 text-gray-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      <input 
        type="month" 
        value={currentMonthValue}
        onChange={handleChange}
        className="py-2 pr-3 pl-1 text-sm font-medium text-gray-700 outline-none border-none focus:ring-0 bg-transparent"
      />
    </div>
  );
}
