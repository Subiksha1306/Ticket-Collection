import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/SettingsForm';
import HallOfFameForm from '@/components/HallOfFameForm';
import ExportForm from '@/components/ExportForm';
import AdminMonthPicker from '@/components/AdminMonthPicker';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  const userIsAdmin = isAdmin(session.user.email);
  if (!userIsAdmin) {
    return redirect('/');
  }

  // Calculate selected month bounds
  const monthParam = searchParams.month;
  let startOfMonth: Date;
  let endOfMonth: Date;
  let displayMonth: string;

  if (monthParam) {
    const [year, month] = monthParam.split('-');
    startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    displayMonth = startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else {
    const now = new Date();
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    displayMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Fetch live summary data
  const totalSubmissionsThisMonth = await prisma.submission.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const totalAttachmentsThisMonth = await prisma.attachment.count({
    where: {
      uploadedAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const userTicketCounts = await prisma.submission.groupBy({
    by: ['createdBy'],
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    _count: {
      id: true
    }
  });

  const uniqueContributorsThisMonth = userTicketCounts.length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage global settings, export data, and configure the Hall of Fame.</p>
      </div>

      {/* Live Summary Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Live Summary - {displayMonth}
          </h2>
          <AdminMonthPicker />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-gray-900">{totalSubmissionsThisMonth}</span>
            <span className="text-sm text-gray-500 mt-1">Tickets Submitted</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-gray-900">{uniqueContributorsThisMonth}</span>
            <span className="text-sm text-gray-500 mt-1">Active Contributors</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-gray-900">{totalAttachmentsThisMonth}</span>
            <span className="text-sm text-gray-500 mt-1">Files Attached</span>
          </div>
        </div>
      </section>

      {/* Hall of Fame Management */}
      <section>
        <HallOfFameForm />
      </section>

      {/* Settings & Export */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <SettingsForm />
        <ExportForm />
      </section>

    </div>
  );
}
