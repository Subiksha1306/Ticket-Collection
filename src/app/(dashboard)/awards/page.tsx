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

  const mostRecentWinner = historicalHallOfFame[0];
  const winnerName = mostRecentWinner?.winnerName || 'TBD';
  const runnerUpName = mostRecentWinner?.runnerUpName || 'TBD';
  const currentMonthDisplay = mostRecentWinner 
    ? `${getMonthName(mostRecentWinner.month)} ${mostRecentWinner.year}`
    : `${getMonthName(now.getMonth())} ${now.getFullYear()}`;

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#062c5c] via-[#094186] to-[#b38728] shadow-lg text-white">
        {/* Abstract shapes / particles could go here as absolute positioned divs */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 lg:p-10">
          {/* Left Side: Title */}
          <div className="flex items-center gap-6 mb-6 lg:mb-0">
            <div className="w-20 h-20 flex-shrink-0 text-yellow-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v1h-.5C3.12 6 2 7.12 2 8.5S3.12 11 4.5 11H5v1c0 3.1 2.01 5.76 4.9 6.71V21h-2v2h8v-2h-2v-2.29c2.89-.95 4.9-3.61 4.9-6.71V11h.5c1.38 0 2.5-1.12 2.5-2.5S20.88 6 19.5 6H19V5c0-1.1-.9-2-2-2zm-2.5 14H9.5v-1.16c-1.34-.34-2.5-1.19-3.26-2.31C5.35 12.22 5 10.66 5 9V5h14v4c0 1.66-.35 3.22-1.24 4.53-.76 1.12-1.92 1.97-3.26 2.31V17zm4.5-8h-1V5h1c.28 0 .5.22.5.5S19.28 9 19 9zM4.5 9C4.22 9 4 8.78 4 8.5S4.22 6 4.5 6H5v3h-.5z"/>
                <path d="M12 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest text-yellow-400 uppercase mb-1">I2I Awards</div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-none drop-shadow-md" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Hall of Fame
              </h1>
              <p className="text-blue-100 text-sm mt-2 font-medium">Ideas today. A better tomorrow.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-16 bg-blue-300/30 mx-8"></div>

          {/* Right Side: Philosophy & Icons */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center sm:text-left text-blue-100 text-sm leading-relaxed max-w-[140px]">
              Recognizing ideas<br />that make an impact
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                <span className="text-[10px] uppercase font-bold text-blue-100 tracking-wider">Innovate</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="text-[10px] uppercase font-bold text-blue-100 tracking-wider">Improve</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                <span className="text-[10px] uppercase font-bold text-blue-100 tracking-wider">Create Value</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                <span className="text-[10px] uppercase font-bold text-blue-100 tracking-wider">Together</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Winners Section */}
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Previous Month Winners</h2>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{currentMonthDisplay}</span>
            </div>
          </div>
          <div className="hidden sm:block text-[#b38728] font-serif italic text-xl">
            Great ideas create brighter tomorrows!
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* WINNER CARD */}
          <div className="relative rounded-2xl p-8 overflow-hidden bg-gradient-to-br from-[#fffdf5] to-[#fbf1cc] border border-[#f0d486] shadow-sm">
            {/* Confetti / background pattern */}
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#e0bc46 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-[#dca72f] to-[#eebc49] text-white text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8l-3.354-1.935a1 1 0 010-1.732L9.854 7.2l1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                Winner
              </div>

              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(220,167,47,0.3)] border border-[#fbf1cc]">
                  <div className="w-12 h-12 text-[#dca72f]">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{winnerName}</h3>
                  <p className="text-[#a57a1b] font-semibold mb-3">Innovator of the Month</p>
                  <p className="text-sm font-serif italic text-gray-600">
                    &ldquo;Leading with ideas, making an impact!&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RUNNER-UP CARD */}
          <div className="relative rounded-2xl p-8 overflow-hidden bg-gradient-to-br from-[#f8fafe] to-[#e6effb] border border-[#d2e2f7] shadow-sm">
            {/* Confetti / background pattern */}
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#abc7ed 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-[#8ba1ba] to-[#9db3cc] text-white text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Runner-up
              </div>

              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(139,161,186,0.2)] border border-[#e6effb]">
                  <div className="w-12 h-12 text-[#6480a0] flex flex-col items-center justify-center relative">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.48-.77-2.58-1.93H7.49c.11 1.9 1.51 2.96 3.41 3.33V20h2.4v-1.66c1.65-.29 2.8-1.28 2.8-2.9 0-2.21-1.78-2.85-3.79-3.3z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{runnerUpName}</h3>
                  <p className="text-[#6480a0] font-semibold mb-3">Outstanding Contribution</p>
                  <p className="text-sm font-serif italic text-gray-600">
                    &ldquo;Turning ideas into meaningful change!&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Winners Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Past Winners</h2>
              <p className="text-sm text-gray-500">A journey of great ideas and inspiring contributions.</p>
            </div>
          </div>

          {/* Dummy Filters to match UI */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 flex items-center gap-2 bg-gray-50 cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              All Years
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 flex items-center gap-2 bg-gray-50 cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              Most Recent First
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">Month</th>
                <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">Winner</th>
                <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">Runner-up</th>
                <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-[30%]">Highlights</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {historicalHallOfFame.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-gray-500">
                    No past winners have been recorded yet.
                  </td>
                </tr>
              ) : (
                historicalHallOfFame.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {getMonthName(entry.month)} {entry.year}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">🏆</span> {entry.winnerName}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🥈</span> {entry.runnerUpName}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-500">
                      Innovative idea to improve process efficiency and create value.
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-[#f8f9fc] px-8 py-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-gray-600 text-lg">
            &ldquo;Small ideas can make a big difference.&rdquo;
          </p>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-500 tracking-wider">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            <span className="text-gray-600">Submit. Share. Inspire.</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-gray-800">I2I IDEAS TO IMPACT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
