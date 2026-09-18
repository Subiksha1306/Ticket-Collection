import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ManagerMonthPicker from '@/components/ManagerMonthPicker';
import { prisma } from '@/lib/db';

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  
  if (!session?.user) {
    return redirect('/login');
  }

  const userIsAdmin = isAdmin(session.user.email);
  if (!userIsAdmin) {
    return redirect('/');
  }

  // Calculate selected month bounds
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


  const pipelineData = await prisma.submission.groupBy({
    by: ['status'],
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

  const getStatusCount = (statusName: string) => {
    return pipelineData.find(p => p.status === statusName)?._count.id || 0;
  };

  const countSubmitted = getStatusCount('Submitted');
  const countUnderReview = getStatusCount('Under Review');
  const countApproved = getStatusCount('Approved');
  const countImplemented = getStatusCount('Implemented');
  const countImpactVerified = getStatusCount('Impact Verified');



  // Categories Count
  const categoryData = await prisma.submission.groupBy({
    by: ['category'],
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      category: { not: null }
    },
    _count: {
      id: true
    }
  });

  const getCategoryCount = (catName: string) => {
    return categoryData.find(c => c.category === catName)?._count.id || 0;
  };

  // Pre-defined categories for the chart
  const processImprovement = getCategoryCount('Process Improvement');
  const automation = getCategoryCount('Automation');
  const customerExperience = getCategoryCount('Customer Experience');
  const costOptimization = getCategoryCount('Cost Optimization');
  const peopleCulture = getCategoryCount('People & Culture');

  // Pending Manager Review Table
  const pendingSubmissions = await prisma.submission.findMany({
    where: {
      status: 'Under Review',
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    include: {
      author: true,
      versions: {
        where: { isActive: true },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Helper for max value in chart
  const maxCategoryCount = Math.max(10, processImprovement, automation, customerExperience, costOptimization, peopleCulture);

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">Ideas, impact and recognition at a glance.</p>
        </div>
        
        {/* Month Picker and Actions */}
        <div className="flex items-center gap-3">
          <ManagerMonthPicker />
          
          {/* "All Teams" dropdown removed temporarily since Teams are not tracked in the database schema yet */}
          
          <a href={`/api/export?month=${monthParam || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}`} className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
          </a>
        </div>
      </div>



      {/* Middle Section (Pipeline & Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pipeline */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-8">Submission Pipeline</h3>
          
          <div className="flex items-center justify-between relative px-4">
            {/* Background Line */}
            <div className="absolute top-6 left-12 right-12 h-0.5 bg-gray-200 -z-10"></div>
            
            {/* Steps */}
            <div className="flex flex-col items-center gap-3 bg-white z-10 px-2">
              <div className="w-12 h-12 rounded-full bg-[#5B45FF] text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 leading-none">{countSubmitted}</div>
                <div className="text-xs text-gray-500 mt-1">Submitted</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 bg-white z-10 px-2">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#5B45FF] text-[#5B45FF] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 leading-none">{countUnderReview}</div>
                <div className="text-xs text-gray-500 mt-1">Under Review</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 bg-white z-10 px-2">
              <div className="w-12 h-12 rounded-full bg-[#e7f5ff] text-[#339af0] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 leading-none">{countApproved}</div>
                <div className="text-xs text-gray-500 mt-1">Approved</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 bg-white z-10 px-2">
              <div className="w-12 h-12 rounded-full bg-[#e6f9f0] text-[#0ca678] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 leading-none">{countImplemented}</div>
                <div className="text-xs text-gray-500 mt-1">Implemented</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 bg-white z-10 px-2">
              <div className="w-12 h-12 rounded-full bg-[#f3f0ff] text-[#5B45FF] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 leading-none">{countImpactVerified}</div>
                <div className="text-xs text-gray-500 mt-1">Impact Verified</div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Ideas by Category Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Ideas by Category</h3>
          <div className="flex-1 flex items-end justify-between px-2 pt-4 relative min-h-[200px]">
            {/* Y-axis labels and lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2 pb-6 text-[10px] text-gray-400">
              <div className="flex items-center gap-2 w-full"><span className="w-3 text-right">{maxCategoryCount}</span><div className="flex-1 border-b border-gray-100 border-dashed"></div></div>
              <div className="flex items-center gap-2 w-full"><span className="w-3 text-right">{Math.floor(maxCategoryCount * 0.8)}</span><div className="flex-1 border-b border-gray-100 border-dashed"></div></div>
              <div className="flex items-center gap-2 w-full"><span className="w-3 text-right">{Math.floor(maxCategoryCount * 0.6)}</span><div className="flex-1 border-b border-gray-100 border-dashed"></div></div>
              <div className="flex items-center gap-2 w-full"><span className="w-3 text-right">{Math.floor(maxCategoryCount * 0.4)}</span><div className="flex-1 border-b border-gray-100 border-dashed"></div></div>
              <div className="flex items-center gap-2 w-full"><span className="w-3 text-right">{Math.floor(maxCategoryCount * 0.2)}</span><div className="flex-1 border-b border-gray-100 border-dashed"></div></div>
              <div className="flex items-center gap-2 w-full"><span className="w-3 text-right">0</span><div className="flex-1 border-b border-gray-100"></div></div>
            </div>
            
            {/* Bars */}
            <div className="relative z-10 w-full flex justify-between items-end pl-8 pb-6 h-full">
              <div className="flex flex-col items-center justify-end gap-2 w-12 h-full group cursor-pointer">
                <span className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{processImprovement}</span>
                <div className="w-full bg-[#5B45FF] rounded-t-sm transition-all hover:bg-[#4a36d9]" style={{ height: `${(processImprovement / maxCategoryCount) * 100}%` }}></div>
                <div className="absolute -bottom-2 text-[10px] text-center text-gray-500 leading-tight w-20">Process<br/>Improvement</div>
              </div>
              <div className="flex flex-col items-center justify-end gap-2 w-12 h-full group cursor-pointer">
                <span className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{automation}</span>
                <div className="w-full bg-[#6C59FF] rounded-t-sm transition-all hover:bg-[#5B45FF]" style={{ height: `${(automation / maxCategoryCount) * 100}%` }}></div>
                <div className="absolute -bottom-2 text-[10px] text-center text-gray-500 leading-tight w-20">Automation</div>
              </div>
              <div className="flex flex-col items-center justify-end gap-2 w-12 h-full group cursor-pointer">
                <span className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{customerExperience}</span>
                <div className="w-full bg-[#7D6EFF] rounded-t-sm transition-all hover:bg-[#6C59FF]" style={{ height: `${(customerExperience / maxCategoryCount) * 100}%` }}></div>
                <div className="absolute -bottom-2 text-[10px] text-center text-gray-500 leading-tight w-20">Customer<br/>Experience</div>
              </div>
              <div className="flex flex-col items-center justify-end gap-2 w-12 h-full group cursor-pointer">
                <span className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{costOptimization}</span>
                <div className="w-full bg-[#8F82FF] rounded-t-sm transition-all hover:bg-[#7D6EFF]" style={{ height: `${(costOptimization / maxCategoryCount) * 100}%` }}></div>
                <div className="absolute -bottom-2 text-[10px] text-center text-gray-500 leading-tight w-20">Cost<br/>Optimization</div>
              </div>
              <div className="flex flex-col items-center justify-end gap-2 w-12 h-full group cursor-pointer">
                <span className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{peopleCulture}</span>
                <div className="w-full bg-[#A196FF] rounded-t-sm transition-all hover:bg-[#8F82FF]" style={{ height: `${(peopleCulture / maxCategoryCount) * 100}%` }}></div>
                <div className="absolute -bottom-2 text-[10px] text-center text-gray-500 leading-tight w-20">People &<br/>Culture</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Pending Manager Review</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-[#fafafa]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ticket</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              
              {pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No submissions currently pending review.
                  </td>
                </tr>
              ) : (
                pendingSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{submission.ticketNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {submission.versions[0]?.title || 'Untitled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.author?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#fff4e6] text-[#e88d14]">{submission.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.score ? `${submission.score}/100` : 'Unscored'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="px-4 py-1.5 border border-[#5B45FF] text-[#5B45FF] rounded text-xs font-semibold hover:bg-[#f3f0ff] transition-colors">Review</button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
