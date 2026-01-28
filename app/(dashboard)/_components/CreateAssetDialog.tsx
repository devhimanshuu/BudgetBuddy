"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const assetCategories = {
    asset: [
        { value: "stocks", label: "Stocks & Investments", icon: "📈" },
        { value: "real-estate", label: "Real Estate", icon: "🏠" },
        { value: "crypto", label: "Cryptocurrency", icon: "₿" },
        { value: "cash", label: "Cash & Savings", icon: "💵" },
        { value: "vehicle", label: "Vehicle", icon: "🚗" },
        { value: "other", label: "Other Assets", icon: "💰" },
    ],
    liability: [
        { value: "mortgage", label: "Mortgage", icon: "🏦" },
        { value: "loan", label: "Personal Loan", icon: "💳" },
        { value: "credit-card", label: "Credit Card Debt", icon: "💳" },
        { value: "student-loan", label: "Student Loan", icon: "🎓" },
        { value: "auto-loan", label: "Auto Loan", icon: "🚗" },
        { value: "other", label: "Other Liabilities", icon: "📋" },
    ],
};

const colors = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#ec4899", label: "Pink" },
    { value: "#06b6d4", label: "Cyan" },
];

const createAssetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    type: z.enum(["asset", "liability"]),
    category: z.string().min(1, "Category is required"),
    currentValue: z.coerce.number().positive("Value must be positive"),
    icon: z.string().default("💰"),
    color: z.string().default("#3b82f6"),
    notes: z.string().optional(),
});

type CreateAssetSchema = z.infer<typeof createAssetSchema>;

interface Props {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CreateAssetDialog({ trigger, open: externalOpen, onOpenChange }: Props = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const queryClient = useQueryClient();

    const form = useForm<CreateAssetSchema>({
        resolver: zodResolver(createAssetSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "asset",
            category: "",
            currentValue: 0,
            icon: "💰",
            color: "#3b82f6",
            notes: "",
        },
    });

    const type = form.watch("type");
    const category = form.watch("category");

    // Update icon when category changes
    const handleCategoryChange = (value: string) => {
        const categories = assetCategories[type];
        const selectedCategory = categories.find((cat) => cat.value === value);
        if (selectedCategory) {
            form.setValue("icon", selectedCategory.icon);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: CreateAssetSchema) => {
            const response = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create asset");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(
                `${type === "asset" ? "Asset" : "Liability"} created successfully!`
            );
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["net-worth"] });
            form.reset();
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: CreateAssetSchema) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger !== null && (
                <DialogTrigger asChild>
                    {trigger ? (
                        trigger
                    ) : (
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add {type === "asset" ? "Asset" : "Liability"}
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Add New {type === "asset" ? "Asset" : "Liability"}
                    </DialogTitle>
                    <DialogDescription>
                        Track your {type === "asset" ? "assets" : "liabilities"} to
                        calculate your true net worth.
                    </DialogDescription>
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
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            form.setValue("category", "");
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="asset">Asset</SelectItem>
                                            <SelectItem value="liability">Liability</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            handleCategoryChange(value);
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {assetCategories[type].map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.icon} {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={
                                                type === "asset"
                                                    ? "e.g., Tesla Stock, My House"
                                                    : "e.g., Home Mortgage, Car Loan"
                                            }
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currentValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {type === "asset"
                                            ? "The current market value of this asset"
                                            : "The total amount you owe"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Brief description"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select color" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {colors.map((color) => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-4 w-4 rounded-full"
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                        {color.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional notes..."
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
