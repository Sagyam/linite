'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export interface UseClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  resetDelay?: number;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard',
    resetDelay = 2000,
  } = options;

  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), resetDelay);
    } catch {
      toast.error(errorMessage);
    }
  };

  return { copied, copy };
}

/**
 * Hook for managing multiple clipboard states (e.g., array of items)
 */
export function useMultiClipboard(options: UseClipboardOptions = {}) {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard',
    resetDelay = 2000,
  } = options;

  const [copiedItems, setCopiedItems] = useState<Record<number | string, boolean>>({});

  const copy = async (text: string, key: number | string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems((prev) => ({ ...prev, [key]: true }));
      toast.success(successMessage);
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }, resetDelay);
    } catch {
      toast.error(errorMessage);
    }
  };

  return { copiedItems, copy };
}
