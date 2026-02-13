'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCommandsByCategory } from '@/lib/keyboard-commands';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format key display (e.g., "Space" → "Space", "Shift+G" → shown with modifiers)
 */
function formatKeyDisplay(keys: string[], modifiers?: { shift?: boolean }): string[] {
  if (modifiers?.shift && keys.length === 1) {
    return ['Shift', keys[0]];
  }
  return keys;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  // Auto-generate shortcuts from registry (SINGLE SOURCE OF TRUTH)
  const commandsByCategory = getCommandsByCategory();

  // Define category display order
  const categoryOrder = ['Navigation', 'Selection', 'Search', 'Configuration', 'Actions', 'View', 'Help'];

  // Filter and sort categories
  const sortedCategories = categoryOrder
    .filter((cat) => commandsByCategory[cat])
    .map((cat) => ({
      name: cat === 'Search' ? 'Search & Filters' : cat === 'View' ? 'View Controls' : cat,
      commands: commandsByCategory[cat],
    }));

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
          {sortedCategories.map((section) => (
            <div key={section.name}>
              <h3 className="font-semibold text-lg mb-3">{section.name}</h3>
              <div className="space-y-2">
                {section.commands
                  .filter((cmd) => cmd.special !== 'input-only') // Hide input-only commands
                  .map((command, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <span className="text-sm">{command.description}</span>
                      <div className="flex gap-1">
                        {formatKeyDisplay(command.keys, command.modifiers).map((key, j) => (
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
