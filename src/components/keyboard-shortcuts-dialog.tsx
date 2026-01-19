'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  category: string;
  items: Shortcut[];
}

const shortcuts: ShortcutSection[] = [
  {
    category: 'Navigation',
    items: [
      { keys: ['j'], description: 'Move down to next app' },
      { keys: ['k'], description: 'Move up to previous app' },
      { keys: ['h'], description: 'Navigate to previous category' },
      { keys: ['l'], description: 'Navigate to next category' },
      { keys: ['g', 'g'], description: 'Jump to top (first app)' },
      { keys: ['Shift', 'G'], description: 'Jump to bottom (last app)' },
    ],
  },
  {
    category: 'Selection',
    items: [
      { keys: ['Space'], description: 'Toggle app selection' },
      { keys: ['Enter'], description: 'Toggle app selection' },
      { keys: ['x'], description: 'Remove app from selection' },
      { keys: ['v'], description: 'Enter visual mode for range selection' },
      { keys: ['v', 'j/k', 'Enter'], description: 'Visual mode: select range and confirm' },
    ],
  },
  {
    category: 'Search & Filters',
    items: [
      { keys: ['/'], description: 'Focus search input' },
      { keys: ['Esc'], description: 'Clear search / Unfocus input' },
      { keys: ['?'], description: 'Show this shortcuts dialog' },
    ],
  },
  {
    category: 'Configuration',
    items: [
      { keys: ['d'], description: 'Focus distribution selector' },
      { keys: ['s'], description: 'Focus package source selector' },
    ],
  },
  {
    category: 'View Controls',
    items: [
      { keys: ['Tab'], description: 'Cycle through view modes' },
      { keys: ['1'], description: 'Switch to minimal view' },
      { keys: ['2'], description: 'Switch to compact view' },
      { keys: ['3'], description: 'Switch to detailed view' },
      { keys: ['m'], description: 'Toggle between minimal and detailed view' },
    ],
  },
];

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate and control Linite using your keyboard with Vim-inspired keybindings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-lg mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Visual mode (v) lets you select a range of apps by pressing{' '}
            <kbd className="px-1 py-0.5 text-xs bg-background border rounded">v</kbd> to start,{' '}
            <kbd className="px-1 py-0.5 text-xs bg-background border rounded">j</kbd>/
            <kbd className="px-1 py-0.5 text-xs bg-background border rounded">k</kbd> to extend, and{' '}
            <kbd className="px-1 py-0.5 text-xs bg-background border rounded">Enter</kbd> to confirm.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
