"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetActiveWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import { UpdateWorkspace } from "@/app/(dashboard)/_actions/workspaces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Currencies } from "@/lib/currencies";
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

export function WorkspaceSettingsCard() {
    const queryClient = useQueryClient();
    const { data: workspace, isLoading } = useQuery({
        queryKey: ["active-workspace"],
        queryFn: () => GetActiveWorkspace(),
    });

    const [name, setName] = useState("");
    const [currency, setCurrency] = useState("");
    const [openSub, setOpenSub] = useState(false);

    useEffect(() => {
        if (workspace) {
            setName(workspace.name);
            setCurrency(workspace.currency);
        }
    }, [workspace]);

    const mutation = useMutation({
        mutationFn: (data: { name: string; currency: string }) => {
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

    if (isLoading) return null;
    if (!workspace) return null;

    const selectedCurrency = Currencies.find(c => c.value === currency);

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Globe className="w-5 h-5" />
                    Workspace Settings
                </CardTitle>
                <CardDescription>
                    Manage shared settings for this workspace. These changes affect all members.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

                <Button 
                    className="w-full gap-2"
                    onClick={() => mutation.mutate({ name, currency })}
                    disabled={mutation.isPending || (name === workspace.name && currency === workspace.currency)}
                >
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Workspace Settings
                </Button>
            </CardContent>
        </Card>
    );
}
