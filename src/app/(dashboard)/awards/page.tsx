import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AwardsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  // Calculate start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch live summary data
  const totalSubmissionsThisMonth = await prisma.submission.count({
    where: {
      createdAt: {
        gte: startOfMonth
      }
    }
  });



  // Calculate leaderboard
  const userTicketCounts = await prisma.submission.groupBy({
    by: ['createdBy'],
    where: {
      createdAt: {
        gte: startOfMonth
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    }
  });

  const userIds = userTicketCounts.map(u => u.createdBy);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const leaderboard = userTicketCounts.map(utc => {
    const user = users.find(u => u.id === utc.createdBy);
    return {
      name: user?.name || user?.email || 'Unknown User',
      count: utc._count.id
    };
  });


  
  const winner = leaderboard[0];
  const runnerUp = leaderboard[1];

  // Fetch Historical Hall of Fame
  const historicalHallOfFame = await prisma.hallOfFame.findMany({
    orderBy: [
      { year: 'desc' },
      { month: 'desc' }
    ]
  });

  const getMonthName = (monthIndex: number) => {
    const date = new Date(2000, monthIndex, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Awards & Summary</h1>
        <p className="text-gray-500">Live summary of the month and I2I Hall of Fame.</p>
      </div>

      {/* Historical Hall of Fame */}
      {historicalHallOfFame.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Monthly Hall of Fame
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {historicalHallOfFame.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-sm font-bold text-[var(--primary)] mb-4 tracking-wider uppercase">
                  {getMonthName(entry.month)} {entry.year}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏆</span>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Winner</div>
                      <div className="font-semibold text-gray-900">{entry.winnerName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🥈</span>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Runner-up</div>
                      <div className="font-semibold text-gray-900">{entry.runnerUpName}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* I2I Awards and Hall of Fame */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          I2I Awards & Hall of Fame
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Winner Spotlight */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-sm border border-yellow-200 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-yellow-300 rounded-full opacity-20 blur-2xl"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-yellow-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Winner Spotlight</span>
            </div>
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-yellow-400 shadow-lg flex items-center justify-center flex-shrink-0 text-3xl font-bold text-yellow-600">
                🏆
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{winner ? winner.name : 'To Be Announced'}</h3>
                <p className="text-yellow-800 font-medium mb-2">Innovator of the Month</p>
                <p className="text-sm text-gray-600">
                  {winner ? `Leading with ${winner.count} ticket${winner.count !== 1 ? 's' : ''} submitted this month!` : 'No submissions yet this month.'}
                </p>
              </div>
            </div>
          </div>

          {/* Runner-up Recognition */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-sm border border-gray-200 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gray-300 rounded-full opacity-20 blur-2xl"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-gray-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Runner-up Recognition</span>
            </div>
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-gray-300 shadow-md flex items-center justify-center flex-shrink-0 text-3xl font-bold text-gray-500">
                🥈
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{runnerUp ? runnerUp.name : 'To Be Announced'}</h3>
                <p className="text-gray-600 font-medium mb-2">Outstanding Contribution</p>
                <p className="text-sm text-gray-500">
                  {runnerUp ? `Close second with ${runnerUp.count} ticket${runnerUp.count !== 1 ? 's' : ''} submitted!` : 'Keep submitting to earn this spot.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Contribution Leaderboard</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-3/4">Submitted By</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ticket Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No tickets submitted yet this month.
                  </td>
                </tr>
              ) : (
                leaderboard.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {leaderboard.length > 0 && (
              <tfoot className="bg-white">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-t border-gray-200">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-t border-gray-200">
                    {totalSubmissionsThisMonth}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
