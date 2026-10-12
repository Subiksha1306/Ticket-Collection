import SubmissionForm from '@/components/SubmissionForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NewSubmissionPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      {/* Page Heading matching reference HTML */}
      <div>
        <h1 className="text-2xl sm:text-[34px] font-bold text-[var(--text)] tracking-tight leading-tight">
          New submission
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-2)] mt-1 font-normal">
          Capture the details associated with this ticket.
        </p>
      </div>

      {/* Progress Steps Header matching reference HTML */}
      <div className="flex items-center gap-2.5 font-semibold text-xs sm:text-sm text-[var(--text-2)] flex-wrap select-none">
        <span className="flex items-center gap-2 text-[var(--text)] font-bold">
          <i className="not-italic w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--primary)] text-white shadow-xs">
            1
          </i>
          Details
        </span>
        <hr className="w-8 sm:w-10 border-0 border-t-2 border-white/80" />
        <span className="flex items-center gap-2 text-[var(--text-3)] font-medium">
          <i className="not-italic w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[#dfe7f5] text-[var(--text-2)]">
            2
          </i>
          Review
        </span>
        <hr className="w-8 sm:w-10 border-0 border-t-2 border-white/80" />
        <span className="flex items-center gap-2 text-[var(--text-3)] font-medium">
          <i className="not-italic w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[#dfe7f5] text-[var(--text-2)]">
            3
          </i>
          Submit
        </span>
      </div>

      {/* Submission Form */}
      <main>
        <SubmissionForm />
      </main>
    </div>
  );
}
