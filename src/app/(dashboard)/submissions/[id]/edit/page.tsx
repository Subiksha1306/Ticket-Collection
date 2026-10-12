import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import SubmissionForm from '@/components/SubmissionForm';
import Badge from '@/components/ui/Badge';

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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[34px] font-bold text-[var(--text)] tracking-tight leading-tight">
            Edit submission
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-2)] mt-1 font-normal">
            Changes are saved as a new version. Previous versions remain preserved.
          </p>
        </div>
        <div className="bg-[#dfe7f5]/80 border border-white/85 text-[var(--primary)] px-4 py-2 rounded-[16px] text-xs sm:text-sm font-semibold shadow-xs self-start sm:self-auto">
          Currently editing <span className="font-extrabold text-[var(--text)]">Version {currentVersion.versionNumber}</span>
        </div>
      </header>

      <main>
        <SubmissionForm initialData={initialData} isEditMode={true} />
      </main>
    </div>
  );
}
