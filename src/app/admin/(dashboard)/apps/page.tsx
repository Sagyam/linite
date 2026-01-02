import { AppsTableClient } from './apps-table-client';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

export default function AppsPage() {
  return <AppsTableClient />;
}
