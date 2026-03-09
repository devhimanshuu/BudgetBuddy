"use client";

import { useEffect, useState } from "react";
import {
    Check,
    ChevronsUpDown,
    PlusCircle,
    LayoutDashboard,
    Users,
    Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { GetWorkspaces, SwitchWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import CreateWorkspaceDialog from "./CreateWorkspaceDialog";

interface WorkspaceItem {
    id: string;
    name: string;
    role: string;
    ownerId: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

export function WorkspaceSwitcher() {
    const [open, setOpen] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

    const workspacesQuery = useQuery({
        queryKey: ["workspaces"],
        queryFn: () => GetWorkspaces(),
    });

    useEffect(() => {
        // Try to get active workspace from cookies (already handled by server component but useful for UI state)
        // For simplicity, we'll let the server component pass the initial active workspace later or just use the first match
        if (workspacesQuery.data && !selectedWorkspaceId) {
            // Find active workspace from cookie (we can't easily read server cookies here, so we look at the list)
            // Actually, we'll just use the first one as a placeholder or wait for user interaction
            // A better way is to pass initialValue from parent
        }
    }, [workspacesQuery.data]);

    const onWorkspaceSelect = async (workspaceId: string) => {
        setOpen(false);
        setSelectedWorkspaceId(workspaceId);

        const toastId = toast.loading("Switching workspace...");
        try {
            await SwitchWorkspace(workspaceId);
            toast.success("Workspace switched", { id: toastId });
            window.location.reload(); // Refresh to update all server-side data
        } catch (error) {
            toast.error("Failed to switch workspace", { id: toastId });
        }
    };

    const activeWorkspace = workspacesQuery.data?.find((w: WorkspaceItem) => w.id === selectedWorkspaceId) || workspacesQuery.data?.[0];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    size="sm"
                    aria-expanded={open}
                    className="w-[140px] h-8 justify-between hover:bg-accent/50 transition-all duration-300 px-2 group"
                >
                    <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        <Building2 className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="truncate max-w-[80px] text-[11px] font-semibold tracking-tight uppercase">
                            {activeWorkspace?.name || "Workspace"}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-2.5 w-2.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 border-border bg-background/95 backdrop-blur-md shadow-xl" align="start">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Search workspace..." className="border-none focus:ring-0" />
                    <CommandList>
                        <CommandEmpty>No workspace found.</CommandEmpty>
                        <CommandGroup heading="My Workspaces">
                            {workspacesQuery.data?.map((workspace: WorkspaceItem) => (
                                <CommandItem
                                    key={workspace.id}
                                    onSelect={() => onWorkspaceSelect(workspace.id)}
                                    className="flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                        <span>{workspace.name}</span>
                                    </div>
                                    {activeWorkspace?.id === workspace.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CreateWorkspaceDialog
                                trigger={
                                    <div className="flex items-center gap-2 p-2 hover:bg-primary/10 cursor-pointer rounded-sm text-sm font-medium text-primary">
                                        <PlusCircle className="h-4 w-4" />
                                        <span>Create Workspace</span>
                                    </div>
                                }
                            />
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
