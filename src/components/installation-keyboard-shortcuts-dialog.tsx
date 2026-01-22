'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InstallationKeyboardShortcutsDialogProps {
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
      { keys: ['↑', '↓'], description: 'Move focus up/down through rows' },
      { keys: ['Home'], description: 'Jump to first row' },
      { keys: ['End'], description: 'Jump to last row' },
    ],
  },
  {
    category: 'Selection',
    items: [
      { keys: ['Space'], description: 'Toggle selection on focused row' },
      { keys: ['Enter'], description: 'Toggle selection on focused row' },
      { keys: ['Ctrl', 'A'], description: 'Select all visible rows' },
      { keys: ['Esc'], description: 'Clear selection / Close dialogs' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['Delete'], description: 'Delete selected installations' },
      { keys: ['Backspace'], description: 'Delete selected installations' },
      { keys: ['?'], description: 'Show this help dialog' },
    ],
  },
];

export function InstallationKeyboardShortcutsDialog({
  open,
  onOpenChange,
}: InstallationKeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate and manage your installations using keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1 items-center">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={j}>
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[24px] text-center">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Keyboard shortcuts are disabled when typing in search
            fields. Press <kbd className="px-1 py-0.5 text-xs bg-background border rounded mx-1">Esc</kbd> to
            exit a text field.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
