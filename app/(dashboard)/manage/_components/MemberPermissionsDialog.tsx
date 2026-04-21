"use client";

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
import { Shield, Loader2, Check, X, Search, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { GetMemberRestrictionsUI, UpdateMemberRestrictions } from "../../_actions/workspaces";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Props {
  workspaceId: string;
  memberUserId: string;
  memberName: string;
}

export default function MemberPermissionsDialog({
  workspaceId,
  memberUserId,
  memberName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data: restrictions, isLoading: isLoadingRestrictions } = useQuery({
    queryKey: ["member-restrictions", workspaceId, memberUserId],
    queryFn: () => GetMemberRestrictionsUI(workspaceId, memberUserId),
    enabled: open,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => fetch("/api/categories?type=all").then((res) => res.json()),
    enabled: open,
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: () => fetch("/api/assets").then((res) => res.json()),
    enabled: open,
  });

  useEffect(() => {
    if (restrictions) {
      setSelectedCategories(
        restrictions
          .filter((r: any) => r.resourceType === "CATEGORY")
          .map((r: any) => r.resourceId)
      );
      setSelectedAssets(
        restrictions
          .filter((r: any) => r.resourceType === "ASSET")
          .map((r: any) => r.resourceId)
      );
    }
  }, [restrictions, open]);

  const mutation = useMutation({
    mutationFn: (data: { resourceType: string; resourceId: string }[]) =>
      UpdateMemberRestrictions(workspaceId, memberUserId, data),
    onSuccess: () => {
      toast.success("Permissions updated successfully");
      queryClient.invalidateQueries({ queryKey: ["member-restrictions", workspaceId, memberUserId] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to update permissions");
    },
  });

  const handleSave = () => {
    const data = [
      ...selectedCategories.map((id) => ({ resourceType: "CATEGORY", resourceId: id })),
      ...selectedAssets.map((id) => ({ resourceType: "ASSET", resourceId: id })),
    ];
    mutation.mutate(data);
  };

  const filteredCategories = Array.isArray(categories) 
    ? categories.filter((c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) 
    : [];

  const filteredAssets = Array.isArray(assets)
    ? assets.filter((a: any) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleAsset = (id: string) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95dvw] sm:w-full h-[90dvh] sm:h-[600px] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <DialogHeader className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Permissions: {memberName}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Restrict visibility to specific categories or assets.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900 h-9 sm:h-10"
            />
          </div>

          <Tabs defaultValue="categories" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/50 dark:bg-slate-800/50 h-9 sm:h-10">
              <TabsTrigger value="categories" className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                Categories
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 sm:ml-2 px-1 sm:px-2 h-4 sm:h-5 bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {selectedCategories.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                Accounts
                {selectedAssets.length > 0 && (
                  <Badge variant="secondary" className="ml-1 sm:ml-2 px-1 sm:px-2 h-4 sm:h-5 bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {selectedAssets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
              <ScrollArea className="flex-1 rounded-md border bg-white dark:bg-slate-900 p-2">
                {isLoadingRestrictions ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No categories found</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredCategories.map((category: any) => (
                      <div
                        key={category.name}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                          selectedCategories.includes(category.name)
                            ? "bg-primary/5 dark:bg-primary/20"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        onClick={() => toggleCategory(category.name)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <Checkbox
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => toggleCategory(category.name)}
                          className="rounded-full h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assets" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
              <ScrollArea className="flex-1 rounded-md border bg-white dark:bg-slate-900 p-2">
                {isLoadingRestrictions ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No assets found</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredAssets.map((asset: any) => (
                      <div
                        key={asset.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                          selectedAssets.includes(asset.id)
                            ? "bg-primary/5 dark:bg-primary/20"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        onClick={() => toggleAsset(asset.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{asset.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{asset.name}</span>
                            <span className="text-[10px] text-muted-foreground capitalize">{asset.type}</span>
                          </div>
                        </div>
                        <Checkbox
                          checked={selectedAssets.includes(asset.id)}
                          onCheckedChange={() => toggleAsset(asset.id)}
                          className="rounded-full h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t flex-row gap-2 justify-end">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function for class merging if not already available in scope
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
