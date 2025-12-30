'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export interface CrudDialogsState<T> {
  dialogOpen: boolean;
  deleteDialogOpen: boolean;
  editingItem: T | null;
  deletingItem: T | null;
}

export interface CrudDialogsActions<T> {
  openCreateDialog: () => void;
  openEditDialog: (item: T) => void;
  openDeleteDialog: (item: T) => void;
  closeDialog: () => void;
  closeDeleteDialog: () => void;
  handleSubmit: (url: string, method: string, body: unknown, successMessage: string) => Promise<void>;
  confirmDelete: (deleteMutation: { mutate: (id: string, options?: any) => void }, getId: (item: T) => string) => void;
}

/**
 * Hook to manage CRUD dialog states and actions
 * Handles common dialog operations for create, edit, and delete
 */
export function useCrudDialogs<T>(): CrudDialogsState<T> & CrudDialogsActions<T> {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);

  const openCreateDialog = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: T) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const openDeleteDialog = (item: T) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleSubmit = async (
    url: string,
    method: string,
    body: unknown,
    successMessage: string
  ) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(successMessage);
        closeDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    }
  };

  const confirmDelete = (
    deleteMutation: { mutate: (id: string, options?: any) => void },
    getId: (item: T) => string
  ) => {
    if (!deletingItem) return;

    deleteMutation.mutate(getId(deletingItem), {
      onSuccess: () => {
        closeDeleteDialog();
      },
    });
  };

  return {
    dialogOpen,
    deleteDialogOpen,
    editingItem,
    deletingItem,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialog,
    closeDeleteDialog,
    handleSubmit,
    confirmDelete,
  };
}
