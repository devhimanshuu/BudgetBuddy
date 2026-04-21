"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteWorkspace, LeaveWorkspace, UpdateWorkspace, GetActiveWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Globe, Loader2, LogOut, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Currencies } from "@/lib/currencies";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WorkspaceSettingsCard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: workspace, isLoading } = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });
    const { user } = useUser();

    const [name, setName] = useState("");
    const [currency, setCurrency] = useState("");
    const [openSub, setOpenSub] = useState(false);
    const [confirmName, setConfirmName] = useState("");
    const [openDelete, setOpenDelete] = useState(false);
    const [openLeave, setOpenLeave] = useState(false);
    const [approvalThreshold, setApprovalThreshold] = useState(0);
    const [avatar, setAvatar] = useState("🏢");
    const [wsType, setWsType] = useState("PERSONAL");

    useEffect(() => {
        if (workspace) {
            setName(workspace.name);
            setCurrency(workspace.currency);
            setApprovalThreshold(workspace.approvalThreshold || 0);
            setAvatar(workspace.avatar || "🏢");
            setWsType(workspace.type || "PERSONAL");
        }
    }, [workspace]);

    const mutation = useMutation({
        mutationFn: (data: { 
            name: string; 
            currency: string; 
            approvalThreshold: number;
            avatar: string;
            type: string;
        }) => {
            if (!workspace?.id) throw new Error("No workspace selected");
            return UpdateWorkspace(workspace.id, data);
        },
        onSuccess: () => {
            toast.success("Workspace settings updated!");
            queryClient.invalidateQueries({ queryKey: ["active-workspace"] });
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to update settings");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => {
            if (!workspace?.id) throw new Error("No workspace selected");
            return DeleteWorkspace(workspace.id);
        },
        onSuccess: () => {
            toast.success("Workspace deleted!");
            queryClient.invalidateQueries({ queryKey: ["active-workspace"] });
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            router.push("/");
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to delete workspace");
        }
    });

    const leaveMutation = useMutation({
        mutationFn: () => {
            if (!workspace?.id) throw new Error("No workspace selected");
            return LeaveWorkspace(workspace.id);
        },
        onSuccess: () => {
            toast.success("You have left the workspace!");
            queryClient.invalidateQueries({ queryKey: ["active-workspace"] });
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            router.push("/");
        },
        onError: (e: Error) => {
            toast.error(e.message || "Failed to leave workspace");
        }
    });

    if (isLoading) return null;
    if (!workspace) return null;

    const selectedCurrency = Currencies.find(c => c.value === currency);
    const isOwner = workspace.ownerId === user?.id;
    const isAdmin = workspace.role === "ADMIN";

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Globe className="w-5 h-5" />
                    Workspace Settings
                </CardTitle>
                <CardDescription>
                    Manage shared settings and visibility for this workspace.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
                {isAdmin ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ws-name">Workspace Name</Label>
                                <Input 
                                    id="ws-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Family Budget"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Workspace Type</Label>
                                <Select value={wsType} onValueChange={setWsType}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERSONAL">Personal</SelectItem>
                                        <SelectItem value="HOME">Home</SelectItem>
                                        <SelectItem value="STARTUP">Startup</SelectItem>
                                        <SelectItem value="VACATION">Vacation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Workspace Avatar (Emoji)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={avatar}
                                        onChange={(e) => setAvatar(e.target.value)}
                                        className="text-2xl text-center w-16 h-12"
                                        maxLength={2}
                                    />
                                    <div className="flex flex-wrap gap-1 items-center bg-background/30 p-1 rounded-lg border">
                                        {["🏠", "🚀", "🏖️", "📂", "💼", "💎", "🏡"].map(e => (
                                            <button 
                                                key={e}
                                                type="button"
                                                onClick={() => setAvatar(e)}
                                                className={`p-1.5 rounded hover:bg-primary/10 transition-colors ${avatar === e ? 'bg-primary/20 scale-110' : ''}`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="space-y-2">
                            <Label>Workspace Currency</Label>
                            <Popover open={openSub} onOpenChange={setOpenSub}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        {selectedCurrency ? selectedCurrency.label : "Select Currency"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search currency..." />
                                        <CommandList>
                                            <CommandEmpty>No results found.</CommandEmpty>
                                            <CommandGroup>
                                                {Currencies.map((c) => (
                                                    <CommandItem
                                                        key={c.value}
                                                        onSelect={() => {
                                                            setCurrency(c.value);
                                                            setOpenSub(false);
                                                        }}
                                                    >
                                                        {c.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-[10px] text-muted-foreground">
                                This currency will be used by all members when viewing this workspace.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ws-threshold">Transaction Approval Threshold</Label>
                            <Input 
                                id="ws-threshold"
                                type="number"
                                value={approvalThreshold}
                                onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                                placeholder="500"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Transactions added by Editors over this amount will require Admin approval. Set to 0 to require approval for all transactions.
                            </p>
                        </div>

                        <Button 
                            className="w-full gap-2 transition-all duration-300 h-11 text-lg font-bold"
                            onClick={() => mutation.mutate({ 
                                name, 
                                currency, 
                                approvalThreshold,
                                avatar,
                                type: wsType
                            })}
                            disabled={mutation.isPending || (
                                name === workspace.name && 
                                currency === workspace.currency && 
                                approvalThreshold === workspace.approvalThreshold &&
                                avatar === workspace.avatar &&
                                wsType === workspace.type
                            )}
                        >
                            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Update Identity & Visuals
                        </Button>
                    </>
                ) : (
                    <div className="rounded-lg border border-dashed border-primary/20 p-8 text-center bg-background/50">
                        <Globe className="mx-auto h-12 w-12 text-primary/30 mb-4" />
                        <h3 className="text-lg font-bold">Workspace View</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
                            You are currently viewing <span className="text-foreground font-medium">{workspace.name}</span>. Only admins can modify settings.
                        </p>
                    </div>
                )}

                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-widest">
                        <AlertCircle className="w-4 h-4" />
                        Danger Zone
                    </div>
                    <Separator className="bg-destructive/10" />

                    <div className="flex flex-col gap-3">
                        {isOwner ? (
                            <AlertDialog open={openDelete} onOpenChange={(o) => {
                                setOpenDelete(o);
                                if (!o) setConfirmName("");
                            }}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full gap-2 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all duration-300">
                                        <Trash2 className="w-4 h-4" />
                                        Delete Workspace
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[95vw] max-w-[420px] rounded-3xl border-destructive/30 bg-gradient-to-b from-background to-destructive/10 backdrop-blur-2xl shadow-2xl p-6">
                                    <AlertDialogHeader className="space-y-4">
                                        <AlertDialogTitle className="text-destructive flex items-center gap-3 text-2xl font-black italic uppercase tracking-tight">
                                            <div className="p-2 bg-destructive/10 rounded-xl">
                                                <Trash2 className="w-6 h-6 animate-pulse" />
                                            </div>
                                            Confirm Deletion
                                        </AlertDialogTitle>
                                        <div className="space-y-4 text-foreground/70 leading-relaxed">
                                            <p className="bg-destructive/5 border border-destructive/10 p-4 rounded-xl text-sm italic font-medium">
                                                This action will permanently delete the workspace <strong className="text-foreground text-base underline decoration-destructive/30 underline-offset-4">{workspace.name}</strong> and all its transactions, budgets, and members.
                                            </p>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm-name" className="text-xs uppercase tracking-widest font-bold text-muted-foreground/80">
                                                    Type the workspace name below to confirm:
                                                </Label>
                                                <Input 
                                                    id="confirm-name"
                                                    value={confirmName}
                                                    onChange={(e) => setConfirmName(e.target.value)}
                                                    placeholder={workspace.name}
                                                    className="bg-background/50 border-destructive/10 focus-visible:ring-destructive/30 rounded-xl"
                                                />
                                            </div>
                                            <p className="text-xs font-bold text-destructive/80 flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                This action is IRREVERSIBLE. Proceed with caution.
                                            </p>
                                        </div>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row gap-3 pt-6">
                                        <AlertDialogCancel className="flex-1 rounded-2xl h-12 border-muted-foreground/20 hover:bg-accent">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteMutation.mutate()}
                                            disabled={deleteMutation.isPending || confirmName !== workspace.name}
                                            className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-12 gap-2 shadow-lg shadow-destructive/20 disabled:grayscale disabled:opacity-50 transition-all duration-300"
                                        >
                                            {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                            <span className="font-bold">Delete Forever</span>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <AlertDialog open={openLeave} onOpenChange={setOpenLeave}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full gap-2 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all duration-300">
                                        <LogOut className="w-4 h-4" />
                                        Leave Workspace
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[95vw] max-w-[420px] rounded-3xl border-destructive/20 bg-gradient-to-b from-background to-destructive/5 backdrop-blur-xl shadow-2xl p-6">
                                    <AlertDialogHeader className="space-y-4">
                                        <AlertDialogTitle className="text-destructive flex items-center gap-3 text-2xl font-black italic uppercase tracking-tight">
                                            <div className="p-2 bg-destructive/10 rounded-xl">
                                                <LogOut className="w-6 h-6" />
                                            </div>
                                            Leave Workspace?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-foreground/70 text-base leading-relaxed bg-destructive/5 p-4 rounded-xl border border-destructive/10 font-medium">
                                            You will lose access to <strong className="text-foreground">{workspace.name}</strong> and all its shared data. You&apos;ll need to be re-invited to join again.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row gap-3 pt-6">
                                        <AlertDialogCancel className="flex-1 rounded-2xl h-12 border-muted-foreground/20">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => leaveMutation.mutate()}
                                            disabled={leaveMutation.isPending}
                                            className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-12 gap-2 shadow-lg shadow-destructive/20 transition-all duration-300"
                                        >
                                            {leaveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                                            <span className="font-bold">Leave Workspace</span>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
