"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    CreateRecurringTransaction,
    DeleteRecurringTransaction,
    EditRecurringTransaction,
    GetRecurringTransactions,
    RecurringInterval,
} from "@/app/(dashboard)/_actions/recurring";
import CategoryPicker from "@/app/(dashboard)/_components/CategoryPicker";
import { toast } from "sonner";
import { GetFormatterForCurrency } from "@/lib/helper";

// --- Schema ---
const createRecurringSchema = z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    category: z.string().min(1, "Category is required"),
    date: z.date(),
    interval: z.enum(["daily", "weekly", "monthly", "yearly"]),
    type: z.enum(["income", "expense"]),
});

type CreateRecurringSchemaType = z.infer<typeof createRecurringSchema>;

// Local interface to match Prisma model
interface RecurringTransaction {
    id: string
    userId: string
    amount: number
    description: string
    type: string
    category: string
    categoryIcon: string
    date: Date
    interval: string
    lastProcessed: Date | null
    createdAt: Date
    updatedAt: Date
}

// --- Components ---

function CreateRecurringDialog({
    trigger,
    onSuccess,
}: {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<CreateRecurringSchemaType>({
        resolver: zodResolver(createRecurringSchema),
        defaultValues: {
            type: "expense",
            interval: "monthly",
            date: new Date(),
            description: "",
            amount: 0,
            category: "",
        },
    });

    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: CreateRecurringTransaction,
        onSuccess: () => {
            toast.success("Recurring transaction created", {
                id: "create-recurring",
            });
            form.reset({
                type: "expense",
                interval: "monthly",
                date: new Date(),
                description: "",
                amount: 0,
                category: "",
            });
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
            setOpen(false);
            onSuccess?.();
        },
        onError: (e) => {
            toast.error("Failed to create recurring transaction: " + e.message, {
                id: "create-recurring",
            });
        }
    });

    const onSubmit = (data: CreateRecurringSchemaType) => {
        toast.loading("Creating...", { id: "create-recurring" });
        mutate(data);
    };

    const setCategory = (category: any) => {
        form.setValue("category", category.name);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="border-emerald-500 bg-emerald-950 text-white hover:bg-emerald-700 hover:text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        New Recurring
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Recurring Transaction</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <CategoryPicker type={form.watch("type") as "income" | "expense"} onChange={setCategory} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Next Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interval"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interval</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select interval" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Recurring Transaction
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function EditRecurringDialog({
    transaction,
    trigger,
    onSuccess,
}: {
    transaction: RecurringTransaction;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<CreateRecurringSchemaType>({
        resolver: zodResolver(createRecurringSchema),
        defaultValues: {
            type: transaction.type as "income" | "expense",
            interval: transaction.interval as any,
            date: new Date(transaction.date),
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.category,
        },
    });

    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: (data: CreateRecurringSchemaType) => EditRecurringTransaction(transaction.id, data),
        onSuccess: () => {
            toast.success("Recurring transaction updated", {
                id: "edit-recurring",
            });
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
            setOpen(false);
            onSuccess?.();
        },
        onError: (e) => {
            toast.error("Failed to update: " + e.message, {
                id: "edit-recurring",
            });
        }
    });

    const onSubmit = (data: CreateRecurringSchemaType) => {
        toast.loading("Updating...", { id: "edit-recurring" });
        mutate(data);
    };

    const setCategory = (category: any) => {
        form.setValue("category", category.name);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Recurring Transaction</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <CategoryPicker type={form.watch("type") as "income" | "expense"} onChange={setCategory} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Next Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interval"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interval</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select interval" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Recurring Transaction
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteRecurringButton({ id }: { id: string }) {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: DeleteRecurringTransaction,
        onSuccess: () => {
            toast.success("Deleted", { id: "delete-recurring" });
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
        },
        onError: (e) => {
            toast.error("Failed to delete: " + e.message, { id: "delete-recurring" });
        }
    });

    return (
        <Button variant="ghost" size="icon" onClick={() => {
            toast.loading("Deleting...", { id: "delete-recurring" });
            mutate(id);
        }} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
    )
}

export function ManageRecurringTransactions() {
    const [openDialog, setOpenDialog] = useState(false);
    const { data: transactions, isLoading } = useQuery<RecurringTransaction[]>({
        queryKey: ["recurring-transactions"],
        queryFn: () => GetRecurringTransactions(),
    });

    const userSettings = useQuery({
        queryKey: ["userSettings"],
        queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
    });

    const formatter = React.useMemo(() => {
        return GetFormatterForCurrency(userSettings.data?.currency || "USD");
    }, [userSettings.data]);

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
                <Button variant="outline" className="ml-auto bg-card hover:bg-muted">
                    Manage Recurring
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[425px] sm:max-w-[600px] overflow-visible">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Recurring Transactions</span>
                        <div onClick={(e) => e.stopPropagation()}>
                            <CreateRecurringDialog />
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-2 mt-4">
                    {isLoading && <Loader2 className="mx-auto animate-spin" />}
                    {transactions?.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            No recurring transactions found.
                        </p>
                    )}
                    {transactions?.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg bg-card"
                        >
                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                <span className="text-xl" role="img" aria-label={transaction.category}>
                                    {transaction.categoryIcon}
                                </span>
                                <div>
                                    <p className="font-semibold">{transaction.description}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {transaction.interval} • Next: {format(new Date(transaction.date), "MMM d, yyyy")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                <span className={cn(
                                    "font-bold",
                                    transaction.type === "income" ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {transaction.type === "income" ? "+" : "-"}{formatter.format(transaction.amount)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <EditRecurringDialog transaction={transaction} />
                                    <DeleteRecurringButton id={transaction.id} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
