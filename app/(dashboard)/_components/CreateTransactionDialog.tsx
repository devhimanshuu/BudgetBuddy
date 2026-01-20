"use client";

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
import { ReactNode, useCallback, useState } from "react";
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
import { CalendarIcon, Loader2, Plus, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTransaction } from "../_actions/transaction";
import { toast } from "sonner";
import { DateToUTCDate } from "@/lib/helper";
import { Category } from "@prisma/client";
import TagSelector from "./TagSelector";
import FileUpload from "./FileUpload";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  trigger?: ReactNode;
  type: TransactionType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CreateTransactionDialog = ({
  trigger,
  type,
  open: externalOpen,
  onOpenChange,
}: Props) => {
  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type,
      date: new Date(),
      description: "",
      amount: 0,
      category: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });
  const [isSplitMode, setIsSplitMode] = useState(false);

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

  const handleCategoryChange = useCallback(
    (value: Category) => {
      form.setValue("category", value.name);
    },
    [form]
  );

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: CreateTransaction,
    onSuccess: () => {
      toast.success("Transaction created Successfully", {
        id: "create-transaction",
      });
      form.reset({
        type,
        description: "",
        notes: "",
        amount: 0,
        date: new Date(),
        category: "",
      });
      setSelectedTags([]);
      setAttachments([]);

      queryClient.invalidateQueries({
        queryKey: ["overview"],
      });
      setOpen(false);
    },
  });

  const onSubmit = useCallback(
    (values: CreateTransactionSchemaType) => {
      if (isSplitMode) {
        const total = values.amount;
        const splitTotal = values.splits?.reduce((a, b) => a + b.amount, 0) || 0;
        if (Math.abs(total - splitTotal) > 0.01) {
          toast.error(`Split amounts ($${splitTotal.toFixed(2)}) must equal total amount ($${total.toFixed(2)})`);
          return;
        }

        // Calculate percentages
        if (values.splits) {
          values.splits = values.splits.map(split => ({
            ...split,
            percentage: total > 0 ? (split.amount / total) * 100 : 0
          }));
        }
      } else {
        values.splits = undefined;
      }

      toast.loading("Creating transaction...", { id: "create-transaction" });
      mutate({
        ...values,
        date: DateToUTCDate(values.date),
        tags: selectedTags.map((tag) => tag.id),
        attachments: attachments,
        splits: isSplitMode ? values.splits : undefined,
      });
    },
    [mutate, selectedTags, attachments, isSplitMode]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            Create a new
            <span
              className={cn(
                "m-1",
                type === "income" ? "text-emerald-500" : "text-red-500"
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
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                            e.target.value === "" ? 0 : Number(e.target.value);
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

              <div className="flex items-center space-x-2 py-4 border-t border-b border-muted/50 my-4">
                <Switch
                  id="split-mode"
                  checked={isSplitMode}
                  onCheckedChange={(checked) => {
                    setIsSplitMode(checked);
                    if (checked && fields.length === 0) {
                      append({ category: "", categoryIcon: "", amount: 0, percentage: 0 });
                      append({ category: "", categoryIcon: "", amount: 0, percentage: 0 });
                    }
                    if (!checked) {
                      form.setValue("splits", []);
                    }
                  }}
                />
                <Label htmlFor="split-mode" className="font-semibold">Split Transaction</Label>
              </div>

              {isSplitMode && (
                <div className="space-y-4 mb-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end">
                      <FormItem className="flex-1">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Category</FormLabel>
                        <FormControl>
                          <CategoryPicker type={type} onChange={(cat) => {
                            form.setValue(`splits.${index}.category`, cat.name);
                            form.setValue(`splits.${index}.categoryIcon`, cat.icon);
                          }} />
                        </FormControl>
                      </FormItem>
                      <FormItem className="w-32">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...form.register(`splits.${index}.amount`, { valueAsNumber: true })}
                          />
                        </FormControl>
                        <div className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {((form.watch(`splits.${index}.amount`) || 0) / (form.watch("amount") || 1) * 100).toFixed(1)}%
                        </div>
                      </FormItem>
                      <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" type="button" onClick={() => append({ category: "", categoryIcon: "", amount: 0, percentage: 0 })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Split
                  </Button>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total Split: {form.watch("splits")?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0} / {form.watch("amount")}
                  </div>
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
                                !field.value && "text-muted-foreground"
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
  );
};

export default CreateTransactionDialog;
