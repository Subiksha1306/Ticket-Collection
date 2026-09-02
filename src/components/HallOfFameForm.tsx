'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HallOfFameForm() {
  const router = useRouter();
  const [month, setMonth] = useState('');
  const [winnerName, setWinnerName] = useState('');
  const [runnerUpName, setRunnerUpName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !winnerName || !runnerUpName) return;

    setIsSubmitting(true);
    
    try {
      const [yearStr, monthStr] = month.split('-');
      
      const res = await fetch('/api/hall-of-fame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(monthStr),
          year: parseInt(yearStr),
          winnerName,
          runnerUpName
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setMonth('');
      setWinnerName('');
      setRunnerUpName('');
      router.refresh();
      alert('Hall of Fame entry saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save Hall of Fame entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add / Edit Hall of Fame Entry</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Winner Name</label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={winnerName}
            onChange={(e) => setWinnerName(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Runner-up Name</label>
          <input
            type="text"
            placeholder="e.g. Jane Smith"
            value={runnerUpName}
            onChange={(e) => setRunnerUpName(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-btn h-10 w-full"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
