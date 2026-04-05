"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RestoreTransaction } from "../_actions/restoreTransaction";
import { PermanentlyDeleteTransaction } from "../_actions/permanentlyDeleteTransaction";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => PermanentlyDeleteTransaction(id),
    onSuccess: () => {
      toast.success("Transaction permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["transactions", "deleted"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete transaction");
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
                {deletedTransactions.data &&
                deletedTransactions.data.length > 0 ? (
                  deletedTransactions.data.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-muted-foreground">
                          {format(new Date(transaction.date), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {transaction.categoryIcon}
                          </span>
                          <span className="capitalize">
                            {transaction.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            "capitalize rounded-lg px-2 py-1 text-xs inline-block",
                            transaction.type === "income" &&
                              "bg-emerald-500/10 text-emerald-500",
                            transaction.type === "expense" &&
                              "bg-rose-500/10 text-rose-500",
                            transaction.type === "investment" &&
                              "bg-indigo-500/10 text-indigo-500",
                          )}
                        >
                          {transaction.type}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {transaction.formattedAmount}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <div className="flex flex-col items-end">
                          <span className="text-muted-foreground">
                            {format(new Date(transaction.deletedAt), "PPp")}
                          </span>
                          {(() => {
                            const deletedAt = new Date(transaction.deletedAt);
                            const expiryDate = new Date(deletedAt);
                            expiryDate.setDate(expiryDate.getDate() + 30);
                            const now = new Date();
                            const diffTime =
                              expiryDate.getTime() - now.getTime();
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24),
                            );
                            return (
                              <span
                                className={cn(
                                  "font-bold",
                                  diffDays <= 7
                                    ? "text-rose-500"
                                    : "text-amber-500",
                                )}
                              >
                                Auto-deletes in {diffDays}{" "}
                                {diffDays === 1 ? "day" : "days"}
                              </span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() =>
                              restoreMutation.mutate(transaction.id)
                            }
                            disabled={
                              restoreMutation.isPending ||
                              deleteMutation.isPending
                            }
                          >
                            {restoreMutation.isPending &&
                            restoreMutation.variables === transaction.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Restore
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-2"
                                disabled={
                                  restoreMutation.isPending ||
                                  deleteMutation.isPending
                                }
                              >
                                {deleteMutation.isPending &&
                                deleteMutation.variables === transaction.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the transaction "
                                  {transaction.description}" and remove it from
                                  our Database.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-rose-500 hover:bg-rose-600 text-white"
                                  onClick={() =>
                                    deleteMutation.mutate(transaction.id)
                                  }
                                >
                                  Permanently Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
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
