import { cn } from '@/lib/utils';

/** The Linite mark: three apps picked from the catalog, and the one command that installs them. */
export function Logo({ className, id = 'logo' }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1688c4" />
          <stop offset="1" stopColor="#0c2f4c" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="58" fill={`url(#${id}-bg)`} />
      <g fill="#f4f1ea">
        <rect x="52" y="52" width="66" height="66" rx="18" />
        <rect x="138" y="52" width="66" height="66" rx="18" />
        <rect x="52" y="138" width="66" height="66" rx="18" />
      </g>
      <g fill="none" stroke="#f2b134" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
        <path d="M142 146 L164 168 L142 190" />
        <path d="M176 192 L204 192" />
      </g>
    </svg>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn('size-4', className)}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
