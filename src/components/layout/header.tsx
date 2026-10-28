'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { GithubIcon, Logo } from '@/components/common/logo';
import { UserNav } from '@/components/dashboard/user-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const REPO_URL = 'https://github.com/Sagyam/linite';

export function Header() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  const nav = [
    { href: '/', label: 'Apps', active: pathname === '/' },
    { href: '/collections', label: 'Collections', active: pathname.startsWith('/collections') },
    ...(session
      ? [{ href: '/dashboard/installations', label: 'Installations', active: pathname.startsWith('/dashboard') }]
      : []),
    ...(process.env.NODE_ENV === 'development'
      ? [{ href: '/admin', label: 'Admin', active: pathname.startsWith('/admin') }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-edge/5 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight">
          <Logo className="size-7" id="nav-logo" />
          Linite
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={cn(
                    'transition-colors hover:text-foreground',
                    item.active ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <GithubIcon />
            GitHub
          </a>
          {!isPending &&
            (session ? (
              <UserNav />
            ) : (
              <Link href="/login" className={buttonVariants({ size: 'sm' })}>
                <LogIn />
                Sign in
              </Link>
            ))}
        </div>

        <div className="md:hidden">
          <MobileNav isAuthenticated={!!session} />
        </div>
      </div>
    </header>
  );
}
