import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SubmissionHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true } }
    }
  });

  if (!submission) {
    redirect('/submissions');
  }

  const userId = session.user ? (session.user as any).id : null;

  if (submission.createdBy !== userId) {
    redirect('/');
  }

  const versions = await prisma.submissionVersion.findMany({
    where: { submissionId: id },
    orderBy: { versionNumber: 'desc' },
    include: {
      attachments: true,
      author: { select: { name: true, email: true } }
    }
  });

  const activeVersion = versions.find((v: any) => v.isActive) || versions[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">


      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          Version History 
          <span className="text-xl text-gray-500 font-normal">({submission.ticketNumber})</span>
        </h1>
        <p className="text-gray-500 mt-2">View all previous edits and updates to this ticket.</p>
      </header>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {versions.map((version, index) => {
          const isLatest = index === 0;
          return (
            <div key={version.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${version.isActive ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  v{version.versionNumber}
                </span>
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {version.isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider border border-indigo-200">CURRENT</span>
                    )}
                    <span className="text-sm text-gray-500 font-medium">
                      {new Date(version.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{version.title}</h3>
                
                <div className="flex items-center text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs mr-2 flex-shrink-0">
                    {version.author?.name?.[0] || 'U'}
                  </div>
                  <span className="truncate">Edited by <strong>{version.author?.name || 'Unknown User'}</strong></span>
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 line-clamp-3">
                  {version.description}
                </div>

                {version.attachments && version.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {version.attachments.length} Attachment{version.attachments.length !== 1 ? 's' : ''}
                    </h4>
                    <div className="space-y-2 mt-3">
                      {version.attachments.map(att => (
                        <div 
                          key={att.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[var(--primary)] hover:shadow-sm transition-all group bg-white"
                        >
                          <div className="w-10 h-10 rounded bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{att.originalFileName}</p>
                            <p className="text-xs text-gray-500">{(Number(att.fileSize) / 1024 / 1024).toFixed(1)} MB • {att.fileType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                          </div>
                          <div className="flex gap-3 text-gray-400 group-hover:text-[var(--primary)] mr-2">
                            {(att.fileType.startsWith('image/') || att.fileType.startsWith('text/') || att.fileType.startsWith('video/') || att.fileType.startsWith('audio/') || att.fileType === 'application/pdf' || att.fileType === 'application/json') && (
                              <a href={`/api/attachments/${att.id}/download?preview=true`} target="_blank" title="Preview" className="hover:text-indigo-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                            )}
                            <a href={`/api/attachments/${att.id}/download`} title="Download" className="hover:text-indigo-900 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
