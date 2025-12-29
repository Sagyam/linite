import { AdminSidebar } from '@/components/admin/sidebar';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Allow access to login page without authentication
  if (!session && !headers().toString().includes('/admin/login')) {
    redirect('/admin/login');
  }

  // If logged in and on login page, redirect to dashboard
  if (session && headers().toString().includes('/admin/login')) {
    redirect('/admin');
  }

  // Render login page without sidebar
  if (headers().toString().includes('/admin/login')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
