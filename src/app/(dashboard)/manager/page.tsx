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

  // Real Database Queries for the selected month
  const totalSubmissions = await prisma.submission.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const uniqueUsers = await prisma.submission.groupBy({
    by: ['createdBy'],
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });
  const participantsCount = uniqueUsers.length;

  // Pipeline Counts
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

  // Total Pending Review (for the stat card)
  const pendingReviewCount = countUnderReview;

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


  // Get Top Scored Submissions
  const topSubmissions = await prisma.submission.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      score: { not: null }
    },
    orderBy: { score: 'desc' },
    take: 2,
    include: {
      author: true,
      versions: {
        where: { isActive: true },
        take: 1
      }
    }
  });

  const winner = topSubmissions[0];
  const runnerUp = topSubmissions[1];

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
        
        <div className="flex items-center gap-3 flex-wrap">
          <ManagerMonthPicker />
          
          <div className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white flex items-center gap-2 cursor-pointer shadow-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            All Teams
            <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          
          <button className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#f3f0ff] flex items-center justify-center text-[#5B45FF] flex-shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">{totalSubmissions}</div>
            <div className="text-sm font-medium text-gray-500">Submissions</div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#e6f9f0] flex items-center justify-center text-[#0ca678] flex-shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">{countImplemented}</div>
            <div className="text-sm font-medium text-gray-500">Implemented</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#fff4e6] flex items-center justify-center text-[#f59f00] flex-shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">{pendingReviewCount}</div>
            <div className="text-sm font-medium text-gray-500">Pending Review</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#e7f5ff] flex items-center justify-center text-[#339af0] flex-shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 leading-tight">{participantsCount}</div>
            <div className="text-sm font-medium text-gray-500">Participants</div>
          </div>
        </div>
      </div>

      {/* Winner Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Winner Card */}
        <div className="bg-[#fcfbff] rounded-2xl p-6 border border-[#e8e4ff] shadow-sm flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f0ecff] flex items-center justify-center text-[#5B45FF] flex-shrink-0 mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z" /></svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[#5B45FF] mb-1">Top Score</div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{winner ? winner.author.name : 'TBD'}</h3>
              <div className="text-sm text-gray-500 mt-1">Ticket {winner ? winner.ticketNumber : '#'}</div>
            </div>
          </div>
          <div className="text-right border-l border-gray-200 pl-6 py-1">
            <div className="text-xl font-bold text-[#5B45FF]">{winner ? `${winner.score}/100` : '-'}</div>
            <div className="w-full h-px bg-gray-200 my-2"></div>
            <div className="text-xl font-bold text-[#5B45FF]">₹3,000</div>
          </div>
        </div>

        {/* Runner-up Card */}
        <div className="bg-[#fafafa] rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z" /></svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-500 mb-1">Runner-up</div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{runnerUp ? runnerUp.author.name : 'TBD'}</h3>
              <div className="text-sm text-gray-500 mt-1">Ticket {runnerUp ? runnerUp.ticketNumber : '#'}</div>
            </div>
          </div>
          <div className="text-right border-l border-gray-200 pl-6 py-1">
            <div className="text-xl font-bold text-gray-600">{runnerUp ? `${runnerUp.score}/100` : '-'}</div>
            <div className="w-full h-px bg-gray-200 my-2"></div>
            <div className="text-xl font-bold text-gray-600">₹2,000</div>
          </div>
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
