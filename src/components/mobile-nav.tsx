'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Home, LibraryBig, Shield, Github, Star, LogIn, Menu } from 'lucide-react';

interface MobileNavProps {
  isAuthenticated: boolean;
}

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-6">
          <Link href="/" onClick={closeSheet}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/collections" onClick={closeSheet}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LibraryBig className="h-4 w-4" />
              Collections
            </Button>
          </Link>
          {process.env.NODE_ENV === 'development' && (
            <Link href="/admin" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          <a
            href="https://github.com/Sagyam/linite"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeSheet}
          >
            <Button variant="outline" className="w-full justify-start gap-2">
              <Github className="h-4 w-4" />
              <Star className="h-4 w-4" />
              Star on GitHub
            </Button>
          </a>
          {!isAuthenticated && (
            <Link href="/login" onClick={closeSheet}>
              <Button className="w-full justify-start gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}