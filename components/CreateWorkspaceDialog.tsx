"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { CreateWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CreateWorkspaceDialog({ trigger, open: propsOpen, onOpenChange: propsOnOpenChange }: Props) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = propsOpen !== undefined ? propsOpen : internalOpen;
    const setOpen = propsOnOpenChange || setInternalOpen;
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async () => {
        if (!name) return;
        setLoading(true);
        const toastId = toast.loading("Creating workspace...");
        try {
            await CreateWorkspace(name);
            toast.success("Workspace created successfully", { id: toastId });
            setOpen(false);
            setName("");
            router.refresh(); // Refresh to show new workspace in switcher
        } catch (error: any) {
            toast.error(error.message || "Failed to create workspace", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger !== null && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Workspace
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                    <DialogDescription>
                        Create a new workspace to collaborate with others or organize your finances differently.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Family, Business, etc."
                            className="col-span-3"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={!name || loading}>
                        {loading ? "Creating..." : "Create Workspace"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
