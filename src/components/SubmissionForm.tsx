'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState(initialData?.attachments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFetchingAzure, setIsFetchingAzure] = useState(false);
  const [azureSuccessMessage, setAzureSuccessMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFetchAzureTicket = async () => {
    if (!ticketNumber) {
      setError('Please enter a ticket number first.');
      return;
    }

    // Usually ADO tickets are just numbers (e.g., 1234), strip out non-digits just in case
    const numericId = ticketNumber.replace(/\D/g, '');
    if (!numericId) {
      setError('Azure DevOps ticket numbers must contain numeric digits.');
      return;
    }

    setIsFetchingAzure(true);
    setError('');
    setAzureSuccessMessage('');

    try {
      const res = await fetch(`/api/azure/fetch-ticket?ticketNumber=${numericId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch from Azure DevOps.');
      }

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      
      setAzureSuccessMessage(`Successfully fetched details for ticket #${numericId}`);
      setTimeout(() => setAzureSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingAzure(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const isDraft = submitter?.value === 'draft';

    if (!ticketNumber || !title || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload new files if any
      let uploadedAttachments: any[] = [];
      
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || 'Failed to upload files.');
        }

        const uploadData = await uploadRes.json();
        uploadedAttachments = uploadData.attachments;
      }
      
      // 2. Prepare payload for API
      const payload = {
        ticketNumber,
        title,
        description,
        isDraft,
        newAttachments: uploadedAttachments,
        existingAttachments: isEditMode ? existingAttachments : []
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
      router.push(isEditMode ? `/submissions/${initialData!.id}` : `/submissions/${result.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={loading} className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto items-start disabled:opacity-70 transition-opacity">
        <div className="flex-1 space-y-6 w-full">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {azureSuccessMessage && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            {azureSuccessMessage}
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Ticket Details</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ticket Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  disabled={isEditMode}
                  className={`input-field flex-1 ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g. 12345"
                  required
                />
                {!isEditMode && (
                  <button 
                    type="button" 
                    onClick={handleFetchAzureTicket}
                    disabled={isFetchingAzure || !ticketNumber}
                    className="secondary-btn flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 h-[42px]"
                  >
                    {isFetchingAzure ? (
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 13h10v10H2V13zM14 2h8v10h-8V2zM2 2h10v9H2V2zm12 12h8v9h-8v-9z"/>
                      </svg>
                    )}
                    Fetch from Azure
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field" 
                placeholder="Short description of the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[160px] resize-y" 
                placeholder="Provide a detailed description of the issue... You can include steps, observations, expected vs actual behavior, etc."
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {description.length} / 3000 characters
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <Link href={isEditMode ? `/submissions/${initialData!.id}` : '/'} className={`secondary-btn ${loading ? 'pointer-events-none' : ''}`}>
            Cancel
          </Link>
          <div className="flex gap-3">
            <button type="submit" name="action" value="draft" disabled={loading} className="secondary-btn">
              {loading ? 'Processing...' : 'Save as Draft'}
            </button>
            <button type="submit" name="action" value="publish" disabled={loading} className="primary-btn min-w-[150px]">
              {loading ? 'Processing...' : (isEditMode ? 'Save as New Version' : 'Save & Continue')}
            </button>
          </div>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Attachments</h3>
        
        <div 
          className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50'}`}
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          <svg className="w-8 h-8 text-[var(--primary)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-[var(--primary)]">Click to browse or drag and drop</p>
          <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, Images (Max 20MB)</p>
        </div>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {existingAttachments.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Existing Attachments</h4>
            <ul className="space-y-2">
              {existingAttachments.map((att: any, idx: number) => (
                <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700 border border-gray-100">
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate">{att.originalFileName}</span>
                  </div>
                  <button type="button" onClick={() => removeExistingAttachment(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {files.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">New Files</h4>
            <ul className="space-y-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex justify-between items-center bg-indigo-50 p-2 rounded text-sm text-gray-700 border border-indigo-100">
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-4 h-4 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </fieldset>
    </form>
  );
}
