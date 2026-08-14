import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import SearchInput from '@/components/SearchInput';

export default async function MySubmissionsPage(props: {
  searchParams?: Promise<{ q?: string }> | { q?: string };
}) {
  const session = await getSession();
  if (!session || !session.user) return null;

  const userIsAdmin = isAdmin(session.user.email);
  const userId = (session.user as any).id;

  // Await searchParams in case it's a Promise (Next.js 15+)
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const q = resolvedParams?.q || '';

  const whereClause: any = userIsAdmin ? {} : { createdBy: userId };
  if (q) {
    whereClause.OR = [
      { ticketNumber: { contains: q, mode: 'insensitive' } },
      { versions: { some: { title: { contains: q, mode: 'insensitive' } } } }
    ];
  }

  let submissions = await prisma.submission.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: {
      author: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1
      }
    }
  });

  // Filter out submissions where the latest version is a draft
  submissions = submissions.filter(sub => {
    const latestVersion = sub.versions[0];
    return latestVersion && !latestVersion.isDraft;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userIsAdmin ? 'All Submissions (Admin)' : 'My Submissions'}
          </h1>
          <p className="text-gray-500 mt-1">View and manage the records you've submitted.</p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="w-full">
              <SearchInput initialValue={q} />
            </div>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              {userIsAdmin && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted By</th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                  No submissions found.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => {
                const currentVersion = sub.versions[0];
                if (!currentVersion) return null;
                
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sub.ticketNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-[250px]">
                      {currentVersion.title}
                    </td>
                    {userIsAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.author?.name || sub.author?.email || 'Unknown'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{currentVersion.versionNumber} {currentVersion.isDraft && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-medium border border-amber-200">Draft</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/submissions/${sub.id}`} className="text-[var(--primary)] hover:text-[var(--primary-hover)] inline-flex items-center gap-1">
                        View Details
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
