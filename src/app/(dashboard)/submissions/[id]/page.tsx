import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SubmissionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
          attachments: true,
          author: { select: { name: true, email: true } }
        }
      },
      author: { select: { name: true, email: true } }
    }
  });

  if (!submission) {
    redirect('/');
  }

  const currentVersion = submission.versions.find(v => v.isActive) || submission.versions[0];
  if (!currentVersion) return <div>No active version found.</div>;

  const canEdit = (session.user as any)?.id === submission.createdBy;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/submissions" className="hover:text-gray-900 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Submissions
        </Link>
      </div>

      <header className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{submission.ticketNumber}</h1>
            <span className="badge-active">ACTIVE • VERSION {currentVersion.versionNumber}</span>
          </div>
        </div>
        <div className="flex gap-3">
          {canEdit && (
            <Link href={`/submissions/${submission.id}/edit`} className="secondary-btn flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </Link>
          )}
          <button className="secondary-btn flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex gap-6 items-start">
        <main className="flex-1 space-y-6">
          <div className="card">
            <div className="flex items-center gap-8 mb-6 pb-6 border-b border-gray-100">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Created by</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                   {submission.author?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{currentVersion.author.name || currentVersion.author.email}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Last Updated</div>
                <div className="text-sm font-medium text-gray-900">{new Date(currentVersion.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Current Version</div>
                <div className="text-sm font-medium text-gray-900">v{currentVersion.versionNumber}</div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                {currentVersion.description}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Attachments ({currentVersion.attachments.length})</h3>
              {currentVersion.attachments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No attachments for this version.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentVersion.attachments.map(att => (
                    <a 
                      key={att.id}
                      href={`/api/attachments/${att.id}/download`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[var(--primary)] hover:shadow-sm transition-all group bg-white"
                    >
                      <div className="w-10 h-10 rounded bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{att.originalFileName}</p>
                        <p className="text-xs text-gray-500">{(att.fileSize / 1024 / 1024).toFixed(1)} MB • {att.fileType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                      </div>
                      <div className="text-gray-400 group-hover:text-[var(--primary)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="w-80 flex-shrink-0">
          <div className="card bg-white p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Version History</h3>
            </div>
            
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
              {submission.versions.map((version, idx) => (
                <div key={version.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${version.isActive ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${version.isActive ? 'text-gray-900' : 'text-gray-600'}`}>v{version.versionNumber}</h4>
                        {version.isActive && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">Current</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(version.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    {!version.isActive && (
                      <Link href={`/submissions/${submission.id}/history?v=${version.id}`} className="text-xs font-semibold text-[var(--primary)] hover:underline">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <Link href={`/submissions/${submission.id}/history`} className="text-sm font-semibold text-[var(--primary)] hover:underline flex items-center justify-center gap-1">
                View full history
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
