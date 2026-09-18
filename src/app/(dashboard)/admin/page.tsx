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
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  const userIsAdmin = isAdmin(session.user.email);
  if (!userIsAdmin) {
    return redirect('/');
  }

  const params = await searchParams;
  const monthParam = params.month;
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (monthParam) {
    const [year, month] = monthParam.split('-');
    startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
  } else {
    const now = new Date();
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const totalSubmissions = await prisma.submission.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage global settings, export data, and configure the Hall of Fame.</p>
      </div>

      {/* Highlights / Live Summary */}
      <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Highlights & Live Summary</h2>
            <p className="text-sm text-gray-500">View ticket submission counts for a specific month.</p>
          </div>
          <AdminMonthPicker />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col justify-center">
            <div className="text-4xl font-black text-indigo-600 mb-2">{totalSubmissions}</div>
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Tickets Submitted</div>
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
