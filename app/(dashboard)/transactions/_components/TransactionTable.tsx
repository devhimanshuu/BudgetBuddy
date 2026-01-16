"use client ";

import { getTransactionHistoryResponseType } from "@/app/api/transaction-history/route";
import { DateToUTCDate } from "@/lib/helper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { useMemo, useState } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { DataTableColumnHeader } from "@/components/datatable/ColumnHeader";
import { cn } from "@/lib/utils";
import { DataTableFacetedFilter } from "@/components/datatable/FacetedFilters";
import { DataTableViewOptions } from "@/components/datatable/ColumnToggle";
import { Button } from "@/components/ui/button";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { DownloadIcon, MoreHorizontal, TrashIcon, FileText, Split, StickyNote } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteTransactionDialog from "./DeleteTransactionDialog";
import { exportTransactionsToPDF } from "@/lib/pdf-export";
import { SearchFilters } from "../../_components/AdvancedSearch";
import { Checkbox } from "@/components/ui/checkbox";
import AttachmentDialog from "./AttachmentDialog";
import { Tag, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { DeleteTransaction } from "../_actions/deleteTransaction";

interface Props {
  from: Date;
  to: Date;
  searchFilters?: SearchFilters;
}
const emptyData: any[] = [];
type TransactionHistoryRow = getTransactionHistoryResponseType[0] & {
  tags: { tag: { id: string; name: string; color: string } }[];
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }[];
  splits: {
    id: string;
    category: string;
    categoryIcon: string;
    amount: number;
    percentage: number;
  }[];
  notes?: string;
};

const columns: ColumnDef<TransactionHistoryRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => (
      <div className="flex gap-2 capitalize">
        {row.original.categoryIcon}
        <div className="capitalize">{row.original.category}</div>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.original.description}</div>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate" title={row.original.notes || ""}>
        {row.original.notes ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <StickyNote className="h-3 w-3" />
            <span className="text-xs">{row.original.notes}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/50 text-xs">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags && row.original.tags.length > 0 ? (
          row.original.tags.map((item) => {
            if (!item || !item.tag) return null;
            const { tag } = item;
            return (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-sm px-1 text-[10px] font-medium ring-1 ring-inset"
                style={{
                  backgroundColor: tag.color + "15",
                  color: tag.color,
                  "--tw-ring-color": tag.color + "30",
                } as React.CSSProperties}
              >
                #{tag.name}
              </span>
            );
          })
        ) : (
          <span className="text-muted-foreground/50 text-xs">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "splits",
    header: "Splits",
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.splits && row.original.splits.length > 0 ? (
          <div className="flex items-center gap-1" title={`${row.original.splits.length} splits`}>
            <Split className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {row.original.splits.length}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/50 text-xs">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      const formattedDate = date.toLocaleDateString("default", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return <div className="text-muted-foreground">{formattedDate}</div>;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => (
      <div
        className={cn(
          "capitalize rounded-lg text-center p-2",
          row.original.type === "income" &&
          "bg-emerald-400/10 text-emerald-500",
          row.original.type === "expense" && "bg-red-400/10 text-red-500"
        )}
      >
        {row.original.type}
      </div>
    ),
  },
  {
    accessorKey: "attachments",
    header: "Attachments",
    cell: ({ row }) => <AttachmentCell transaction={row.original} />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <p className="text-md rounded-lg bg-gray-400/5 p-2 text-center font-medium">
        {row.original.formattedAmount}
      </p>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions transaction={row.original} />,
  },
];

const csvConfig = mkConfig({
  fieldSeparator: ",",
  decimalSeparator: ",",
  useKeysAsHeaders: true,
});
const TransactionTable = ({ from, to, searchFilters }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({}); // Row selection state
  const history = useQuery<getTransactionHistoryResponseType>({
    queryKey: ["transactions", "history", from, to, searchFilters],
    queryFn: async () => {
      // If search filters are active (and have at least one criteria set), use search API
      const hasSearchFilters = searchFilters && Object.values(searchFilters).some(val =>
        val !== "" && (Array.isArray(val) ? val.length > 0 : true)
      );

      if (hasSearchFilters) {
        const params = new URLSearchParams();
        if (searchFilters.query) params.append("query", searchFilters.query);
        if (searchFilters.category) params.append("category", searchFilters.category);
        if (searchFilters.type) params.append("type", searchFilters.type);
        if (searchFilters.minAmount) params.append("minAmount", searchFilters.minAmount);
        if (searchFilters.maxAmount) params.append("maxAmount", searchFilters.maxAmount);
        if (searchFilters.tags && searchFilters.tags.length > 0) {
          params.append("tags", searchFilters.tags.map(t => t.id).join(","));
        }
        // Use search filter dates if provided, otherwise fallback to page dates
        if (searchFilters.from) params.append("from", searchFilters.from);
        else params.append("from", DateToUTCDate(from).toISOString());

        if (searchFilters.to) params.append("to", searchFilters.to);
        else params.append("to", DateToUTCDate(to).toISOString());

        const response = await fetch(`/api/transactions/search?${params.toString()}`);
        const data = await response.json();
        return data.transactions;
      }

      return fetch(
        `/api/transaction-history?from=${DateToUTCDate(
          from
        )}&to=${DateToUTCDate(to)}`
      ).then((res) => res.json());
    },
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });

  const handleExportCSV = (data: any[]) => {
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  const handleExportPDF = () => {
    if (!history.data || !userSettings.data) return;

    const filteredData = table.getFilteredRowModel().rows.map((row) => ({
      id: row.original.id,
      date: row.original.date,
      description: row.original.description,
      amount: row.original.amount,
      type: row.original.type,
      category: row.original.category,
      categoryIcon: row.original.categoryIcon,
    }));

    exportTransactionsToPDF(filteredData, {
      title: "Transaction History",
      dateRange: { from, to },
      currency: userSettings.data.currency,
    });
  };

  const table = useReactTable<TransactionHistoryRow>({
    data: (history.data || emptyData) as TransactionHistoryRow[],
    columns,
    getCoreRowModel: getCoreRowModel(),

    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const queryClient = useQueryClient(); // For invalidating queries

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((r) => r.original.id);

    if (ids.length === 0) return;

    toast.loading(`Deleting ${ids.length} transactions...`, { id: "bulk-delete" });

    try {
      await Promise.all(ids.map((id) => DeleteTransaction(id)));
      toast.success("Transactions deleted", { id: "bulk-delete" });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e) {
      toast.error("Failed to delete some transactions", { id: "bulk-delete" });
    }
  };

  const categoriesOptions = useMemo(() => {
    const categoriesMap = new Map();
    history.data?.forEach((transaction) => {
      categoriesMap.set(transaction.category, {
        value: transaction.category,
        label: `${transaction.categoryIcon} ${transaction.category}`,
      });
    });
    const uniqueCategories = new Set(categoriesMap.values());
    return Array.from(uniqueCategories);
  }, [history.data]);
  return (
    <div className="w-full ">
      <div className="flex flex-wrap items-end justify-between gap-2 py-4">
        <div className="flex gap-2">
          {table.getColumn("category") && (
            <DataTableFacetedFilter
              title="Category"
              column={table.getColumn("category")}
              options={categoriesOptions}
            />
          )}
          {table.getColumn("type") && (
            <DataTableFacetedFilter
              title="Type"
              column={table.getColumn("type")}
              options={[
                { label: "Income", value: "income" },
                { label: "Expense", value: "expense" },
              ]}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={"outline"}
            size={"sm"}
            className="ml-auto h-8 lg:flex"
            onClick={() => {
              const data = table.getFilteredRowModel().rows.map((row) => ({
                category: row.original.category,
                categoryIcon: row.original.categoryIcon,
                description: row.original.description,
                type: row.original.type,
                amount: row.original.amount,
                formattedAmount: row.original.formattedAmount,
                date: row.original.date,
                notes: row.original.notes || "",
                tags: row.original.tags.map((t) => t.tag.name).join(", "),
              }));
              handleExportCSV(data);
            }}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant={"outline"}
            size={"sm"}
            className="h-8 lg:flex"
            onClick={handleExportPDF}
            disabled={!userSettings.data}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
      {/* Bulk Actions Toolbar */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-dashed bg-muted/50 p-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground ml-2">
              {table.getFilteredSelectedRowModel().rows.length} selected
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
      <SkeletonWrapper isLoading={history.isFetching}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </SkeletonWrapper>
    </div>
  );
};

export default TransactionTable;

function RowActions({ transaction }: { transaction: TransactionHistoryRow }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  return (
    <>
      <DeleteTransactionDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        transactionId={transaction.id}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={() => {
              setShowDeleteDialog((prev) => !prev);
            }}
          >
            <TrashIcon className="h-4 w-4 text-muted-foreground" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function AttachmentCell({ transaction }: { transaction: TransactionHistoryRow }) {
  const [open, setOpen] = useState(false);

  if (!transaction.attachments || transaction.attachments.length === 0) {
    return <div className="w-8" />; // Placeholder to keep alignment if needed, or null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <Paperclip className="h-4 w-4 text-muted-foreground" />
      </Button>
      <AttachmentDialog
        open={open}
        setOpen={setOpen}
        attachments={transaction.attachments}
      />
    </>
  );
}
