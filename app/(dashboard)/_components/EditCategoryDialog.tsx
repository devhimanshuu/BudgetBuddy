"use client";

import { Button } from "@/components/ui/button";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { TransactionType } from "@/lib/type";
import { cn } from "@/lib/utils";
import {
    UpdateCategorySchema,
    UpdateCategorySchemaType,
} from "@/schema/categories";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleOff, Loader2 } from "lucide-react";
import React, { ReactNode, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateCategory } from "@/app/(dashboard)/_actions/categories";
import { Category } from "@prisma/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";

interface Props {
    category: Category;
    trigger?: ReactNode;
}

function EditCategoryDialog({ category, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const form = useForm<UpdateCategorySchemaType>({
        resolver: zodResolver(UpdateCategorySchema),
        defaultValues: {
            oldName: category.name,
            name: category.name,
            icon: category.icon,
            type: category.type as TransactionType,
            color: category.color || "#10b981",
            isShared: category.isShared,
        },
    });

    const queryClient = useQueryClient();
    const theme = useTheme();

    const { mutate, isPending } = useMutation({
        mutationFn: UpdateCategory,
        onSuccess: async () => {
            toast.success(`Category updated successfully 🎉`, {
                id: "edit-category",
            });

            await queryClient.invalidateQueries({
                queryKey: ["categories"],
            });

            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Something went wrong", {
                id: "edit-category",
            });
        },
    });

    const onSubmit = useCallback(
        (values: UpdateCategorySchemaType) => {
            // Check if anything changed
            const hasChanged = 
                values.name !== category.name || 
                values.icon !== category.icon || 
                values.color !== category.color || 
                values.isShared !== category.isShared;

            if (!hasChanged) {
                toast.info("No changes made", {
                    id: "edit-category",
                });
                setOpen(false);
                return;
            }

            toast.loading("Updating category...", {
                id: "edit-category",
            });
            mutate(values);
        },
        [mutate, category]
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit
                        <span
                            className={cn(
                                "m-1",
                                category.type === "income" ? "text-emerald-500" : "text-red-500"
                            )}
                        >
                            {category.type}
                        </span>
                        category
                    </DialogTitle>
                    <DialogDescription>
                        Update the category name or icon
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Category" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is how your category will appear in the app
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon</FormLabel>
                                    <FormControl>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className="h-[100px] w-full"
                                                >
                                                    {form.watch("icon") ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-5xl" role="img">
                                                                {field.value}
                                                            </span>
                                                            <p className="text-xs text-muted-foreground">
                                                                Click to change
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <CircleOff className="h-[48px] w-[48px]" />
                                                            <p className="text-xs text-muted-foreground">
                                                                Click to select
                                                            </p>
                                                        </div>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full">
                                                <Picker
                                                    data={data}
                                                    theme={theme.resolvedTheme}
                                                    onEmojiSelect={(emoji: { native: string }) => {
                                                        field.onChange(emoji.native);
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </FormControl>
                                    <FormDescription>
                                        This is how your category will appear in the app
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-2 pt-1 border rounded-lg p-2 bg-background/50">
                                                {["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"].map(c => (
                                                    <button 
                                                        key={c}
                                                        type="button"
                                                        onClick={() => field.onChange(c)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full border-2 transition-all",
                                                            field.value === c ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent hover:scale-105"
                                                        )}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isShared"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-primary/5">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2 font-bold">
                                                <Zap className="h-4 w-4 text-amber-500" />
                                                Shared
                                            </FormLabel>
                                            <FormDescription className="text-[10px]">
                                                Across workspace
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </form>
                </Form>
                <DialogFooter>
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
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
                        {!isPending && "Update"}
                        {isPending && <Loader2 className="animate-spin" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EditCategoryDialog;
