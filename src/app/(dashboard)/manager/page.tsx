import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ManagerMonthPicker from '@/components/ManagerMonthPicker';
import { prisma } from '@/lib/db';

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) return redirect('/login');
  if (!isAdmin(session.user.email)) return redirect('/');

  const params = await searchParams;
  const monthParam = params.month;
  let startOfMonth: Date;
  let endOfMonth: Date;

  const now = new Date();
  
  if (monthParam) {
    const [year, month] = monthParam.split('-');
    startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const pipelineData = await prisma.submission.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth }
    },
    _count: { id: true }
  });

  const getStatusCount = (statusName: string) => {
    return pipelineData.find(p => p.status === statusName)?._count.id || 0;
  };

  const countSubmitted = getStatusCount('Submitted');
  const countUnderReview = getStatusCount('Under Review');
  const countApproved = getStatusCount('Approved');
  const countImplemented = getStatusCount('Implemented');
  const countImpactVerified = getStatusCount('Impact Verified');

  const pendingSubmissions = await prisma.submission.findMany({
    where: {
      status: 'Under Review',
    },
    include: {
      author: true,
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Calculate overdue (older than 7 days)
  const overdueCount = pendingSubmissions.filter(s => {
    const ageDays = Math.floor((now.getTime() - s.createdAt.getTime()) / (1000 * 3600 * 24));
    return ageDays >= 7;
  }).length;

  const implementationRate = countApproved > 0 ? Math.round((countImplemented / countApproved) * 100) : 0;
  const impactVerifiedRate = countImplemented > 0 ? Math.round((countImpactVerified / countImplemented) * 100) : 0;

  const funnelRows = [
    { label: 'Submitted', value: countSubmitted, color: 'bg-blue-200' },
    { label: 'Reviewed', value: countUnderReview, color: 'bg-blue-200' },
    { label: 'Approved', value: countApproved, color: 'bg-blue-200' },
    { label: 'Implemented', value: countImplemented, color: 'bg-green-200' },
    { label: 'Verified', value: countImpactVerified, color: 'bg-green-200' },
  ];
  const maxFunnel = Math.max(...funnelRows.map(r => r.value), 1);

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview and review queue.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ManagerMonthPicker />
          <a href={`/api/export?month=${monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}`} className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            Export report
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[15px] font-medium text-gray-700">Awaiting my review</h3>
          <div className="text-3xl font-bold text-gray-900 mt-2">{pendingSubmissions.length}</div>
          <div className="text-[13px] text-red-600 mt-1 font-medium">{overdueCount} overdue</div>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[15px] font-medium text-gray-700">Avg. time to decision</h3>
          <div className="text-3xl font-bold text-gray-900 mt-2">4.2 days</div>
          <div className="text-[13px] text-green-600 mt-1 font-medium">down 1.1 vs last month</div>
        </div>
        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[15px] font-medium text-gray-700">Implementation rate</h3>
          <div className="text-3xl font-bold text-gray-900 mt-2">{implementationRate}%</div>
          <div className="text-[13px] text-gray-500 mt-1 font-medium">{countImplemented} of {countApproved} approved</div>
        </div>
        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[15px] font-medium text-gray-700">Impact verified</h3>
          <div className="text-3xl font-bold text-gray-900 mt-2">{impactVerifiedRate}%</div>
          <div className="text-[13px] text-gray-500 mt-1 font-medium">{countImpactVerified} of {countImplemented} implemented</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-gray-900 mb-6">Pipeline with drop-off</h3>
          <div className="flex-1 flex flex-col justify-center">
            {funnelRows.map(row => (
              <div key={row.label} className="flex items-center gap-3 mb-3 text-sm">
                <div className="w-24 text-gray-700 font-medium">{row.label}</div>
                <div className="flex-1 h-7 bg-gray-50 rounded-sm overflow-hidden flex items-center">
                  <div className={`h-full ${row.color} transition-all`} style={{ width: `${(row.value / maxFunnel) * 100}%` }}></div>
                </div>
                <div className="w-6 text-right font-semibold text-gray-900">{row.value}</div>
              </div>
            ))}
          </div>
          <div className="text-[13px] text-gray-400 mt-4">Click a stage to filter the queue</div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-gray-900 mb-6">Submissions per month, by category</h3>
          <div className="flex-1 flex items-end justify-around relative px-4 pt-4 pb-8 min-h-[160px]">
            {/* Dummy bars matching the mockup design roughly */}
            <div className="flex flex-col items-center gap-2 w-20 h-full justify-end relative z-10">
              <div className="w-full flex flex-col-reverse h-[60%]">
                <div className="w-full h-[40%] bg-blue-200"></div>
                <div className="w-full h-[30%] bg-green-200"></div>
                <div className="w-full h-[30%] bg-[#fde68a]"></div>
              </div>
              <div className="absolute -bottom-6 text-sm text-gray-600 font-medium">Jun</div>
            </div>
            <div className="flex flex-col items-center gap-2 w-20 h-full justify-end relative z-10">
              <div className="w-full flex flex-col-reverse h-[80%]">
                <div className="w-full h-[35%] bg-blue-200"></div>
                <div className="w-full h-[45%] bg-green-200"></div>
                <div className="w-full h-[20%] bg-[#fde68a]"></div>
              </div>
              <div className="absolute -bottom-6 text-sm text-gray-600 font-medium">Jul</div>
            </div>
            <div className="flex flex-col items-center gap-2 w-20 h-full justify-end relative z-10">
              <div className="w-full flex flex-col-reverse h-[100%]">
                <div className="w-full h-[50%] bg-blue-200"></div>
                <div className="w-full h-[30%] bg-green-200"></div>
                <div className="w-full h-[20%] bg-[#fde68a]"></div>
              </div>
              <div className="absolute -bottom-6 text-sm text-gray-600 font-medium">Aug</div>
            </div>
            
            {/* Axis line */}
            <div className="absolute bottom-6 left-0 right-0 h-px bg-gray-200 z-0"></div>
          </div>
          <div className="text-[13px] text-gray-400 mt-2">Plus top contributors and departments</div>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-gray-900">Review queue</h3>
          <div className="flex items-center gap-2 text-sm font-medium">
            <button className="px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 transition-colors">All</button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">Overdue</button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">High impact</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-medium text-gray-500 w-24">Ticket</th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-medium text-gray-500">Title</th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-medium text-gray-500 w-32">Employee</th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-medium text-gray-500 w-24">Age</th>
                <th scope="col" className="px-6 py-4 text-right text-[14px] font-medium text-gray-500 w-36">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No submissions currently pending review.
                  </td>
                </tr>
              ) : (
                pendingSubmissions.map((submission) => {
                  const ageDays = Math.max(1, Math.floor((now.getTime() - submission.createdAt.getTime()) / (1000 * 3600 * 24)));
                  const isOverdue = ageDays >= 7;
                  let employeeName = 'Unknown';
                  if (submission.author?.name) {
                    const parts = submission.author.name.split(' ');
                    employeeName = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
                  }
                  
                  return (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-semibold text-gray-900">{submission.ticketNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-semibold text-gray-900">
                        {submission.versions[0]?.title || 'Untitled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-gray-700">{employeeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[13px] font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {ageDays} d
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/submissions/${submission.id}`} className="px-3 py-1 rounded-md bg-green-100 text-green-700 text-[13px] font-semibold hover:bg-green-200 transition-colors">
                            Approve
                          </Link>
                          <Link href={`/submissions/${submission.id}`} className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-[13px] font-semibold hover:bg-gray-200 transition-colors">
                            Ask
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
