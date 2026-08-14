'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftActions({ submissionId, versionId }: { submissionId: string, versionId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      if (res.ok) {
        router.push('/submissions');
        router.refresh();
      } else {
        alert('Failed to submit draft');
        setIsSubmitting(false);
      }
    } catch (e) {
      alert('Error submitting draft');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/drafts');
        router.refresh();
      } else {
        alert('Failed to delete draft');
        setIsDeleting(false);
      }
    } catch (e) {
      alert('Error deleting draft');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-3 items-center">
      <button 
        onClick={handleDelete}
        disabled={isDeleting || isSubmitting}
        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>

      <button 
        onClick={() => router.push(`/submissions/${submissionId}/edit`)}
        disabled={isDeleting || isSubmitting}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit
      </button>
      
      <button 
        onClick={handleSubmit}
        disabled={isDeleting || isSubmitting}
        className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {isSubmitting ? 'Submitting...' : 'Submit Draft'}
      </button>
    </div>
  );
}
