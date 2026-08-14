import SubmissionForm from '@/components/SubmissionForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewSubmissionPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">


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
