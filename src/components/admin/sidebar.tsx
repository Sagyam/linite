'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Server,
  HardDrive,
  Layers,
  RefreshCw,
  LogOut,
  AppWindow,
} from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/common/theme-toggle';

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Apps',
    href: '/admin/apps',
    icon: AppWindow,
  },
  {
    title: 'Packages',
    href: '/admin/packages',
    icon: Package,
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    title: 'Sources',
    href: '/admin/sources',
    icon: Server,
  },
  {
    title: 'Distros',
    href: '/admin/distros',
    icon: HardDrive,
  },
  {
    title: 'Refresh',
    href: '/admin/refresh',
    icon: RefreshCw,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/admin/login';
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            L
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Linite</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => window.open('/', '_blank')}
        >
          View Public Site
        </Button>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
