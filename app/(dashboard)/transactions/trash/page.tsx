"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RestoreTransaction } from "../_actions/restoreTransaction";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TrashPage = () => {
  const queryClient = useQueryClient();

  const deletedTransactions = useQuery({
    queryKey: ["transactions", "deleted"],
    queryFn: () => fetch("/api/transactions/deleted").then((res) => res.json()),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => RestoreTransaction(id),
    onSuccess: () => {
      toast.success("Transaction restored successfully");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "deleted"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to restore transaction");
    },
  });

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/transactions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Trash2 className="h-8 w-8 text-rose-500" />
                Trash Bin
              </p>
              <p className="text-muted-foreground">
                View and restore recently deleted transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <SkeletonWrapper isLoading={deletedTransactions.isLoading}>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Amount</TableHead>
                  <TableHead className="text-right">Deleted At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedTransactions.data && deletedTransactions.data.length > 0 ? (
                  deletedTransactions.data.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-muted-foreground">
                          {format(new Date(transaction.date), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{transaction.categoryIcon}</span>
                          <span className="capitalize">{transaction.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            "capitalize rounded-lg px-2 py-1 text-xs inline-block",
                            transaction.type === "income" && "bg-emerald-500/10 text-emerald-500",
                            transaction.type === "expense" && "bg-rose-500/10 text-rose-500",
                            transaction.type === "investment" && "bg-indigo-500/10 text-indigo-500"
                          )}
                        >
                          {transaction.type}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {transaction.formattedAmount}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {format(new Date(transaction.deletedAt), "PPp")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 ml-auto"
                          onClick={() => restoreMutation.mutate(transaction.id)}
                          disabled={restoreMutation.isPending}
                        >
                          {restoreMutation.isPending &&
                          restoreMutation.variables === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Trash is empty. Deleted transactions will appear here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SkeletonWrapper>
      </div>
    </>
  );
};

export default TrashPage;
