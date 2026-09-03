import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/SettingsForm';
import HallOfFameForm from '@/components/HallOfFameForm';
import ExportForm from '@/components/ExportForm';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  const userIsAdmin = isAdmin(session.user.email);
  if (!userIsAdmin) {
    return redirect('/');
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage global settings, export data, and configure the Hall of Fame.</p>
      </div>

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
