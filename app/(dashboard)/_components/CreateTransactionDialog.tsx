"use client";

import { PermissionGuard } from "@/components/PermissionGuard";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionType } from "@/lib/type";
import { cn } from "@/lib/utils";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
} from "@/schema/transaction";
import { ReactNode, useCallback, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CategoryPicker from "./CategoryPicker";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Loader2,
  Plus,
  Trash,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateTransaction } from "../_actions/transaction";
import {
  GetWorkspaceMembers,
  GetActiveWorkspace,
} from "../_actions/workspaces";
import { toast } from "sonner";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helper";
import { Category } from "@prisma/client";
import { useMemo } from "react";
import TagSelector from "./TagSelector";
import FileUpload from "./FileUpload";
import { Textarea } from "@/components/ui/textarea";
import { useCheckBudgetAlert } from "@/lib/useCheckBudgetAlert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAchievementToast } from "@/hooks/use-achievement-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

interface Props {
  trigger?: ReactNode;
  type: TransactionType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialCategory?: string;
  initialCategoryIcon?: string;
}

const CreateTransactionDialog = ({
  trigger,
  type,
  open: externalOpen,
  onOpenChange,
  initialCategory,
  initialCategoryIcon,
}: Props) => {
  const { user } = useUser();
  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type,
      date: new Date(),
      description: "",
      amount: 0,
      category: initialCategory || "",
      billSplits: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isMemberSplit, setIsMemberSplit] = useState(false);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [selectedTags, setSelectedTags] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [attachments, setAttachments] = useState<
    {
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
    }[]
  >([]);

  const { data: activeWorkspace } = useQuery({
    queryKey: ["active-workspace"],
    queryFn: () => GetActiveWorkspace(),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(activeWorkspace?.currency || "USD");
  }, [activeWorkspace?.currency]);

  const currencySymbol = useMemo(() => {
    const parts = formatter.formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value || "$";
  }, [formatter]);

  const { data: members } = useQuery({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: () => GetWorkspaceMembers(activeWorkspace!.id),
    enabled: !!activeWorkspace?.id && isMemberSplit,
  });

  const handleCategoryChange = useCallback(
    (value: Category) => {
      form.setValue("category", value.name);
    },
    [form],
  );

  // Set initial category when dialog opens
  useEffect(() => {
    if (open && initialCategory) {
      form.setValue("category", initialCategory);
    }
  }, [open, initialCategory, form]);

  // Watch form values for budget alert checking
  const watchedCategory = form.watch("category");
  const watchedAmount = form.watch("amount");

  // Check budget alerts in real-time (only for expenses)
  const { data: budgetAlertData } = useCheckBudgetAlert(
    watchedCategory,
    watchedAmount,
    type === "expense" && !!watchedCategory && watchedAmount > 0,
  );

  const queryClient = useQueryClient();
  const { showAchievement } = useAchievementToast();

  const { mutate, isPending } = useMutation({
    mutationFn: CreateTransaction,
    onSuccess: (data: any) => {
      toast.success("Transaction created Successfully", {
        id: "create-transaction",
      });

      if (data?.unlockedAchievements) {
        showAchievement(data.unlockedAchievements);
      }

      // Show budget alert toast if there was a warning
      if (budgetAlertData?.hasAlert && budgetAlertData.alert) {
        const alert = budgetAlertData.alert;
        if (alert.level === "danger") {
          toast.error(alert.message, {
            id: "budget-alert",
            duration: 5000,
            description: `You've spent ${formatter.format(alert.spent)} of your ${formatter.format(alert.budgetAmount)} budget`,
          });
        } else if (alert.level === "warning") {
          toast.warning(alert.message, {
            id: "budget-alert",
            duration: 5000,
            description: `You've used ${alert.percentage.toFixed(0)}% of your budget`,
          });
        }
      }

      form.reset({
        type,
        description: "",
        notes: "",
        amount: 0,
        date: new Date(),
        category: "",
        billSplits: [],
      });
      setSelectedTags([]);
      setAttachments([]);
      setIsMemberSplit(false);
      setIsSplitMode(false);

      queryClient.invalidateQueries({
        queryKey: ["overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budget-progress"],
      });
      queryClient.invalidateQueries({
        queryKey: ["gamification"],
      });
      setOpen(false);
    },
  });

  const onSubmit = useCallback(
    (values: CreateTransactionSchemaType) => {
      if (isSplitMode) {
        const total = values.amount;
        const splitTotal =
          values.splits?.reduce((a, b) => a + b.amount, 0) || 0;
        if (Math.abs(total - splitTotal) > 0.01) {
          toast.error(
            `Split amounts (${formatter.format(splitTotal)}) must equal total amount (${formatter.format(total)})`,
          );
          return;
        }

        // Calculate percentages
        if (values.splits) {
          values.splits = values.splits.map((split) => ({
            ...split,
            percentage: total > 0 ? (split.amount / total) * 100 : 0,
          }));
        }
      } else {
        values.splits = undefined;
      }

      if (isMemberSplit) {
        const total = values.amount;
        const memberTotal =
          values.billSplits?.reduce((a, b) => a + b.amount, 0) || 0;
        if (memberTotal > total) {
          toast.error(
            `Member split amounts (${formatter.format(memberTotal)}) cannot exceed total amount (${formatter.format(total)})`,
          );
          return;
        }
      } else {
        values.billSplits = undefined;
      }

      toast.loading("Creating transaction...", { id: "create-transaction" });
      mutate({
        ...values,
        date: DateToUTCDate(values.date),
        tags: selectedTags.map((tag) => tag.id),
        attachments: attachments,
        splits: isSplitMode ? values.splits : undefined,
        billSplits: isMemberSplit ? values.billSplits : undefined,
      });
    },
    [mutate, selectedTags, attachments, isSplitMode, isMemberSplit, formatter],
  );

  return (
    <PermissionGuard>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              Create a new
              <span
                className={cn(
                  "m-1",
                  type === "income"
                    ? "text-emerald-500"
                    : type === "expense"
                      ? "text-red-500"
                      : "text-blue-500",
                )}
              >
                {type}
              </span>
              transaction
            </DialogTitle>
            <DialogDescription>
              Add a new {type} transaction to track your finances
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Transaction Description (optional)
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  name="notes"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Add additional notes or details..."
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes about this transaction
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                  />
                  <FormDescription>
                    Add tags to organize this transaction
                  </FormDescription>
                </div>

                {/* Attachments */}
                <FileUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />

                <FormField
                  name="amount"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Transaction Amount (required)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Budget Alert Display */}
                {budgetAlertData?.hasAlert && budgetAlertData.alert && (
                  <Alert
                    variant={
                      budgetAlertData.alert.level === "danger"
                        ? "destructive"
                        : "default"
                    }
                    className={cn(
                      "border-2",
                      budgetAlertData.alert.level === "danger"
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                        : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {budgetAlertData.alert.level === "danger" ? (
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertTitle className="text-sm font-semibold mb-1">
                          {budgetAlertData.alert.level === "danger"
                            ? "🚨 Budget Exceeded!"
                            : "⚠️ Budget Warning"}
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          {budgetAlertData.alert.message}
                        </AlertDescription>
                        <div className="mt-2 text-xs opacity-80">
                          Budget:{" "}
                          {formatter.format(budgetAlertData.alert.budgetAmount)}{" "}
                          | Will spend:{" "}
                          {formatter.format(budgetAlertData.alert.spent)} (
                          {budgetAlertData.alert.percentage.toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="flex items-center space-x-2 py-4 border-t border-b border-muted/50 my-4">
                  <Switch
                    id="split-mode"
                    checked={isSplitMode}
                    onCheckedChange={(checked) => {
                      setIsSplitMode(checked);
                      if (checked && fields.length === 0) {
                        append({
                          category: "",
                          categoryIcon: "",
                          amount: 0,
                          percentage: 0,
                        });
                        append({
                          category: "",
                          categoryIcon: "",
                          amount: 0,
                          percentage: 0,
                        });
                      }
                      if (!checked) {
                        form.setValue("splits", []);
                      }
                    }}
                  />
                  <Label htmlFor="split-mode" className="font-semibold">
                    Split Transaction
                  </Label>
                </div>

                {isSplitMode && (
                  <div className="space-y-4 mb-4">
                    <div className="flex gap-2 px-1">
                      <Label className="flex-1 ml-1">Category</Label>
                      <Label className="w-32 ml-1">Amount</Label>
                      <div className="w-8"></div>
                    </div>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <FormItem className="flex-1 space-y-0">
                          <FormLabel className="sr-only">Category</FormLabel>
                          <FormControl>
                            <CategoryPicker
                              type={type}
                              className="w-full"
                              onChange={(cat) => {
                                form.setValue(
                                  `splits.${index}.category`,
                                  cat.name,
                                );
                                form.setValue(
                                  `splits.${index}.categoryIcon`,
                                  cat.icon,
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem className="w-32 space-y-0">
                          <FormLabel className="sr-only">Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...form.register(`splits.${index}.amount`, {
                                valueAsNumber: true,
                              })}
                            />
                          </FormControl>
                          <div className="text-[10px] text-muted-foreground mt-0.5 px-1">
                            {(
                              ((form.watch(`splits.${index}.amount`) || 0) /
                                (form.watch("amount") || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </FormItem>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            remove(index);
                            if (fields.length === 1) {
                              setIsSplitMode(false);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() =>
                        append({
                          category: "",
                          categoryIcon: "",
                          amount: 0,
                          percentage: 0,
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Split
                    </Button>
                    <div className="text-sm text-muted-foreground mt-2">
                      Total Split:{" "}
                      {formatter.format(
                        form
                          .watch("splits")
                          ?.reduce(
                            (acc, curr) => acc + (curr.amount || 0),
                            0,
                          ) || 0,
                      )}{" "}
                      / {formatter.format(form.watch("amount"))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 py-4 border-b border-muted/50 my-4">
                  <Switch
                    id="member-split"
                    checked={isMemberSplit}
                    onCheckedChange={(checked) => {
                      setIsMemberSplit(checked);
                      if (!checked) {
                        form.setValue("billSplits", []);
                      }
                    }}
                  />
                  <Label htmlFor="member-split" className="font-semibold">
                    Split with Members (Who owes me?)
                  </Label>
                </div>

                {isMemberSplit && (
                  <div className="space-y-4 mb-4 p-4 bg-muted/30 rounded-2xl border border-dashed border-primary/20">
                    <p className="text-xs text-muted-foreground mb-4">
                      Select members who owe you money for this transaction. You
                      can split by amount or divide equally.
                    </p>
                    <div className="space-y-3">
                      {members
                        ?.filter((m) => m.userId !== user?.id)
                        .map((member) => {
                          const split = form
                            .watch("billSplits")
                            ?.find((s) => s.debtorId === member.userId);
                          const isSelected = !!split;

                          return (
                            <div
                              key={member.userId}
                              className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-xl hover:bg-background/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-background shrink-0">
                                  <AvatarImage src={member.imageUrl || ""} />
                                  <AvatarFallback className="text-[9px] sm:text-[10px] bg-primary/10 text-primary">
                                    {member.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold leading-none truncate">
                                    {member.name}
                                  </p>
                                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
                                    Owes you
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-auto">
                                {isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                        {currencySymbol}
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="h-7 w-20 sm:w-24 pl-4 text-xs sm:text-sm"
                                        value={split.amount || ""}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const currentSplits =
                                            form.getValues("billSplits") || [];
                                          form.setValue(
                                            "billSplits",
                                            currentSplits.map((s) =>
                                              s.debtorId === member.userId
                                                ? { ...s, amount: val }
                                                : s,
                                            ),
                                          );
                                        }}
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => {
                                        const currentSplits =
                                          form.getValues("billSplits") || [];
                                        form.setValue(
                                          "billSplits",
                                          currentSplits.filter(
                                            (s) => s.debtorId !== member.userId,
                                          ),
                                        );
                                      }}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const currentSplits =
                                        form.getValues("billSplits") || [];
                                      form.setValue("billSplits", [
                                        ...currentSplits,
                                        {
                                          debtorId: member.userId,
                                          debtorName: member.name,
                                          amount: 0,
                                        },
                                      ]);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {form.watch("billSplits") &&
                      form.watch("billSplits")!.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-primary/10 flex justify-between items-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary"
                            onClick={() => {
                              const count =
                                form.getValues("billSplits")?.length || 0;
                              if (count > 0) {
                                const equalAmount = Number(
                                  (watchedAmount / (count + 1)).toFixed(2),
                                );
                                const currentSplits =
                                  form.getValues("billSplits") || [];
                                form.setValue(
                                  "billSplits",
                                  currentSplits.map((s) => ({
                                    ...s,
                                    amount: equalAmount,
                                  })),
                                );
                              }
                            }}
                          >
                            Split Equally
                          </Button>
                          <div className="text-xs font-bold">
                            Total Owed:{" "}
                            {formatter.format(
                              form
                                .watch("billSplits")
                                ?.reduce((a, b) => a + b.amount, 0) || 0,
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  {" "}
                  <FormField
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <CategoryPicker
                            type={type}
                            onChange={handleCategoryChange}
                            defaultValue={watchedCategory}
                          />
                        </FormControl>
                        <FormDescription>
                          Select a category for this transaction
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="date"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Transaction Date </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[200px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span> Pick a date </span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(value) => {
                                if (!value) return;
                                field.onChange(value);
                              }}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        <FormDescription>
                          Select a date for this Transaction{" "}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>
          <DialogFooter className="px-6 pb-6 pt-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant={"secondary"}
                onClick={() => {
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {!isPending && "Create"}
              {isPending && <Loader2 className="animate-spin" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
};

export default CreateTransactionDialog;
