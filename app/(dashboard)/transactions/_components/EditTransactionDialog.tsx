"use client";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TransactionType } from "@/lib/type";
import { cn } from "@/lib/utils";
import {
    CreateTransactionSchema,
    CreateTransactionSchemaType,
} from "@/schema/transaction";
import { useCallback, useState, useEffect } from "react";
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
import CategoryPicker from "../../_components/CategoryPicker";
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
import { UpdateTransaction } from "../_actions/updateTransaction";
import { toast } from "sonner";
import { DateToUTCDate } from "@/lib/helper";
import { Category } from "@prisma/client";
import TagSelector from "../../_components/TagSelector";
import FileUpload from "../../_components/FileUpload";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    transaction: any; // Using any for now to facilitate mapping
}

const EditTransactionDialog = ({ open, setOpen, transaction }: Props) => {
    const form = useForm<CreateTransactionSchemaType>({
        resolver: zodResolver(CreateTransactionSchema),
        defaultValues: {
            type: transaction.type as TransactionType,
            date: new Date(transaction.date),
            description: transaction.description || "",
            notes: transaction.notes || "",
            amount: transaction.amount,
            category: transaction.category,
            splits: transaction.splits || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "splits",
    });

    const [isSplitMode, setIsSplitMode] = useState(
        transaction.splits && transaction.splits.length > 0
    );

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

    // Initialize tags and attachments from transaction data
    useEffect(() => {
        if (open && transaction) {
            if (transaction.tags) {
                setSelectedTags(transaction.tags.map((t: any) => t.tag));
            }
            if (transaction.attachments) {
                setAttachments(transaction.attachments);
            }
            form.reset({
                type: transaction.type as TransactionType,
                date: new Date(transaction.date),
                description: transaction.description || "",
                notes: transaction.notes || "",
                amount: transaction.amount,
                category: transaction.category,
                splits: transaction.splits || [],
            });
            setIsSplitMode(transaction.splits && transaction.splits.length > 0);
        }
    }, [open, transaction, form]);

    const handleCategoryChange = useCallback(
        (value: Category) => {
            form.setValue("category", value.name);
        },
        [form]
    );

    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: (data: CreateTransactionSchemaType) =>
            UpdateTransaction(transaction.id, data),
        onSuccess: () => {
            toast.success("Transaction updated Successfully", {
                id: "update-transaction",
            });

            queryClient.invalidateQueries({
                queryKey: ["transactions"],
            });
            queryClient.invalidateQueries({
                queryKey: ["overview"],
            });
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.message, {
                id: "update-transaction",
            });
        },
    });

    const onSubmit = useCallback(
        (values: CreateTransactionSchemaType) => {
            if (isSplitMode) {
                const total = values.amount;
                const splitTotal = values.splits?.reduce((a, b) => a + b.amount, 0) || 0;
                if (Math.abs(total - splitTotal) > 0.01) {
                    toast.error(
                        `Split amounts ($${splitTotal}) must equal total amount ($${total})`
                    );
                    return;
                }
            } else {
                values.splits = undefined;
            }

            toast.loading("Updating transaction...", { id: "update-transaction" });
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

    const type = transaction.type as TransactionType;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>
                        Edit
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
                        Update your transaction details
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
                                    id="split-mode-edit"
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
                                <Label htmlFor="split-mode-edit" className="font-semibold">
                                    Split Transaction
                                </Label>
                            </div>

                            {isSplitMode && (
                                <div className="space-y-4 mb-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-end">
                                            <FormItem className="flex-1">
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>
                                                    Category
                                                </FormLabel>
                                                <FormControl>
                                                    <CategoryPicker
                                                        type={type}
                                                        defaultValue={form.getValues(`splits.${index}.category`)}
                                                        onChange={(cat) => {
                                                            form.setValue(
                                                                `splits.${index}.category`,
                                                                cat.name
                                                            );
                                                            form.setValue(
                                                                `splits.${index}.categoryIcon`,
                                                                cat.icon
                                                            );
                                                        }}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                            <FormItem className="w-32">
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>
                                                    Amount
                                                </FormLabel>
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
                                            </FormItem>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
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
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-2">
                                <FormField
                                    name="category"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Category</FormLabel>
                                            <FormControl>
                                                <CategoryPicker
                                                    type={type}
                                                    defaultValue={transaction.category}
                                                    onChange={handleCategoryChange}
                                                />
                                            </FormControl>
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </div>
                <DialogFooter className="px-6 pb-6 pt-2">
                    <Button
                        type="button"
                        variant={"secondary"}
                        onClick={() => {
                            setOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        onClick={form.handleSubmit(onSubmit)}
                    >
                        {!isPending && "Save Changes"}
                        {isPending && <Loader2 className="animate-spin" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditTransactionDialog;
