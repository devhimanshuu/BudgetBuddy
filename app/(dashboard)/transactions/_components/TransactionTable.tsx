"use client";

import { getTransactionHistoryResponseType } from "@/app/api/transaction-history/route";
import { DateToUTCDate, GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
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
import { DownloadIcon, MoreHorizontal, TrashIcon, FileText, StickyNote, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteTransactionDialog from "./DeleteTransactionDialog";
import EditTransactionDialog from "./EditTransactionDialog";
import { exportTransactionsToPDF } from "@/lib/pdf-export";
import { SearchFilters } from "../../_components/AdvancedSearch";
import { Checkbox } from "@/components/ui/checkbox";
import AttachmentDialog from "./AttachmentDialog";
import SplitDetailsPopover from "./SplitDetailsPopover";
import NoteDetailsPopover from "./NoteDetailsPopover";
import TagsPopover from "./TagsPopover";
import { Tag, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { DeleteTransaction } from "../_actions/deleteTransaction";
import TransactionHistoryPopover from "./TransactionHistoryPopover";
import BulkTagDialog from "./BulkTagDialog";

import { usePrivacyMode } from "@/components/providers/PrivacyProvider";

interface Props {
  from: Date;
  to: Date;
  searchFilters?: SearchFilters;
  allCategories?: any[];
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
  _count: {
    history: number;
  };
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
    meta: {
      className: "",
    },
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
      <div className="max-w-[150px]">
        {row.original.notes ? (
          <NoteDetailsPopover note={row.original.notes} />
        ) : (
          <span className="text-muted-foreground/50 text-xs">-</span>
        )}
      </div>
    ),
    meta: {
      className: "",
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags && row.original.tags.length > 0 ? (
          <TagsPopover tags={row.original.tags} />
        ) : (
          <span className="text-muted-foreground/50 text-xs">-</span>
        )}
      </div>
    ),
    meta: {
      className: "",
    },
  },
  {
    accessorKey: "splits",
    header: "Splits",
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.splits && row.original.splits.length > 0 ? (
          <SplitDetailsPopover
            splits={row.original.splits}
            transactionType={row.original.type}
          />
        ) : (
          <span className="text-muted-foreground/50 text-xs">-</span>
        )}
      </div>
    ),
    meta: {
      className: "",
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row, table }) => {
      const date = new Date(row.original.date);
      const formattedDate = date.toLocaleDateString("default", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      // @ts-ignore
      const currency = table.options.meta?.userSettings?.currency || "USD";

      return (
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{formattedDate}</div>
          {row.original._count?.history > 0 && (
            <TransactionHistoryPopover
              transactionId={row.original.id}
              currentAmount={row.original.amount}
              currentDescription={row.original.description}
              currentCategory={row.original.category}
              currentCategoryIcon={row.original.categoryIcon}
              currentDate={new Date(row.original.date)}
              currentTagIds={row.original.tags?.map((t) => t.tag.name) || []}
              currency={currency}
            />
          )}
        </div>
      );
    },
    meta: {
      className: "",
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
    meta: {
      className: "",
    },
  },
  {
    accessorKey: "attachments",
    header: "Attachments",
    cell: ({ row }) => <AttachmentCell transaction={row.original} />,
    meta: {
      className: "",
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row, table }) => {
      const { isPrivacyMode, userSettings } = table.options.meta as any;
      const formatter = GetFormatterForCurrency(userSettings?.currency || "USD");
      return (
        <p className={cn(
          "text-md rounded-lg p-2 text-center font-medium",
          row.original.type === "income" && "bg-emerald-400/10 text-emerald-500",
          row.original.type === "expense" && "bg-red-400/10 text-red-500"
        )}>
          {isPrivacyMode ? GetPrivacyMask(formatter) : row.original.formattedAmount}
        </p>
      );
    },
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
const TransactionTable = ({ from, to, searchFilters, allCategories }: Props) => {
  const { isPrivacyMode } = usePrivacyMode();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({}); // Row selection state
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
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

    const { calculateLevel } = require("@/lib/gamification");
    const levelInfo = calculateLevel(userSettings.data?.totalPoints || 0);

    exportTransactionsToPDF(filteredData, {
      title: "Transaction History",
      dateRange: { from, to },
      currency: userSettings.data.currency,
      isAdvanced: levelInfo.currentLevel.level >= 7,
      tier: levelInfo.tier,
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
    meta: {
      userSettings: userSettings.data,
      isPrivacyMode,
    },
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
    // If allCategories is provided, use it; otherwise fall back to categories from visible transactions
    if (allCategories && allCategories.length > 0) {
      // Create a map of category names to icons from visible transactions
      const iconMap = new Map();
      history.data?.forEach((transaction) => {
        if (!iconMap.has(transaction.category)) {
          iconMap.set(transaction.category, transaction.categoryIcon);
        }
      });

      // Use all categories with their icons
      return allCategories.map((category) => ({
        value: category.name,
        label: `${category.icon} ${category.name}`,
      }));
    }

    // Fallback: build from visible transactions
    const categoriesMap = new Map();
    history.data?.forEach((transaction) => {
      categoriesMap.set(transaction.category, {
        value: transaction.category,
        label: `${transaction.categoryIcon} ${transaction.category}`,
      });
    });
    const uniqueCategories = new Set(categoriesMap.values());
    return Array.from(uniqueCategories);
  }, [history.data, allCategories]);
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-dashed bg-muted/50 p-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
              {table.getFilteredSelectedRowModel().rows.length} selected
            </span>

            <div className="flex items-center gap-3 text-sm ml-2 sm:ml-0">
              {(() => {
                const selectedRows = table.getFilteredSelectedRowModel().rows;
                let income = 0;
                let expense = 0;
                selectedRows.forEach(row => {
                  if (row.original.type === 'income') income += row.original.amount;
                  if (row.original.type === 'expense') expense += row.original.amount;
                });
                const formatter = GetFormatterForCurrency(userSettings.data?.currency || 'USD');

                return (
                  <>
                    {income > 0 && (
                      <span className="text-emerald-500">Income: {formatter.format(income)}</span>
                    )}
                    {expense > 0 && (
                      <span className="text-red-500">Expense: {formatter.format(expense)}</span>
                    )}
                    {(income > 0 || expense > 0) && (
                      <span className="font-bold border-l pl-3">Net: {formatter.format(income - expense)}</span>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkTagDialog(true)}
            >
              <Tag className="mr-2 h-4 w-4" />
              Update Tags
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
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
                      <TableHead key={header.id} className={(header.column.columnDef.meta as any)?.className}>
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
                      <TableCell key={cell.id} className={(cell.column.columnDef.meta as any)?.className}>
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
        <div className="flex items-center justify-center space-x-2 py-4">
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
      <BulkTagDialog
        open={showBulkTagDialog}
        setOpen={setShowBulkTagDialog}
        transactionIds={table.getFilteredSelectedRowModel().rows.map(r => r.original.id)}
        onSuccess={() => setRowSelection({})}
      />
    </div>
  );
};

export default TransactionTable;

function RowActions({ transaction }: { transaction: TransactionHistoryRow }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  return (
    <>
      <EditTransactionDialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        transaction={transaction}
      />
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
              setShowEditDialog((prev) => !prev);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Edit
          </DropdownMenuItem>
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
