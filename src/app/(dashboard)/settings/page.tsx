import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  const userIsAdmin = isAdmin(session.user.email);
  if (!userIsAdmin) {
    return redirect('/');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-500">Manage global integrations and configurations.</p>
      </div>

      <SettingsForm />
    </div>
  );
}
