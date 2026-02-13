'use client';

import { useState, Suspense, ReactNode } from 'react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCrudDialogs } from '@/hooks/use-crud-dialogs';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QueryErrorBoundary } from '@/components/common/error-boundary';
import { DataTableSkeleton } from '@/components/ui/loading-skeletons';

interface CrudPageConfig<T, TFormData> {
  // Entity configuration
  entityName: string; // e.g., "Distribution"
  entityNamePlural: string; // e.g., "Distributions"
  entitySlug: string; // e.g., "distros"

  // API configuration
  apiEndpoint: string; // e.g., "/api/distros"

  // Data hooks
  useData: () => { data: T[] };
  useDelete: () => {
    mutate: (
      id: string,
      options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => void;
  };

  // Table configuration
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  globalFilterPlaceholder: string;

  // Form configuration
  initialFormData: TFormData;
  getFormDataFromItem: (item: T) => TFormData;
  renderFormFields: (formData: TFormData, setFormData: (data: TFormData) => void) => ReactNode;

  // Optional configuration
  dialogMaxWidth?: string; // e.g., "max-w-2xl"
  deleteDescription?: (item: T) => string;
}

type CrudTableProps<T, TFormData> = CrudPageConfig<T, TFormData>;

function CrudTable<T, TFormData>({
  entityName,
  entityNamePlural,
  apiEndpoint,
  useData,
  useDelete,
  columns,
  getRowId,
  globalFilterPlaceholder,
  initialFormData,
  getFormDataFromItem,
  renderFormFields,
  dialogMaxWidth = 'max-w-2xl',
  deleteDescription,
}: CrudTableProps<T, TFormData>) {
  const { data } = useData();
  const deleteMutation = useDelete();

  const {
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
  } = useCrudDialogs<T>();

  const [formData, setFormData] = useState<TFormData>(initialFormData);

  const handleAdd = () => {
    setFormData(initialFormData);
    openCreateDialog();
  };

  const handleEdit = (item: T) => {
    setFormData(getFormDataFromItem(item));
    openEditDialog(item);
  };

  const onSubmit = async () => {
    const url = editingItem
      ? `${apiEndpoint}/${getRowId(editingItem)}`
      : apiEndpoint;
    const method = editingItem ? 'PUT' : 'POST';
    const message = `${entityName} ${editingItem ? 'updated' : 'created'} successfully`;

    await handleSubmit(url, method, formData, message);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: entityNamePlural }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{entityNamePlural}</h1>
          <p className="text-muted-foreground mt-2">Manage {entityNamePlural.toLowerCase()}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add {entityName}
        </Button>
      </div>

      <AdvancedDataTable
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={openDeleteDialog}
        getRowId={getRowId}
        enableGlobalFilter={true}
        globalFilterPlaceholder={globalFilterPlaceholder}
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className={dialogMaxWidth}>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${entityName}` : `Add ${entityName}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update ${entityName.toLowerCase()} information`
                : `Create a new ${entityName.toLowerCase()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {renderFormFields(formData, setFormData)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        entityName={entityName}
        itemName={deletingItem ? (deletingItem as { name?: string }).name : undefined}
        onConfirm={() => confirmDelete(deleteMutation, getRowId)}
        description={deletingItem && deleteDescription ? deleteDescription(deletingItem) : undefined}
      />
    </div>
  );
}

export function CrudPage<T, TFormData>(props: CrudPageConfig<T, TFormData>) {
  return (
    <QueryErrorBoundary>
      <Suspense fallback={<DataTableSkeleton />}>
        <CrudTable {...props} />
      </Suspense>
    </QueryErrorBoundary>
  );
}
