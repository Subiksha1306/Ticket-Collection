'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface RegisteredUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface HallOfFameEntry {
  id: string;
  month: number;
  year: number;
  winnerName: string;
  runnerUpName: string;
  winnerImage?: string | null;
  runnerUpImage?: string | null;
}

export default function HallOfFameForm() {
  const router = useRouter();
  const [month, setMonth] = useState('');
  const [winnerName, setWinnerName] = useState('');
  const [winnerImage, setWinnerImage] = useState('');
  const [runnerUpName, setRunnerUpName] = useState('');
  const [runnerUpImage, setRunnerUpImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingWinner, setIsUploadingWinner] = useState(false);
  const [isUploadingRunnerUp, setIsUploadingRunnerUp] = useState(false);

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [existingEntries, setExistingEntries] = useState<HallOfFameEntry[]>([]);

  const winnerFileInputRef = useRef<HTMLInputElement>(null);
  const runnerUpFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch registered users and existing entries on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/hall-of-fame');
        if (res.ok) {
          const data = await res.json();
          if (data.users) setRegisteredUsers(data.users);
          if (data.entries) setExistingEntries(data.entries);
        }
      } catch (err) {
        console.error('Failed to load hall of fame data:', err);
      }
    }
    loadData();
  }, []);

  // When month changes, check if there's already an entry for this month/year and pre-populate
  const handleMonthChange = (selectedMonth: string) => {
    setMonth(selectedMonth);
    if (!selectedMonth) return;

    const [yearStr, monthStr] = selectedMonth.split('-');
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);

    const existing = existingEntries.find((e) => e.month === m && e.year === y);
    if (existing) {
      setWinnerName(existing.winnerName || '');
      setRunnerUpName(existing.runnerUpName || '');
      setWinnerImage(existing.winnerImage || '');
      setRunnerUpImage(existing.runnerUpImage || '');
    }
  };

  // When winner name changes, check if a registered user matches to suggest their photo
  const handleWinnerNameChange = (name: string) => {
    setWinnerName(name);
    if (!winnerImage && name.trim()) {
      const match = registeredUsers.find(
        (u) => u.name && u.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (match?.image) {
        setWinnerImage(match.image);
      }
    }
  };

  // When runner up name changes, check if a registered user matches to suggest their photo
  const handleRunnerUpNameChange = (name: string) => {
    setRunnerUpName(name);
    if (!runnerUpImage && name.trim()) {
      const match = registeredUsers.find(
        (u) => u.name && u.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (match?.image) {
        setRunnerUpImage(match.image);
      }
    }
  };

  // File upload handler using /api/upload
  const handleFileUpload = async (file: File, type: 'winner' | 'runnerUp') => {
    const isWinner = type === 'winner';
    if (isWinner) setIsUploadingWinner(true);
    else setIsUploadingRunnerUp(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.attachments && data.attachments[0]?.storagePath) {
        const url = data.attachments[0].storagePath;
        if (isWinner) {
          setWinnerImage(url);
        } else {
          setRunnerUpImage(url);
        }
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo. You can also paste an image URL directly.');
    } finally {
      if (isWinner) setIsUploadingWinner(false);
      else setIsUploadingRunnerUp(false);
    }
  };

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
          runnerUpName,
          winnerImage: winnerImage.trim() || undefined,
          runnerUpImage: runnerUpImage.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      const savedEntry = await res.json();
      // Update existing entries cache
      setExistingEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.month === savedEntry.month && e.year === savedEntry.year)
        );
        return [savedEntry, ...filtered];
      });

      router.refresh();
      alert('Hall of Fame entry saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save Hall of Fame entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (
      !confirm(
        'Are you sure you want to completely erase the Hall of Fame history? This cannot be undone.'
      )
    )
      return;
    try {
      const res = await fetch('/api/hall-of-fame', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setExistingEntries([]);
      setMonth('');
      setWinnerName('');
      setWinnerImage('');
      setRunnerUpName('');
      setRunnerUpImage('');
      router.refresh();
      alert('Hall of Fame history erased successfully!');
    } catch (error) {
      alert('Failed to erase history.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-6 mb-8 transition-colors">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏆</span> Add / Edit Hall of Fame Entry
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Set monthly winners and their Microsoft 365 / Teams profile pictures.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
        >
          Clear History
        </button>
      </div>

      {/* Datalist for registered user autocompletion */}
      <datalist id="registered-users-list">
        {registeredUsers.map((u) => (
          <option key={u.id} value={u.name || ''}>
            {u.email ? `${u.name} (${u.email})` : u.name}
          </option>
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Month Picker Row */}
        <div className="max-w-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            Recognition Month *
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Two Columns: Winner and Runner-up */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* WINNER SECTION */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200/80 dark:border-amber-700/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shadow-xs">
                1
              </span>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Winner Details
              </h4>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Winner Full Name *
                </label>
                <input
                  type="text"
                  list="registered-users-list"
                  placeholder="e.g. Prince Victor Solomon"
                  value={winnerName}
                  onChange={(e) => handleWinnerNameChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Photo Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Winner Photo (Microsoft 365 / Teams)
                </label>
                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    {winnerImage ? (
                      <img
                        src={winnerImage}
                        alt="Winner preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl" role="img" aria-label="Trophy">
                        🏆
                      </span>
                    )}
                  </div>

                  {/* Upload / URL controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={winnerFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'winner');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => winnerFileInputRef.current?.click()}
                        disabled={isUploadingWinner}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {isUploadingWinner ? 'Uploading...' : 'Upload Photo'}
                      </button>

                      {winnerImage && (
                        <button
                          type="button"
                          onClick={() => setWinnerImage('')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition-colors"
                          title="Remove custom photo"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste profile image URL..."
                      value={winnerImage}
                      onChange={(e) => setWinnerImage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RUNNER-UP SECTION */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-slate-50/30 dark:from-blue-950/20 dark:to-slate-950/10 border border-blue-200/80 dark:border-blue-700/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs font-black shadow-xs">
                2
              </span>
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                Runner-up Details
              </h4>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Runner-up Full Name *
                </label>
                <input
                  type="text"
                  list="registered-users-list"
                  placeholder="e.g. Bhuvaneshwaran Alagudurai"
                  value={runnerUpName}
                  onChange={(e) => handleRunnerUpNameChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Photo Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Runner-up Photo (Microsoft 365 / Teams)
                </label>
                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    {runnerUpImage ? (
                      <img
                        src={runnerUpImage}
                        alt="Runner-up preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl" role="img" aria-label="Medal">
                        🥈
                      </span>
                    )}
                  </div>

                  {/* Upload / URL controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={runnerUpFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'runnerUp');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => runnerUpFileInputRef.current?.click()}
                        disabled={isUploadingRunnerUp}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {isUploadingRunnerUp ? 'Uploading...' : 'Upload Photo'}
                      </button>

                      {runnerUpImage && (
                        <button
                          type="button"
                          onClick={() => setRunnerUpImage('')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition-colors"
                          title="Remove custom photo"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste profile image URL..."
                      value={runnerUpImage}
                      onChange={(e) => setRunnerUpImage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingWinner || isUploadingRunnerUp}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Entry...
              </>
            ) : (
              'Save Hall of Fame Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
