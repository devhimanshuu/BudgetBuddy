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
import { GetWorkspaces, SwitchWorkspace, GetActiveWorkspace } from "@/app/(dashboard)/_actions/workspaces";
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

    const activeWorkspaceQuery = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    useEffect(() => {
        if (activeWorkspaceQuery.data) {
            setSelectedWorkspaceId(activeWorkspaceQuery.data.id);
        }
    }, [activeWorkspaceQuery.data]);

    const onWorkspaceSelect = async (workspaceId: string) => {
        if (workspaceId === selectedWorkspaceId) {
            setOpen(false);
            return;
        }
        
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
                    className="w-auto h-9 justify-between hover:bg-accent/50 transition-all duration-300 px-3 group border border-border/50 rounded-full"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Building2 className="h-3 w-3 text-primary" />
                        </div>
                        <span className="truncate max-w-[120px] md:max-w-[150px] text-xs font-bold tracking-tight">
                            {activeWorkspace?.name || "Workspace"}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ml-1" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0 border-border bg-background/95 backdrop-blur-md shadow-2xl rounded-xl" align="start" sideOffset={8}>
                <Command className="bg-transparent">
                    <div className="p-2 border-b border-border/50">
                        <CommandInput placeholder="Search workspace..." className="h-8 border-none focus:ring-0 text-xs" />
                    </div>
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">No workspace found.</CommandEmpty>
                        <CommandGroup heading={<span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-2">Your Workspaces</span>}>
                            {workspacesQuery.data?.map((workspace: WorkspaceItem) => (
                                <CommandItem
                                    key={workspace.id}
                                    onSelect={() => onWorkspaceSelect(workspace.id)}
                                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 aria-selected:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border border-border/50",
                                            activeWorkspace?.id === workspace.id ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                                        )}>
                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold truncate leading-none mb-1">{workspace.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{workspace.role}</span>
                                        </div>
                                    </div>
                                    {activeWorkspace?.id === workspace.id && (
                                        <div className="bg-primary/10 rounded-full p-1">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator className="bg-border/50" />
                    <CommandList>
                        <CommandGroup>
                            <CreateWorkspaceDialog
                                trigger={
                                    <div className="flex items-center gap-2 p-3 hover:bg-primary/5 cursor-pointer rounded-b-xl text-xs font-semibold text-primary transition-colors group/new">
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover/new:bg-primary/20 transition-colors">
                                            <PlusCircle className="h-4 w-4" />
                                        </div>
                                        <span>Create New Workspace</span>
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
