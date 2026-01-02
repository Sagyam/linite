import { redirect } from 'next/navigation';

export default function AdminLoginPage() {
  // Redirect to unified login page
  redirect('/login');
}
