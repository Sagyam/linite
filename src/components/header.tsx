'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/dashboard/user-nav';
import { MobileNav } from '@/components/mobile-nav';
import { useSession } from '@/lib/auth-client';
import { Github, Star, LogIn, Home, Shield, LibraryBig, Settings } from 'lucide-react';

export function Header() {
  const { data: session, isPending } = useSession();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Responsive sizing */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src="/logo.svg"
              alt="Linite Logo"
              width={40}
              height={40}
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold">Linite</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Bulk installer for Linux
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/collections">
              <Button variant="ghost" size="sm" className="gap-2">
                <LibraryBig className="h-4 w-4" />
                Collections
              </Button>
            </Link>
            {session && (
              <Link href="/dashboard/installations">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Installations
                </Button>
              </Link>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <a
              href="https://github.com/Sagyam/linite"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                <Star className="h-4 w-4" />
                Star
              </Button>
            </a>

            {/* Show user nav if logged in, otherwise show sign in button */}
            {!isPending &&
              (session ? (
                <UserNav />
              ) : (
                <Link href="/login">
                  <Button size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              ))}

            <ThemeToggle />
          </nav>

          {/* Mobile Navigation - Shown on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <MobileNav isAuthenticated={!!session} />
          </div>
        </div>
      </div>
    </header>
  );
}

