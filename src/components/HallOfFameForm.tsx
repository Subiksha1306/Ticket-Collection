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

  // Helper to match a user from registeredUsers by exact, normalized, or partial name
  const findMatchingUserImage = (inputName: string): string | null => {
    if (!inputName || !inputName.trim()) return null;
    const clean = inputName.toLowerCase().trim();
    const normalized = clean.replace(/[^a-z0-9]/g, '');

    // 1. Exact match
    const exact = registeredUsers.find((u) => u.name && u.name.toLowerCase().trim() === clean);
    if (exact?.image) return exact.image;

    // 2. Normalized match (ignoring spaces / special chars)
    const normMatch = registeredUsers.find(
      (u) => u.name && u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
    );
    if (normMatch?.image) return normMatch.image;

    // 3. Partial substring match (e.g. "Bhuvan" matches "Bhuvaneshwaran Alagudurai")
    if (normalized.length >= 3) {
      const partial = registeredUsers.find((u) => {
        if (!u.name) return false;
        const uNorm = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return uNorm.includes(normalized) || normalized.includes(uNorm);
      });
      if (partial?.image) return partial.image;
    }

    return null;
  };

  // When winner name changes, check if a registered user matches to suggest their photo
  const handleWinnerNameChange = (name: string) => {
    setWinnerName(name);
    const matchedPhoto = findMatchingUserImage(name);
    if (matchedPhoto) {
      setWinnerImage(matchedPhoto);
    }
  };

  // When runner up name changes, check if a registered user matches to suggest their photo
  const handleRunnerUpNameChange = (name: string) => {
    setRunnerUpName(name);
    const matchedPhoto = findMatchingUserImage(name);
    if (matchedPhoto) {
      setRunnerUpImage(matchedPhoto);
    }
  };

// Helper to convert any selected image file to an optimized, lightweight Base64 Data URL
function fileToBase64(file: File, maxDim = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl); // fallback to raw data url if decode fails
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// File upload handler using /api/upload with automatic Base64 fallback
  const handleFileUpload = async (file: File, type: 'winner' | 'runnerUp') => {
    const isWinner = type === 'winner';
    if (isWinner) setIsUploadingWinner(true);
    else setIsUploadingRunnerUp(true);

    try {
      // 1. Try uploading to /api/upload first
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attachments && data.attachments[0]?.storagePath) {
          const url = data.attachments[0].storagePath;
          if (isWinner) {
            setWinnerImage(url);
          } else {
            setRunnerUpImage(url);
          }
          return;
        }
      }

      // 2. Fall back seamlessly to client-side Base64 compression
      const base64Url = await fileToBase64(file);
      if (isWinner) {
        setWinnerImage(base64Url);
      } else {
        setRunnerUpImage(base64Url);
      }
    } catch (error) {
      console.warn('Upload error, attempting client-side base64 fallback:', error);
      try {
        const base64Url = await fileToBase64(file);
        if (isWinner) {
          setWinnerImage(base64Url);
        } else {
          setRunnerUpImage(base64Url);
        }
      } catch (fallbackError) {
        console.error('Photo upload error:', fallbackError);
        alert('Failed to process image file. You can also paste an image URL directly.');
      }
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

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getMonthName = (monthNum: number) => {
    const date = new Date(2000, monthNum - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const sortedEntries = [...existingEntries].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  const currentMonthEntry = month
    ? existingEntries.find((e) => `${e.year}-${String(e.month).padStart(2, '0')}` === month)
    : null;

  const handleSelectEntryToEdit = (entry: HallOfFameEntry) => {
    const monthStr = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
    setMonth(monthStr);
    setWinnerName(entry.winnerName || '');
    setRunnerUpName(entry.runnerUpName || '');
    setWinnerImage(entry.winnerImage || '');
    setRunnerUpImage(entry.runnerUpImage || '');
    setHistoryModalOpen(false);
  };

  const handleClearMonth = async (entry: HallOfFameEntry) => {
    const label = `${getMonthName(entry.month)} ${entry.year}`;
    if (
      !confirm(
        `Are you sure you want to clear the Hall of Fame record for ${label}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(entry.id);
      const res = await fetch(`/api/hall-of-fame?id=${entry.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      setExistingEntries((prev) => prev.filter((e) => e.id !== entry.id));

      const currentMonthKey = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
      if (month === currentMonthKey) {
        setWinnerName('');
        setWinnerImage('');
        setRunnerUpName('');
        setRunnerUpImage('');
      }

      router.refresh();
      alert(`Hall of Fame record for ${label} cleared successfully!`);
    } catch (error) {
      console.error(error);
      alert('Failed to delete month record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        'Are you sure you want to completely erase ALL Hall of Fame history? This will delete all monthly records and cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/hall-of-fame?all=true', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete all');

      setExistingEntries([]);
      setMonth('');
      setWinnerName('');
      setWinnerImage('');
      setRunnerUpName('');
      setRunnerUpImage('');
      setHistoryModalOpen(false);
      router.refresh();
      alert('All Hall of Fame history erased successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to erase history.');
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-7 mb-8 transition-colors">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/60 dark:border-white/10">
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
          onClick={() => setHistoryModalOpen(true)}
          className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 px-3.5 py-1.5 rounded-lg transition-colors border border-slate-200/90 dark:border-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>History</span>
          {existingEntries.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-[10px] font-bold">
              {existingEntries.length} {existingEntries.length === 1 ? 'month' : 'months'}
            </span>
          )}
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
        {/* Month Picker Row with Clear This Month shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="max-w-xs flex-1">
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

          {currentMonthEntry && (
            <div className="flex items-center gap-2 pb-1">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5">
                <span>✓</span> Existing record loaded
              </span>
              <button
                type="button"
                onClick={() => handleClearMonth(currentMonthEntry)}
                disabled={deletingId === currentMonthEntry.id}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{deletingId === currentMonthEntry.id ? 'Clearing...' : 'Clear This Month'}</span>
              </button>
            </div>
          )}
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
                      type="text"
                      placeholder="Or paste profile image URL / Base64..."
                      value={winnerImage}
                      onChange={(e) => setWinnerImage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {winnerImage.includes('teams.microsoft.com') && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Teams internal links require Microsoft authentication and will not load. Please click &quot;Upload Photo&quot; to select the photo file directly.
                      </p>
                    )}
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
                      type="text"
                      placeholder="Or paste profile image URL / Base64..."
                      value={runnerUpImage}
                      onChange={(e) => setRunnerUpImage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {runnerUpImage.includes('teams.microsoft.com') && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                        ⚠️ Teams internal links require Microsoft authentication and will not load. Please click &quot;Upload Photo&quot; to select the photo file directly.
                      </p>
                    )}
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

      {/* History Modal */}
      {historyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🏆</span> Hall of Fame History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a month to load in form, or clear history for a specific month.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Months List */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
              {sortedEntries.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No records found</p>
                  <p className="text-xs mt-1">Add monthly winners using the form to build the Hall of Fame.</p>
                </div>
              ) : (
                sortedEntries.map((entry) => {
                  const monthName = getMonthName(entry.month);
                  const isDeleting = deletingId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/50">
                            {monthName} {entry.year}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {/* Winner preview */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {entry.winnerImage ? (
                              <img
                                src={entry.winnerImage}
                                alt={entry.winnerName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-amber-300 shadow-xs"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-200">
                                🥇
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">Winner</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.winnerName}</p>
                            </div>
                          </div>

                          {/* Runner-up preview */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {entry.runnerUpImage ? (
                              <img
                                src={entry.runnerUpImage}
                                alt={entry.runnerUpName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-300 shadow-xs"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                                🥈
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Runner-up</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.runnerUpName}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions for this month */}
                      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleSelectEntryToEdit(entry)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                        >
                          Load in Form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearMonth(entry)}
                          disabled={isDeleting}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200/80 dark:border-red-900/50 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{isDeleting ? 'Clearing...' : 'Clear Month'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
              {sortedEntries.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Clear All Months
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
