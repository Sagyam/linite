import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Github, Star } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OptimizedImage
              src="/logo.svg"
              alt="Linite Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <div className="text-sm text-muted-foreground">
              <p>
                Linite - Bulk package installer for Linux distributions
              </p>
              <p className="text-xs mt-1">
                Open source • Built with Next.js
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
            </div>
            <a
              href="https://github.com/Sagyam/linite"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                <Star className="h-4 w-4" />
                Star on GitHub
              </Button>
            </a>
            {process.env.NODE_ENV === 'development' && (
              <a
                href="/admin/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
