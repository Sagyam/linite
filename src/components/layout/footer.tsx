'use client';

import Link from 'next/link';
import { GithubIcon, Logo } from '@/components/common/logo';
import { ThemeSwitch } from '@/components/theme-switch';

const links = [
  { href: '/', label: 'Apps' },
  { href: '/collections', label: 'Collections' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-edge/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2.5 font-heading font-bold tracking-tight">
            <Logo className="size-7" id="footer-logo" />
            Linite
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Pick your apps. Get one command.</p>
          <p className="mt-6 text-sm text-muted-foreground">
            Built by{' '}
            <a href="https://sagyamthapa.com.np" className="font-medium text-foreground hover:text-primary">
              Sagyam Thapa
            </a>
            .
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Linite</span>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/Sagyam/linite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <GithubIcon className="size-3.5" />
                Source
              </a>
            </li>
            {process.env.NODE_ENV === 'development' && (
              <li>
                <Link href="/admin/login" className="text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="border-t border-edge/5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <p className="text-xs text-muted-foreground">
            Inspired by Ninite. Package data from Flathub, Snapcraft, AUR, Homebrew and Repology.
          </p>
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}
