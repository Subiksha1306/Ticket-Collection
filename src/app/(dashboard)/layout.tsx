import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppShell from '@/components/ui/AppShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const userIsAdmin = isAdmin(session.user?.email);

  return (
    <AppShell
      userName={session.user?.name}
      userEmail={session.user?.email}
      isAdmin={userIsAdmin}
    >
      {children}
    </AppShell>
  );
}
