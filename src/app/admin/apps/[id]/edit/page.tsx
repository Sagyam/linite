'use client';

import { Breadcrumb } from '@/components/admin/breadcrumb';
import { AppForm } from '@/components/admin/app-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const handleSuccess = () => {
    router.push('/admin/apps');
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Apps', href: '/admin/apps' },
          { label: 'Edit' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit App</h1>
        <p className="text-gray-500 mt-2">Update application information</p>
      </div>

      <AppForm appId={appId} onSuccess={handleSuccess} />
    </div>
  );
}
