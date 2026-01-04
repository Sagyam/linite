'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ScreenshotsGalleryProps {
  screenshots: string[];
  appName: string;
}

export function ScreenshotsGallery({ screenshots, appName }: ScreenshotsGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + screenshots.length) % screenshots.length);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % screenshots.length);
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Screenshots</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {screenshots.map((screenshot, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-video rounded-lg overflow-hidden border hover:border-primary transition-colors group"
            >
              <Image
                src={screenshot}
                alt={`${appName} screenshot ${index + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </button>
          ))}
        </div>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-6xl p-0">
          <DialogTitle className="sr-only">Screenshot Gallery</DialogTitle>
          <div className="relative bg-black">
            {selectedIndex !== null && (
              <>
                <div className="relative aspect-video">
                  <Image
                    src={screenshots[selectedIndex]}
                    alt={`${appName} screenshot ${selectedIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                  />
                </div>

                {/* Navigation */}
                {screenshots.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={handleNext}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}

                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {selectedIndex + 1} / {screenshots.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
