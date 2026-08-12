import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import SubmissionForm from '@/components/SubmissionForm';
import Link from 'next/link';

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: { attachments: true }
      }
    }
  });

  if (!submission) {
    redirect('/submissions');
  }

  const userId = session.user ? (session.user as any).id : null;

  // Verify ownership
  if (submission.createdBy !== userId) {
    redirect('/submissions');
  }

  const currentVersion = submission.versions[0];
  if (!currentVersion) redirect('/');

  const initialData = {
    id: submission.id,
    ticketNumber: submission.ticketNumber,
    title: currentVersion.title,
    description: currentVersion.description,
    attachments: currentVersion.attachments
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href={`/submissions/${submission.id}`} className="hover:text-gray-900 transition-colors">Back to Submission Details</Link>
      </div>

      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Submission</h1>
          <p className="text-gray-500 mt-1">Changes are saved as a new version. Previous versions remain preserved.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
          Currently editing <br/><span className="text-lg font-bold">Version {currentVersion.versionNumber}</span>
        </div>
      </header>

      <main>
        <SubmissionForm initialData={initialData} isEditMode={true} />
      </main>
    </div>
  );
}
