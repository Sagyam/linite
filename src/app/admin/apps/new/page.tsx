'use client';

import { Breadcrumb } from '@/components/admin/breadcrumb';
import { AppForm } from '@/components/admin/app-form';
import { useRouter } from 'next/navigation';

export default function NewAppPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/apps');
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Apps', href: '/admin/apps' },
          { label: 'New' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New App</h1>
        <p className="text-gray-500 mt-2">
          Create a new application in the catalog
        </p>
      </div>

      <AppForm onSuccess={handleSuccess} />
    </div>
  );
}
