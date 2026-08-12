import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginButton from '@/components/LoginButton';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1D2D] relative overflow-hidden flex-col justify-center px-16">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-700 via-purple-800 to-[#1A1D2D]"></div>
        
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo-sidebar.png" alt="Techxle" className="h-10 w-auto" />
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Data Collection Portal
          </h1>
          <p className="text-xl text-gray-300 font-light mb-12">
            Securely collect and preserve ticket information in one place.
          </p>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Authorized Techxle users only
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="Techxle" className="h-12 w-auto mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Sign in with your Techxle account to continue.</p>
          </div>

          <div className="space-y-6">
            <LoginButton />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Only authorized Techxle users can access this portal. If you need access, please contact IT support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
