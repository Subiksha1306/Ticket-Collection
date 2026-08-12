import SubmissionForm from '@/components/SubmissionForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewSubmissionPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/submissions" className="hover:text-gray-900 transition-colors">My Submissions</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Submission</span>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Submission</h1>
        <p className="text-gray-500 mt-1">Capture the details associated with this ticket.</p>
      </header>

      <main>
        <SubmissionForm />
      </main>
    </div>
  );
}
