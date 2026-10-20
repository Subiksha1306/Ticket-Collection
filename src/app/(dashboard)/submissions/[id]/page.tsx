import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DraftActions from './DraftActions';

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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

  const userId = (session.user as any)?.id;
  const userIsAdmin = isAdmin(session.user?.email);
  const canEdit = userId === submission.createdBy || userIsAdmin;

  // Filter out unsubmitted drafts if the user is not the creator or admin, but keep historical versions for submitted tickets
  submission.versions = submission.versions.filter(v => !v.isDraft || canEdit || submission.status !== 'Draft');

  const currentVersion = submission.versions[0];
  if (!currentVersion) return <div>No version found.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">


      <header className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{submission.ticketNumber}</h1>
            {currentVersion.isDraft ? (
              <span className="px-2 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800/50">DRAFT • VERSION {currentVersion.versionNumber}</span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/50">VERSION {currentVersion.versionNumber}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {canEdit && currentVersion.isDraft ? (
            <DraftActions submissionId={submission.id} versionId={currentVersion.id} />
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      <div className="flex gap-6 items-start">
        <main className="flex-1 space-y-6">
          <div className="glass-panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-8 mb-6 pb-6 border-b border-white/60 dark:border-white/10">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Created by</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
                   {submission.author?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentVersion.author.name || currentVersion.author.email}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Created Date</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(submission.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Current Version</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">v{currentVersion.versionNumber}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Rubric Score</div>
                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  {submission.score !== null ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
                      {submission.score} / 100
                    </span>
                  ) : (
                    <span className="text-gray-400 font-normal">Pending</span>
                  )}
                </div>
              </div>
            </div>

            {submission.score !== null && (
              <div className="rubric-eval-card mb-8 p-5 rounded-xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-blue-50/70 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-500/25 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                      Rubric Evaluation
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Evaluated against the 6-criterion scoring rubric (100 pts)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 bg-white dark:bg-white/10 px-3 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-400/20 shadow-xs">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{submission.score}</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-400">/ 100</span>
                  </div>
                </div>

                {submission.scoreReason ? (
                  <div className="rubric-reason-box bg-white/90 dark:bg-white/[0.04] p-4 rounded-lg border border-indigo-100/80 dark:border-white/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-300 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Why this score was awarded:
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                      {submission.scoreReason}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                    Score was calculated based on Innovation, Business Impact, Implementation, Evidence, Scalability, and Ownership.
                  </p>
                )}
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-white/[0.04] p-4 rounded-lg border border-gray-100 dark:border-white/10">
                {currentVersion.description}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Attachments ({currentVersion.attachments.length})</h3>
              {currentVersion.attachments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No attachments for this version.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentVersion.attachments.map(att => (
                    <div 
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-[var(--primary)] hover:shadow-sm transition-all group bg-white dark:bg-white/[0.04]"
                    >
                      <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-[var(--primary)] transition-colors">{att.originalFileName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(Number(att.fileSize))} • {att.originalFileName.split('.').pop()?.toUpperCase() || 'FILE'}</p>
                      </div>
                      <div className="flex gap-3 text-gray-400 dark:text-gray-400 group-hover:text-[var(--primary)] mr-2">
                        {(att.fileType.startsWith('image/') || att.fileType.startsWith('text/') || att.fileType.startsWith('video/') || att.fileType.startsWith('audio/') || att.fileType === 'application/pdf' || att.fileType === 'application/json') && (
                          <a href={`/api/attachments/${att.id}/download?preview=true`} target="_blank" title="Preview" className="hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                        )}
                        <a href={`/api/attachments/${att.id}/download`} title="Download" className="hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="w-80 flex-shrink-0">
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Version History</h3>
            </div>
            
            <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-3 space-y-6 pb-4">
              {submission.versions.map((version, idx) => (
                <div key={version.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#0f1828] ${version.isActive ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${version.isActive || version.isDraft ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>v{version.versionNumber}</h4>
                        {version.isActive && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-200 dark:border-indigo-800/50">Current</span>}
                        {version.isDraft && <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase border border-amber-200 dark:border-amber-800/50">Draft</span>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 text-center">
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
