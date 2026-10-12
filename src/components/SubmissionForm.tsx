'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';

type SubmissionFormProps = {
  initialData?: {
    id: string;
    ticketNumber: string;
    title: string;
    description: string;
    attachments: any[];
  };
  isEditMode?: boolean;
};

export default function SubmissionForm({ initialData, isEditMode = false }: SubmissionFormProps) {
  const [ticketNumber, setTicketNumber] = useState(initialData?.ticketNumber || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState(initialData?.attachments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isFetchingAzure, setIsFetchingAzure] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const getFileExt = (fileName: string) => {
    return fileName.split('.').pop()?.slice(0, 4).toUpperCase() || 'FILE';
  };

  // Real-time validation
  const validateField = (field: string, val: string) => {
    const trimmed = val.trim();
    if (field === 'ticketNumber') {
      if (!trimmed) return 'Enter the ticket number.';
      if (!/^\d+$/.test(trimmed)) return 'Use digits only, like 12345.';
    }
    if (field === 'title') {
      if (!trimmed) return 'Add a short title.';
      if (trimmed.length < 5) return 'Make the title at least 5 characters.';
    }
    if (field === 'description') {
      if (!trimmed) return 'Describe the issue.';
      if (trimmed.length < 20) return 'Add a little more detail (at least 20 characters).';
    }
    return '';
  };

  const handleBlur = (field: string, val: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, val);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: string, val: string) => {
    if (field === 'ticketNumber') setTicketNumber(val);
    if (field === 'title') setTitle(val);
    if (field === 'description') setDescription(val);

    if (touched[field]) {
      const err = validateField(field, val);
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const isFormValid =
    ticketNumber.trim().length > 0 &&
    !validateField('ticketNumber', ticketNumber) &&
    title.trim().length >= 5 &&
    description.trim().length >= 20;

  // Azure DevOps ticket auto-fetching
  const handleFetchAzureTicket = async () => {
    if (!ticketNumber) {
      setTouched(prev => ({ ...prev, ticketNumber: true }));
      setFieldErrors(prev => ({ ...prev, ticketNumber: 'Enter the ticket number.' }));
      return;
    }

    const numericId = ticketNumber.replace(/\D/g, '');
    if (!numericId) {
      setFieldErrors(prev => ({ ...prev, ticketNumber: 'Use digits only, like 12345.' }));
      return;
    }

    setIsFetchingAzure(true);
    setError('');

    try {
      const res = await fetch(`/api/azure/fetch-ticket?ticketNumber=${numericId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch from Azure DevOps.');
      }

      if (data.title) {
        setTitle(data.title);
        setTouched(prev => ({ ...prev, title: true }));
        setFieldErrors(prev => ({ ...prev, title: '' }));
      }
      if (data.description) {
        setDescription(data.description);
        setTouched(prev => ({ ...prev, description: true }));
        setFieldErrors(prev => ({ ...prev, description: '' }));
      }

      showToast(`Details filled from Azure ticket #${numericId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ticket.');
    } finally {
      setIsFetchingAzure(false);
    }
  };

  // Attachments Handling
  const handleFileSelection = (selectedFiles: FileList | File[]) => {
    const MAX_SIZE = 20 * 1024 * 1024;
    const allowedExtensions = /\.(pdf|docx?|png|jpe?g|gif|webp)$/i;
    const newFiles: File[] = [];

    Array.from(selectedFiles).forEach(file => {
      if (!allowedExtensions.test(file.name)) {
        showToast(`"${file.name}" isn't supported. Use PDF, DOC, DOCX, or an image.`);
      } else if (file.size > MAX_SIZE) {
        showToast(`"${file.name}" is over 20 MB. Choose a smaller file.`);
      } else if (!files.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    });

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const isDraft = submitter?.value === 'draft';

    // In draft mode, we allow partial data; in publish mode, require all
    if (!isDraft && (!ticketNumber || !title || !description)) {
      setTouched({ ticketNumber: true, title: true, description: true });
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let uploadedAttachments: any[] = [];

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || 'Failed to upload attachments.');
        }

        const uploadData = await uploadRes.json();
        uploadedAttachments = uploadData.attachments;
      }

      const payload = {
        ticketNumber,
        title,
        description,
        isDraft,
        newAttachments: uploadedAttachments,
        existingAttachments: isEditMode ? existingAttachments : [],
      };

      const url = isEditMode
        ? `/api/submissions/${initialData!.id}/versions`
        : `/api/submissions`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const result = await res.json();
      if (isDraft) {
        showToast('Draft saved successfully');
        router.push('/drafts');
      } else {
        router.push(isEditMode ? `/submissions/${initialData!.id}` : `/submissions/${result.id}`);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={loading} className="disabled:opacity-80 transition-opacity">
          {/* Main 2-Column Layout matching reference HTML */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
            
            {/* Left Panel: Ticket details */}
            <GlassCard className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[var(--text)] tracking-tight mb-5">
                Ticket details
              </h2>

              {/* Global Error Banner if any */}
              {error && (
                <div className="mb-5 p-3.5 rounded-[14px] bg-rose-50/90 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Field 1: Ticket number */}
                <div>
                  <label htmlFor="num" className="flex items-center justify-between font-bold text-sm text-[var(--text)] mb-2">
                    <span>
                      Ticket number <span className="text-rose-500 font-bold">*</span>
                    </span>
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      id="num"
                      type="text"
                      inputMode="numeric"
                      value={ticketNumber}
                      disabled={isEditMode}
                      onChange={(e) => handleChange('ticketNumber', e.target.value)}
                      onBlur={(e) => handleBlur('ticketNumber', e.target.value)}
                      placeholder="e.g. 12345"
                      autoComplete="off"
                      className={`flex-1 w-full bg-white/70 border ${
                        fieldErrors.ticketNumber ? 'border-rose-400 focus:ring-rose-200' : 'border-white/90 focus:border-[var(--primary)]'
                      } rounded-[14px] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-3)] shadow-xs transition-all focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/20 ${
                        isEditMode ? 'bg-gray-100/70 cursor-not-allowed text-gray-500' : ''
                      }`}
                    />
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={handleFetchAzureTicket}
                        disabled={isFetchingAzure || !ticketNumber.trim()}
                        className="flex-none inline-flex items-center gap-2 px-4 py-3 rounded-[14px] font-bold text-xs sm:text-sm bg-[#dfe7f5] text-[var(--primary)] border border-white/80 hover:border-[var(--primary)] shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                        title="Fetch title and description from Azure DevOps"
                      >
                        {isFetchingAzure ? (
                          <svg className="animate-spin w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          /* Microsoft Azure 4-square icon */
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M0 0h7.5v7.5H0zM8.5 0H16v7.5H8.5zM0 8.5h7.5V16H0zM8.5 8.5H16V16H8.5z" />
                          </svg>
                        )}
                        <span>{isFetchingAzure ? 'Fetching…' : 'Fetch from Azure'}</span>
                      </button>
                    )}
                  </div>
                  {fieldErrors.ticketNumber && (
                    <p className="text-xs font-semibold text-rose-600 mt-1.5">{fieldErrors.ticketNumber}</p>
                  )}
                  <p className="text-xs text-[var(--text-3)] mt-1.5 font-normal">
                    Enter the number and fetch to fill in the title and description automatically.
                  </p>
                </div>

                {/* Field 2: Title */}
                <div>
                  <div className="flex items-center justify-between font-bold text-sm text-[var(--text)] mb-2">
                    <label htmlFor="ttl">
                      Title <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-xs text-[var(--text-3)] font-normal tabular-nums">
                      {title.length} / 120
                    </span>
                  </div>
                  <input
                    id="ttl"
                    type="text"
                    maxLength={120}
                    value={title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    onBlur={(e) => handleBlur('title', e.target.value)}
                    placeholder="Short summary of the issue"
                    autoComplete="off"
                    className={`w-full bg-white/70 border ${
                      fieldErrors.title ? 'border-rose-400 focus:ring-rose-200' : 'border-white/90 focus:border-[var(--primary)]'
                    } rounded-[14px] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-3)] shadow-xs transition-all focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/20`}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs font-semibold text-rose-600 mt-1.5">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Field 3: Priority (Segmented Radio) */}
                <div>
                  <div className="flex items-center justify-between font-bold text-sm text-[var(--text)] mb-2">
                    <span>Priority</span>
                    <span className="text-xs text-[var(--text-3)] font-normal">Optional</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Priority">
                    {(['High', 'Medium', 'Low'] as const).map((p) => {
                      const isSelected = priority === p;
                      const dotColor =
                        p === 'High' ? 'bg-[#e5484d]' : p === 'Medium' ? 'bg-[#f5a524]' : 'bg-[#22c58b]';
                      return (
                        <button
                          key={p}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setPriority(p)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                            isSelected
                              ? 'bg-[#dfe7f5] text-[var(--primary)] border-[var(--primary)] shadow-xs'
                              : 'bg-white/70 text-[var(--text)] border-white/80 hover:bg-white'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                          <span>{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field 4: Description */}
                <div>
                  <label htmlFor="dsc" className="flex items-center justify-between font-bold text-sm text-[var(--text)] mb-2">
                    <span>
                      Description <span className="text-rose-500 font-bold">*</span>
                    </span>
                  </label>
                  <textarea
                    id="dsc"
                    maxLength={3000}
                    value={description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    onBlur={(e) => handleBlur('description', e.target.value)}
                    placeholder="What happened? Include the steps to reproduce, what you observed, and what you expected instead."
                    className={`w-full min-h-[190px] resize-y bg-white/70 border ${
                      fieldErrors.description ? 'border-rose-400 focus:ring-rose-200' : 'border-white/90 focus:border-[var(--primary)]'
                    } rounded-[14px] p-4 text-sm text-[var(--text)] placeholder-[var(--text-3)] shadow-xs transition-all focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/20 leading-relaxed`}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    {fieldErrors.description ? (
                      <p className="text-xs font-semibold text-rose-600">{fieldErrors.description}</p>
                    ) : <span />}
                    <span className={`text-xs tabular-nums ${description.length > 2800 ? 'text-rose-600 font-bold' : 'text-[var(--text-3)]'}`}>
                      {description.length} / 3000 characters
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Right Panel: Attachments */}
            <GlassCard className="p-6 sm:p-7">
              <h2 className="text-xl font-bold text-[var(--text)] tracking-tight mb-4">
                Attachments
              </h2>

              {/* Drag & Drop Upload Tile */}
              <div
                className={`border-2 border-dashed rounded-[22px] p-6 text-center transition-all cursor-pointer select-none ${
                  isDragOver
                    ? 'border-[var(--primary)] bg-[#dfe7f5]/60 scale-[1.01]'
                    : 'border-white/80 bg-white/50 hover:bg-[#dfe7f5]/40 hover:border-[var(--primary)]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) handleFileSelection(e.dataTransfer.files);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload files dropzone"
              >
                <div className="w-12 h-12 rounded-[16px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <b className="block text-sm font-bold text-[var(--primary)] mb-1">
                  Click to browse or drag and drop
                </b>
                <small className="block text-xs text-[var(--text-2)] font-normal">
                  PDF, DOC, DOCX, images · max 20 MB each
                </small>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
              />

              {/* Existing Attachments (if editing) */}
              {existingAttachments.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2.5">
                    Existing Attachments
                  </p>
                  <ul className="space-y-2">
                    {existingAttachments.map((att: any, idx: number) => (
                      <li
                        key={`exist-${idx}`}
                        className="flex items-center gap-3 p-2.5 rounded-[14px] bg-white/70 border border-white/80 shadow-xs"
                      >
                        <span className="w-9 h-9 rounded-[10px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                          {getFileExt(att.originalFileName)}
                        </span>
                        <div className="flex-1 min-w-0 leading-tight">
                          <p className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate">
                            {att.originalFileName}
                          </p>
                          <span className="text-[11px] text-[var(--text-3)]">Existing</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(idx)}
                          className="w-7 h-7 rounded-full text-[var(--text-3)] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          aria-label={`Remove ${att.originalFileName}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New Files List */}
              {files.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2.5">
                    Selected Files ({files.length})
                  </p>
                  <ul className="space-y-2">
                    {files.map((file, idx) => (
                      <li
                        key={`file-${idx}`}
                        className="flex items-center gap-3 p-2.5 rounded-[14px] bg-white/70 border border-white/80 shadow-xs"
                      >
                        <span className="w-9 h-9 rounded-[10px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                          {getFileExt(file.name)}
                        </span>
                        <div className="flex-1 min-w-0 leading-tight">
                          <p className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate">
                            {file.name}
                          </p>
                          <span className="text-[11px] text-[var(--text-3)]">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="w-7 h-7 rounded-full text-[var(--text-3)] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Sticky Bottom Action Capsule Bar matching reference HTML */}
          <div className="sticky bottom-4 z-20 mt-6 flex items-center gap-2 sm:gap-3 p-2 sm:px-4 rounded-full bg-white/80 backdrop-blur-[18px] border border-white/85 shadow-[0_8px_32px_rgba(38,57,107,0.18)] flex-wrap">
            <Link
              href={isEditMode ? `/submissions/${initialData!.id}` : '/'}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-[var(--text-2)] hover:text-[var(--text)] hover:bg-white/50 transition-colors"
            >
              Cancel
            </Link>

            <span className="flex-1 text-xs sm:text-sm text-[var(--text-2)] hidden md:inline truncate pl-2">
              {isFormValid ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Looks good. You can continue.
                </span>
              ) : (
                'Complete the required fields to continue.'
              )}
            </span>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <button
                type="submit"
                name="action"
                value="draft"
                disabled={loading}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-[var(--primary)] bg-white/90 border border-[var(--primary)]/40 hover:border-[var(--primary)] hover:bg-white transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save as draft'}
              </button>

              <button
                type="submit"
                name="action"
                value="publish"
                disabled={loading || !isFormValid}
                className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_4px_14px_rgba(61,90,140,0.35)] transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              >
                {loading
                  ? 'Saving…'
                  : isEditMode
                  ? 'Save as New Version'
                  : 'Save and continue'}
              </button>
            </div>
          </div>
        </fieldset>
      </form>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-[var(--navy-glass)] text-white text-xs sm:text-sm font-bold backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage}
        </div>
      )}
    </>
  );
}
