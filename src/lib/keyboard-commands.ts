/**
 * Keyboard command registry for home page navigation
 *
 * This provides a declarative, single source of truth for all keyboard shortcuts.
 * Benefits:
 * - Easy to discover what shortcuts are available
 * - Simple to add new shortcuts (just add to the registry)
 * - Auto-generate keyboard shortcuts dialog
 * - Testable command matching logic
 *
 * Extracted from use-keyboard-navigation.ts to reduce cyclomatic complexity
 */

export type KeyboardCommandType =
  // Navigation
  | 'NAVIGATE_DOWN'
  | 'NAVIGATE_UP'
  | 'NAVIGATE_PREV_CATEGORY'
  | 'NAVIGATE_NEXT_CATEGORY'
  | 'JUMP_TO_TOP'
  | 'JUMP_TO_TOP_DOUBLE'
  | 'JUMP_TO_BOTTOM'
  // Selection
  | 'TOGGLE_SELECTION'
  | 'REMOVE_SELECTION'
  | 'ENTER_VISUAL_MODE'
  // Search
  | 'FOCUS_SEARCH'
  // Configuration
  | 'FOCUS_DISTRO'
  | 'FOCUS_SOURCE'
  // Actions
  | 'GENERATE_COMMAND'
  | 'VIEW_SELECTION'
  // Help
  | 'SHOW_SHORTCUTS'
  // View modes
  | 'CYCLE_VIEW_MODE'
  | 'VIEW_MINIMAL'
  | 'VIEW_COMPACT'
  | 'VIEW_DETAILED'
  | 'TOGGLE_MINIMAL'
  // Special
  | 'ESCAPE_INPUT';

export interface KeyboardCommand {
  type: KeyboardCommandType;
  keys: string[];
  description: string;
  category: 'Navigation' | 'Selection' | 'Search' | 'Configuration' | 'Actions' | 'View' | 'Help' | 'Special';
  modifiers?: {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
  };
  special?: 'double-tap' | 'input-only';
}

/**
 * Registry of all keyboard commands
 *
 * Single source of truth for keyboard shortcuts
 */
export const KEYBOARD_COMMANDS: KeyboardCommand[] = [
  // === Navigation ===
  {
    type: 'NAVIGATE_DOWN',
    keys: ['j'],
    description: 'Move focus down',
    category: 'Navigation',
  },
  {
    type: 'NAVIGATE_UP',
    keys: ['k'],
    description: 'Move focus up',
    category: 'Navigation',
  },
  {
    type: 'NAVIGATE_PREV_CATEGORY',
    keys: ['h'],
    description: 'Previous category',
    category: 'Navigation',
  },
  {
    type: 'NAVIGATE_NEXT_CATEGORY',
    keys: ['l'],
    description: 'Next category',
    category: 'Navigation',
  },
  {
    type: 'JUMP_TO_TOP_DOUBLE',
    keys: ['g', 'g'],
    description: 'Jump to top (press g twice)',
    category: 'Navigation',
    special: 'double-tap',
  },
  {
    type: 'JUMP_TO_BOTTOM',
    keys: ['G'],
    description: 'Jump to bottom',
    category: 'Navigation',
    modifiers: { shift: true },
  },

  // === Selection ===
  {
    type: 'TOGGLE_SELECTION',
    keys: ['Space', 'Enter'],
    description: 'Toggle app selection',
    category: 'Selection',
  },
  {
    type: 'REMOVE_SELECTION',
    keys: ['x'],
    description: 'Remove from selection',
    category: 'Selection',
  },
  {
    type: 'ENTER_VISUAL_MODE',
    keys: ['v'],
    description: 'Enter/exit visual selection mode',
    category: 'Selection',
  },

  // === Search ===
  {
    type: 'FOCUS_SEARCH',
    keys: ['/'],
    description: 'Focus search box',
    category: 'Search',
  },

  // === Configuration ===
  {
    type: 'FOCUS_DISTRO',
    keys: ['d'],
    description: 'Open distro selector',
    category: 'Configuration',
  },
  {
    type: 'FOCUS_SOURCE',
    keys: ['s'],
    description: 'Open source preference',
    category: 'Configuration',
  },

  // === Actions ===
  {
    type: 'GENERATE_COMMAND',
    keys: ['c'],
    description: 'Generate install command',
    category: 'Actions',
  },
  {
    type: 'VIEW_SELECTION',
    keys: ['b'],
    description: 'View selection basket',
    category: 'Actions',
  },

  // === View Modes ===
  {
    type: 'CYCLE_VIEW_MODE',
    keys: ['Tab'],
    description: 'Cycle through view modes',
    category: 'View',
  },
  {
    type: 'VIEW_MINIMAL',
    keys: ['1'],
    description: 'Minimal view',
    category: 'View',
  },
  {
    type: 'VIEW_COMPACT',
    keys: ['2'],
    description: 'Compact view',
    category: 'View',
  },
  {
    type: 'VIEW_DETAILED',
    keys: ['3'],
    description: 'Detailed view',
    category: 'View',
  },
  {
    type: 'TOGGLE_MINIMAL',
    keys: ['m'],
    description: 'Toggle minimal/detailed view',
    category: 'View',
  },

  // === Help ===
  {
    type: 'SHOW_SHORTCUTS',
    keys: ['?'],
    description: 'Show this help',
    category: 'Help',
  },

  // === Special ===
  {
    type: 'ESCAPE_INPUT',
    keys: ['Escape'],
    description: 'Exit input field',
    category: 'Special',
    special: 'input-only',
  },
];

/**
 * Match a keyboard event to a command
 *
 * Pure function - easily testable
 */
export function matchKeyboardCommand(
  event: KeyboardEvent,
  lastGPressTime?: number
): KeyboardCommand | null {
  // Handle double-tap for 'gg'
  if (event.key === 'g' && !event.shiftKey) {
    const now = Date.now();
    if (lastGPressTime && now - lastGPressTime < 500) {
      const command = KEYBOARD_COMMANDS.find((cmd) => cmd.type === 'JUMP_TO_TOP_DOUBLE');
      return command || null;
    }
    return null; // First 'g' press, waiting for second
  }

  // Find matching command
  for (const command of KEYBOARD_COMMANDS) {
    // Skip double-tap commands (handled above)
    if (command.special === 'double-tap') continue;

    // Check if key matches
    const keyMatches = command.keys.some((key) => {
      // Handle space key
      if (key === 'Space') return event.key === ' ';
      return event.key === key;
    });

    if (!keyMatches) continue;

    // Check modifiers
    const shiftMatches = !command.modifiers?.shift || event.shiftKey;
    const ctrlMatches = !command.modifiers?.ctrl || event.ctrlKey;
    const altMatches = !command.modifiers?.alt || event.altKey;

    if (shiftMatches && ctrlMatches && altMatches) {
      return command;
    }
  }

  return null;
}

/**
 * Check if target element is an input field
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!target) return false;
  const element = target as HTMLElement;
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
}

/**
 * Group commands by category for display
 */
export function getCommandsByCategory(): Record<string, KeyboardCommand[]> {
  const grouped: Record<string, KeyboardCommand[]> = {};

  for (const command of KEYBOARD_COMMANDS) {
    if (!grouped[command.category]) {
      grouped[command.category] = [];
    }
    grouped[command.category].push(command);
  }

  return grouped;
}
