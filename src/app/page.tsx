'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppGrid } from '@/components/app-grid';
import { DistroSelector } from '@/components/distro-selector';
import { SelectionSummary } from '@/components/selection-summary';
import { CommandOutput } from '@/components/command-output';
import { StructuredData } from '@/components/structured-data';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <div className="min-h-screen flex flex-col">
        <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bulk Install Apps on Linux
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select apps from our curated catalog, choose your distribution, and get a single command to install everything at once.
          </p>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Distro Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              1. Configure
            </h2>
            <DistroSelector />
          </Card>

          {/* Middle Column: Selection Summary */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                2. Review Selection
              </h2>
              <SelectionSummary />
            </Card>
          </div>
        </div>

        {/* Command Output Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            3. Install Command
          </h2>
          <CommandOutput />
        </div>

        <Separator className="my-12" />

        {/* App Selection Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Browse Applications
          </h2>
          <AppGrid />
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
}
