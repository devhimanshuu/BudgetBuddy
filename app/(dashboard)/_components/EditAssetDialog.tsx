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
import { Loader2, Palette } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Orange
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#000000", // Black
];

const updateAssetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
    category: z.string().min(1, "Category is required"),
    currentValue: z.coerce.number().positive("Value must be positive"),
    icon: z.string().default("💰"),
    color: z.string().default("#3b82f6"),
    notes: z.string().optional().nullable(),
});

type UpdateAssetSchema = z.infer<typeof updateAssetSchema>;

interface Asset {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    category: string;
    currentValue: number;
    icon: string;
    color: string;
    notes?: string | null;
}

interface Props {
    asset: Asset;
    trigger: React.ReactNode;
}

export default function EditAssetDialog({ asset, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<UpdateAssetSchema>({
        resolver: zodResolver(updateAssetSchema),
        defaultValues: {
            name: asset.name,
            description: asset.description || "",
            category: asset.category,
            currentValue: asset.currentValue,
            icon: asset.icon,
            color: asset.color,
            notes: asset.notes || "",
        },
    });

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [customHue, setCustomHue] = useState(210);
    const [customSaturation, setCustomSaturation] = useState(70);
    const [customLightness, setCustomLightness] = useState(50);

    const customColor = `hsl(${customHue}, ${customSaturation}%, ${customLightness}%)`;

    const assetType = asset.type as "asset" | "liability";
    const category = form.watch("category");

    const handleCategoryChange = (value: string) => {
        const categories = assetCategories[assetType];
        const selectedCategory = categories.find((cat) => cat.value === value);
        if (selectedCategory) {
            form.setValue("icon", selectedCategory.icon);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: UpdateAssetSchema) => {
            const response = await fetch(`/api/assets/${asset.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update asset");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(
                `${assetType === "asset" ? "Asset" : "Liability"} updated successfully!`,
                { id: `edit-${asset.id}` }
            );
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["net-worth"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message, { id: `edit-${asset.id}` });
        },
    });

    const onSubmit = (data: UpdateAssetSchema) => {
        toast.loading(`Updating ${assetType}...`, { id: `edit-${asset.id}` });
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Edit {assetType === "asset" ? "Asset" : "Liability"}
                    </DialogTitle>
                    <DialogDescription>
                        Update the details for <strong>{asset.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                            {assetCategories[assetType].map((cat) => (
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
                                                assetType === "asset"
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
                                        {assetType === "asset"
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
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={cn(
                                                    "h-8 w-8 rounded-full border-2 transition-all",
                                                    field.value === color
                                                        ? "scale-110 border-foreground ring-2 ring-offset-2"
                                                        : "border-transparent hover:scale-105"
                                                )}
                                                style={{ backgroundColor: color }}
                                                onClick={() => field.onChange(color)}
                                            />
                                        ))}

                                        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                                                        !PRESET_COLORS.includes(field.value)
                                                            ? "scale-110 border-foreground ring-2 ring-offset-2"
                                                            : "border-dashed border-muted-foreground hover:scale-105 hover:border-foreground"
                                                    )}
                                                    style={{
                                                        backgroundColor: !PRESET_COLORS.includes(field.value) ? field.value : "transparent"
                                                    }}
                                                >
                                                    {PRESET_COLORS.includes(field.value) && (
                                                        <Palette className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64" side="top">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-medium mb-1 text-sm">Custom Color</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Adjust sliders to create your color
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <div
                                                            className="h-12 w-12 rounded-full border-4 border-border shadow-lg"
                                                            style={{ backgroundColor: customColor }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-medium">Hue</label>
                                                            <span className="text-xs text-muted-foreground">{customHue}°</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="360"
                                                            value={customHue}
                                                            onChange={(e) => setCustomHue(Number(e.target.value))}
                                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                            style={{
                                                                background: `linear-gradient(to right, 
                                                                    hsl(0, 100%, 50%), 
                                                                    hsl(60, 100%, 50%), 
                                                                    hsl(120, 100%, 50%), 
                                                                    hsl(180, 100%, 50%), 
                                                                    hsl(240, 100%, 50%), 
                                                                    hsl(300, 100%, 50%), 
                                                                    hsl(360, 100%, 50%))`
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-medium">Saturation</label>
                                                            <span className="text-xs text-muted-foreground">{customSaturation}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={customSaturation}
                                                            onChange={(e) => setCustomSaturation(Number(e.target.value))}
                                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                            style={{
                                                                background: `linear-gradient(to right, 
                                                                    hsl(${customHue}, 0%, 50%), 
                                                                    hsl(${customHue}, 100%, 50%))`
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-medium">Brightness</label>
                                                            <span className="text-xs text-muted-foreground">{customLightness}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="20"
                                                            max="80"
                                                            value={customLightness}
                                                            onChange={(e) => setCustomLightness(Number(e.target.value))}
                                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                            style={{
                                                                background: `linear-gradient(to right, 
                                                                    hsl(${customHue}, ${customSaturation}%, 0%), 
                                                                    hsl(${customHue}, ${customSaturation}%, 50%), 
                                                                    hsl(${customHue}, ${customSaturation}%, 100%))`
                                                            }}
                                                        />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => {
                                                            field.onChange(customColor);
                                                            setShowColorPicker(false);
                                                        }}
                                                    >
                                                        Set Color
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
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
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
