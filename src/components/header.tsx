'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/dashboard/user-nav';
import { useSession } from '@/lib/auth-client';
import {Github, Star, LogIn, Home, Shield, LibraryBig} from 'lucide-react';

export function Header() {
  const { data: session, isPending } = useSession();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Linite Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Linite</h1>
              <span className="text-xs text-muted-foreground">
                Bulk installer for Linux
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
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
            {process.env.NODE_ENV === 'development' && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
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
            {!isPending && (
              session ? (
                <UserNav />
              ) : (
                <Link href="/login">
                  <Button size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )
            )}

            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
