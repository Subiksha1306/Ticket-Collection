import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExportForm from '@/components/ExportForm';

export default async function ExportPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return redirect('/');
  }

  const userIsAdmin = isAdmin(session.user.email);
  if (!userIsAdmin) {
    return redirect('/submissions');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Export</h1>
        <p className="text-gray-500">Download complete submission records.</p>
      </div>
      
      <ExportForm />
    </div>
  );
}
