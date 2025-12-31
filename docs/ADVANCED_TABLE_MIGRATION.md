# Advanced Data Table Migration Guide

## Summary

I've implemented a reusable `AdvancedDataTable` component with infinite scrolling, sorting, and global filtering using TanStack Table v8 and TanStack Virtual.

## What's Been Done

### 1. Installed Dependencies
```bash
bun add @tanstack/react-table @tanstack/react-virtual
```

### 2. Created `/src/components/admin/advanced-data-table.tsx`
Features:
- **Virtual Scrolling**: Renders only visible rows for performance
- **Infinite Scroll**: Automatically loads more data when scrolling near bottom
- **Column Sorting**: Click column headers to sort (supports asc/desc/none)
- **Global Filtering**: Single search box filters across all columns
- **Built-in Actions Column**: Edit and Delete buttons automatically added
- **Loading States**: Shows loading spinner and "loading more" indicator
- **Responsive**: Sticky header, max-height container with scroll

### 3. Updated Admin Pages

**✅ Completed:**
- `/admin/apps` - Apps page
- `/admin/distros` - Distributions page
- `/admin/sources` - Package sources page

**⚠️ Remaining (Follow pattern below):**
- `/admin/categories` - Categories page
- `/admin/packages` - Packages page

## Migration Pattern

### Old Code Pattern:
```tsx
import { DataTable, Column } from '@/components/admin/data-table';

const columns: Column<MyType>[] = [
  { header: 'Name', accessor: 'name' },
  { header: 'Custom', accessor: (row) => <div>{row.field}</div> },
];

<DataTable
  data={items}
  columns={columns}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getRowId={(row) => row.id}
/>
```

### New Code Pattern:
```tsx
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<MyType>[] = [
  {
    accessorKey: 'name',  // For direct field access
    header: 'Name',
    enableSorting: true,
  },
  {
    id: 'custom',  // For computed/custom columns
    header: 'Custom',
    cell: ({ row }) => <div>{row.original.field}</div>,
    accessorFn: (row) => row.field,  // For filtering
    enableSorting: false,
  },
];

<AdvancedDataTable
  data={items}
  columns={columns}
  isLoading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getRowId={(row) => row.id}
  enableGlobalFilter={true}
  globalFilterPlaceholder="Search..."
/>
```

## Key Changes

1. **Import Change**:
   - Old: `import { DataTable, Column } from '@/components/admin/data-table'`
   - New: `import { AdvancedDataTable } from '@/components/admin/advanced-data-table'`
   - Add: `import { ColumnDef } from '@tanstack/react-table'`

2. **Column Definition**:
   - Use `ColumnDef<T>[]` instead of `Column<T>[]`
   - For simple fields: Use `accessorKey: 'fieldName'`
   - For custom rendering: Use `cell: ({ row }) => ...` and access via `row.original`
   - For computed values: Use `accessorFn: (row) => ...` for filtering support
   - Add `enableSorting: true/false` for each column

3. **Component Usage**:
   - Add `isLoading` prop
   - Add `enableGlobalFilter` and `globalFilterPlaceholder` props
   - Remove separate search input (built into table now)
   - Remove separate loading check (`if (loading) return ...`)

## For Remaining Pages

### Categories Page (`/admin/categories/page.tsx`)

Replace:
```tsx
const columns: Column<Category>[] = [
  { header: 'Name', accessor: 'name' },
  { header: 'Slug', accessor: 'slug' },
  { header: 'Icon', accessor: 'icon' },
  { header: 'Display Order', accessor: 'displayOrder' },
];
```

With:
```tsx
const columns: ColumnDef<Category>[] = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'slug', header: 'Slug', enableSorting: true },
  { accessorKey: 'icon', header: 'Icon', enableSorting: false },
  { accessorKey: 'displayOrder', header: 'Display Order', enableSorting: true },
];
```

### Packages Page (`/admin/packages/page.tsx`)

Replace column accessor functions with proper cell renderers:
```tsx
const columns: ColumnDef<Package>[] = [
  {
    id: 'app',
    header: 'Application',
    accessorFn: (row) => row.app?.displayName || '-',
    cell: ({ row }) => row.original.app?.displayName || '-',
    enableSorting: true,
  },
  {
    id: 'source',
    header: 'Source',
    accessorFn: (row) => row.source?.name || '-',
    cell: ({ row }) => row.original.source?.name || '-',
    enableSorting: true,
  },
  {
    accessorKey: 'identifier',
    header: 'Package Identifier',
    enableSorting: true,
  },
  {
    id: 'available',
    header: 'Available',
    cell: ({ row }) => (
      <Badge variant={row.original.isAvailable ? 'default' : 'secondary'}>
        {row.original.isAvailable ? 'Yes' : 'No'}
      </Badge>
    ),
    enableSorting: false,
  },
];
```

## Features Available

- **Sorting**: Click any column header to toggle sort (asc → desc → none)
- **Global Filter**: Searches across ALL columns (even ones not displayed)
- **Virtual Scrolling**: Only renders ~20 rows at a time for performance
- **Infinite Scroll**: Can be enabled with `onFetchNextPage` prop
- **Sticky Header**: Table header stays visible while scrolling
- **Actions**: Edit/Delete buttons automatically added to each row
- **Loading States**: Built-in loading spinner and states

## Performance Benefits

- **Before**: Rendering 1000+ rows = slow, laggy scrolling
- **After**: Virtual scrolling renders only ~20 visible rows = smooth, fast
- **Filtering**: Client-side filtering across all data (searches entire dataset)
- **Memory**: Lower memory usage with virtualization
