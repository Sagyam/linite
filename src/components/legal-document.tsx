import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>
          <div
            className={cn(
              'prose prose-slate dark:prose-invert max-w-none',
              'prose-headings:font-bold prose-headings:tracking-tight',
              'prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4',
              'prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3',
              'prose-p:leading-7 prose-p:mb-4',
              'prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80',
              'prose-strong:font-semibold prose-strong:text-foreground',
              'prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6',
              'prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6',
              'prose-li:my-2',
              'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
              'prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4'
            )}
          >
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}