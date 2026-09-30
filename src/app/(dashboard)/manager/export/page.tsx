import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExportViewClient from './ExportViewClient';

export default async function ExportPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  if (!isAdmin(session.user.email)) {
    redirect('/');
  }

  return <ExportViewClient />;
}
