'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminMonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700">Select Month for Live Summary:</label>
      <input
        type="month"
        value={currentMonth}
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/admin?month=${e.target.value}`);
          }
        }}
        className="input-field max-w-[200px]"
      />
    </div>
  );
}
