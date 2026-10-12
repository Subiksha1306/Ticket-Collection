import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import WinnersBanner from '@/components/WinnersBanner';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import DataTable, { Column } from '@/components/ui/DataTable';

export default async function Dashboard() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }
  const userId = (session.user as any).id;
  const userIsAdmin = isAdmin(session.user.email);

  const submissions = await prisma.submission.findMany({
    where: userIsAdmin ? undefined : { createdBy: userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      author: true,
      versions: {
        where: { isActive: true },
        take: 1
      }
    }
  });

  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'global' },
    select: { bannerText: true }
  });

  // Table columns matching reference screenshot
  type SubmissionRow = typeof submissions[number];

  const columns: Column<SubmissionRow>[] = [
    {
      key: 'ticketNumber',
      header: 'TICKET',
      render: (sub) => (
        <Link
          href={`/submissions/${sub.id}`}
          className="font-semibold text-[var(--text)] hover:text-[var(--primary)] transition-colors inline-block"
        >
          {sub.ticketNumber}
        </Link>
      ),
    },
    {
      key: 'title',
      header: 'TITLE',
      render: (sub) => {
        const title = sub.versions?.[0]?.title || 'Untitled';
        return (
          <Link
            href={`/submissions/${sub.id}`}
            className="text-[var(--text)] hover:text-[var(--primary)] transition-colors block truncate max-w-xs md:max-w-sm"
            title={title}
          >
            {title}
          </Link>
        );
      },
    },
    {
      key: 'author',
      header: 'SUBMITTED BY',
      render: (sub) => (
        <span className="text-[var(--text-2)]">
          {sub.author?.name || sub.author?.email || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'version',
      header: 'VERSION',
      render: (sub) => (
        <Badge variant="version">
          v{sub.versions?.[0]?.versionNumber || 1}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      header: 'UPDATED',
      render: (sub) => {
        let dateStr = '—';
        if (sub.updatedAt) {
          try {
            dateStr = new Date(sub.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } catch {
            dateStr = '—';
          }
        }
        return (
          <span className="text-[var(--text-2)] whitespace-nowrap">
            {dateStr}
          </span>
        );
      },
    },
  ];

  const firstName = session.user?.name
    ? session.user.name.split(' ')[0]
    : (session.user?.email ? session.user.email.split('@')[0] : 'User');

  return (
    <div className="space-y-6">
      {/* Welcome Heading matching reference */}
      <div>
        <h1 className="text-2xl sm:text-[32px] font-bold text-[var(--text)] tracking-tight leading-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-2)] mt-1 font-normal">
          Here's a quick overview of your recent tickets.
        </p>
      </div>

      {/* Navy Glass Winners Banner */}
      {settings?.bannerText && (
        <WinnersBanner text={settings.bannerText} />
      )}

      {/* Two Action Cards matching reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/submissions/new" className="group block focus:outline-none">
          <GlassCard className="p-6 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-white/70 group-hover:shadow-[0_12px_36px_rgba(44,66,110,0.12)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  Create submission
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
                  Start a new ticket record with details and attachments.
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/submissions" className="group block focus:outline-none">
          <GlassCard className="p-6 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-white/70 group-hover:shadow-[0_12px_36px_rgba(44,66,110,0.12)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#dfe7f5] text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  {userIsAdmin ? 'All submissions' : 'My submissions'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
                  {userIsAdmin ? 'View all records and version history.' : 'View your records and version history.'}
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Recent Submissions Section matching reference */}
      <GlassCard className="p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">
            Recent submissions
          </h2>
          <Link
            href="/submissions"
            className="text-xs sm:text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            View all
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={submissions}
          emptyMessage="No recent submissions found. Create one to get started."
        />
      </GlassCard>
    </div>
  );
}
