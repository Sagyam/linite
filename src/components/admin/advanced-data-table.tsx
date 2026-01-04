'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Loader2 } from 'lucide-react';

interface AdvancedDataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onFetchNextPage?: () => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
}

export function AdvancedDataTable<TData>({
  columns: columnsProp,
  data,
  isFetchingNextPage = false,
  hasNextPage = false,
  onFetchNextPage,
  onEdit,
  onDelete,
  getRowId,
  enableGlobalFilter = true,
  globalFilterPlaceholder = 'Search...',
}: AdvancedDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Add actions column if onEdit or onDelete are provided
  const columns: ColumnDef<TData>[] = [
    ...columnsProp,
    ...(onEdit || onDelete
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
              <div className="flex justify-end space-x-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(row.original)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(row.original)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          } as ColumnDef<TData>,
        ]
      : []),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: getRowId ? (row: TData) => getRowId(row) : undefined,
  });

  // Virtual scrolling setup
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // Estimated row height
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  // Infinite scroll trigger
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (
          scrollHeight - scrollTop - clientHeight < 300 &&
          !isFetchingNextPage &&
          hasNextPage
        ) {
          onFetchNextPage?.();
        }
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage]
  );

  // Attach scroll listener
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => fetchMoreOnBottomReached(container);
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [fetchMoreOnBottomReached]);

  return (
    <div className="space-y-4">
      {enableGlobalFilter && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={globalFilterPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-auto"
        style={{ maxHeight: '600px' }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? 'flex items-center gap-2 cursor-pointer select-none'
                              : ''
                          }
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="ml-auto">
                              {sorted === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : sorted === 'desc' ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow key={row.id} data-index={virtualRow.index}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
            {isFetchingNextPage && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-12 text-center"
                >
                  <Loader2 className="h-4 w-4 animate-spin inline-block" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} total
          rows
        </div>
      )}
    </div>
  );
}
