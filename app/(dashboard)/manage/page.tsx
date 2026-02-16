"use client";

import { CurrencyComboBox } from "@/components/CurrencyComboBox";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransactionType } from "@/lib/type";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  LayoutGrid,
  List,
  Smile,
  Zap,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Settings2,
  Eraser,
  Loader2,
  Merge,
  Pencil,
  PlusSquare,
  TrashIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import CreateCategoryDialog from "../_components/CreateCategoryDialog";
import EditCategoryDialog from "../_components/EditCategoryDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Category } from "@prisma/client";
import DeleteCategoryDialog from "../_components/DeleteCategoryDialog";
import CreateTagDialog from "./_components/CreateTagDialog";
import EditTagDialog from "./_components/EditTagDialog";
import DeleteTagDialog from "./_components/DeleteTagDialog";
import MergeCategoriesDialog from "./_components/MergeCategoriesDialog";
import { useUIVibe } from "@/hooks/use-uivibe";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHasHydrated } from "@/hooks/use-has-hydrated";

const page = () => {
  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6">
          <div className="min-w-0">
            <p className="text-2xl font-bold sm:text-3xl">Manage</p>
            <p className="text-sm text-muted-foreground sm:text-base">
              Manage your account settings and categories
            </p>
          </div>
        </div>
      </div>
      <div className="container flex flex-col gap-4 px-4 py-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Currency Settings
              </CardTitle>
              <CardDescription>
                Set your default currency for transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CurrencyComboBox />
            </CardContent>
          </Card>

          <VibeControls />
        </div>
        <CategoryList type="income" />
        <CategoryList type="expense" />
        <TagList />
      </div>
    </>
  );
};

function VibeControls() {
  const { compactMode, setCompactMode, iconSet, setIconSet } = useUIVibe();
  const hydrated = useHasHydrated();

  if (!hydrated) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Settings2 className="w-5 h-5" />
          UI Vibe Controls
        </CardTitle>
        <CardDescription>
          Customize how your dashboard and categories look
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/20 p-4 bg-background/50">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              {compactMode ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              Compact Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Use smaller cards and denser layouts
            </p>
          </div>
          <Switch
            checked={compactMode}
            onCheckedChange={setCompactMode}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
            Icon Set Preference
          </Label>
          <Tabs
            value={iconSet}
            onValueChange={(v) => setIconSet(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="emoji" className="gap-2 text-sm">
                <Smile className="w-4 h-4" />
                Expressive Emoji
              </TabsTrigger>
              <TabsTrigger value="lucide" className="gap-2 text-sm">
                <Zap className="w-4 h-4" />
                Minimal Lucide
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

export default page;


function CategoryList({ type }: { type: TransactionType }) {
  const { compactMode } = useUIVibe();
  const hydrated = useHasHydrated();
  const [sortBy, setSortBy] = React.useState<"name" | "usage">("name");
  const [cleanupMode, setCleanupMode] = React.useState(false);

  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: () =>
      fetch(`/api/categories?type=${type}`).then((res) => res.json()),
  });

  const dataAvailable = categoriesQuery.data && categoriesQuery.data.length > 0;

  // Sort categories based on selected option
  const sortedCategories = React.useMemo(() => {
    if (!categoriesQuery.data) return [];

    let filtered = [...categoriesQuery.data];
    if (cleanupMode) {
      filtered = filtered.filter(c => (c._count?.transactions || 0) === 0);
    }

    if (sortBy === "name") {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return filtered.sort((a, b) =>
        (b._count?.transactions || 0) - (a._count?.transactions || 0)
      );
    }
  }, [categoriesQuery.data, sortBy, cleanupMode]);

  const cleanupMutation = useMutation({
    mutationFn: () => fetch(`/api/manage/cleanup?target=categories`, { method: "POST" }).then(res => res.json()),
    onSuccess: (data) => {
      toast.success(data.message || "Cleanup completed");
      queryClient.invalidateQueries({ queryKey: ["categories", type] });
      setCleanupMode(false);
    },
    onError: () => {
      toast.error("Cleanup failed");
    }
  });

  const totalCategories = categoriesQuery.data?.length || 0;
  const totalUsage = categoriesQuery.data?.reduce((acc: number, category: any) =>
    acc + (category._count?.transactions || 0), 0
  ) || 0;

  return (
    <SkeletonWrapper isLoading={categoriesQuery.isFetching}>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
              {type === "expense" ? (
                <TrendingDown className="h-10 w-10 shrink-0 rounded-lg bg-red-400/10 p-2 text-red-500 sm:h-12 sm:w-12" />
              ) : (
                <TrendingUp className="h-10 w-10 shrink-0 rounded-lg bg-emerald-400/10 p-2 text-emerald-500 sm:h-12 sm:w-12" />
              )}
              <div className="min-w-0">
                <span className="block">{type === "income" ? "Incomes" : "Expenses"} categories</span>
                <div className="text-sm text-muted-foreground">
                  {totalCategories} {totalCategories === 1 ? "category" : "categories"} • {totalUsage} {totalUsage === 1 ? "transaction" : "transactions"}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap">
              <MergeCategoriesDialog
                type={type}
                categories={categoriesQuery.data || []}
                trigger={
                  <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                    <Merge className="h-4 w-4 shrink-0" />
                    Merge
                  </Button>
                }
              />
              <CreateCategoryDialog
                type={type}
                successCallback={() => categoriesQuery.refetch()}
                trigger={
                  <Button className="w-full gap-2 text-sm sm:w-auto" size="sm">
                    <PlusSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">Create Category</span>
                  </Button>
                }
              />
            </div>
          </CardTitle>
        </CardHeader>
        <Separator />

        {dataAvailable && (
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-full text-sm text-muted-foreground sm:w-auto">Sort by:</span>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("name")}
                >
                  Name
                </Button>
                <Button
                  variant={sortBy === "usage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("usage")}
                >
                  Usage
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={cleanupMode ? "destructive" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setCleanupMode(!cleanupMode)}
              >
                <Eraser className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{cleanupMode ? "Exit Cleanup" : "Cleanup Mode"}</span>
                <span className="sm:hidden">{cleanupMode ? "Exit" : "Cleanup"}</span>
              </Button>

              {cleanupMode && sortedCategories.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 animate-pulse"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete all ${sortedCategories.length} unused categories?`)) {
                      cleanupMutation.mutate();
                    }
                  }}
                  disabled={cleanupMutation.isPending}
                >
                  {cleanupMutation.isPending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0" />}
                  <span className="hidden sm:inline">Delete All Unused</span>
                  <span className="sm:hidden">Delete</span> ({sortedCategories.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {!dataAvailable && (
          <div className="flex h-40 w-full flex-col items-center justify-center">
            <p>
              No{" "}
              <span
                className={cn(
                  "m-1",
                  type === "income" ? "text-emerald-500" : "text-red-500"
                )}
              >
                {type}
              </span>
              categories yet
            </p>
            <p className="text-sm text-muted-foreground">
              Create one to get started
            </p>
          </div>
        )}
        {cleanupMode && dataAvailable && sortedCategories.length === 0 && (
          <div className="flex h-32 w-full flex-col items-center justify-center bg-emerald-50/50 dark:bg-emerald-950/10">
            <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-medium text-emerald-600">Your categories are sparkling clean!</p>
            <p className="text-sm text-muted-foreground text-center">No unused categories found for this type.</p>
          </div>
        )}
        {dataAvailable && (
          <div className={cn(
            "grid grid-flow-row gap-2 p-3 sm:grid-flow-row sm:p-4",
            compactMode
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}>
            {sortedCategories.map((category: any) => (
              <CategoryCard category={category} key={category.name} />
            ))}
          </div>
        )}
      </Card>
    </SkeletonWrapper>
  );
}

function CategoryCard({ category }: { category: any }) {
  const { compactMode, iconSet } = useUIVibe();
  const hydrated = useHasHydrated();

  const LucideIcon = category.type === "income" ? TrendingUp : TrendingDown;

  if (!hydrated) return null;

  return (
    <div className={cn(
      "flex border-separate flex-col justify-between rounded-xl border shadow-sm transition-all hover:shadow-md",
      compactMode ? "p-2" : "p-0"
    )}>
      <div className={cn(
        "flex flex-col items-center gap-2",
        compactMode ? "p-1" : "p-4"
      )}>
        <span className={cn(
          "flex items-center justify-center rounded-lg bg-muted/50 transition-transform group-hover:scale-110",
          compactMode ? "text-xl w-10 h-10" : "text-3xl w-16 h-16"
        )} role="img">
          {iconSet === "emoji" ? (
            category.icon
          ) : (
            <LucideIcon className={cn(
              compactMode ? "w-5 h-5" : "w-8 h-8",
              category.type === "income" ? "text-emerald-500" : "text-red-500"
            )} />
          )}
        </span>
        <span className={cn(
          "font-bold truncate w-full text-center",
          compactMode ? "text-xs" : "text-sm"
        )}>{category.name}</span>
        {!compactMode && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {category._count?.transactions || 0} transactions
          </span>
        )}
      </div>

      <div className={cn(
        "flex w-full gap-1 p-2",
        compactMode ? "flex-row border-t mt-1 pt-2" : "flex-row sm:flex-col"
      )}>
        <EditCategoryDialog
          category={category}
          trigger={
            <Button
              className={cn(
                "w-full gap-2 text-muted-foreground hover:bg-blue-500/20",
                compactMode ? "h-7 px-2 text-[10px]" : "h-9"
              )}
              variant={"secondary"}
              size="sm"
            >
              <Pencil className={cn(compactMode ? "h-3 w-3" : "h-4 w-4", "shrink-0")} />
              {compactMode ? "" : "Edit"}
            </Button>
          }
        />
        <DeleteCategoryDialog
          category={category}
          trigger={
            <Button
              className={cn(
                "w-full gap-2 text-muted-foreground hover:bg-red-500/20",
                compactMode ? "h-7 px-2 text-[10px]" : "h-9"
              )}
              variant={"secondary"}
              size="sm"
            >
              <TrashIcon className={cn(compactMode ? "h-3 w-3" : "h-4 w-4", "shrink-0")} />
              {compactMode ? "" : "Remove"}
            </Button>
          }
        />
      </div>
    </div>
  );
}


function TagList() {
  const { compactMode } = useUIVibe();
  const hydrated = useHasHydrated();
  const [sortBy, setSortBy] = React.useState<"name" | "usage">("name");
  const [cleanupMode, setCleanupMode] = React.useState(false);

  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => fetch("/api/tags").then((res) => res.json()),
  });

  const dataAvailable = tagsQuery.data && tagsQuery.data.length > 0;

  // Sort tags based on selected option
  const sortedTags = React.useMemo(() => {
    if (!tagsQuery.data) return [];

    let filtered = [...tagsQuery.data];
    if (cleanupMode) {
      filtered = filtered.filter(t => (t._count?.transactions || 0) === 0);
    }

    if (sortBy === "name") {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return filtered.sort((a, b) =>
        (b._count?.transactions || 0) - (a._count?.transactions || 0)
      );
    }
  }, [tagsQuery.data, sortBy, cleanupMode]);

  const cleanupMutation = useMutation({
    mutationFn: () => fetch(`/api/manage/cleanup?target=tags`, { method: "POST" }).then(res => res.json()),
    onSuccess: (data) => {
      toast.success(data.message || "Cleanup completed");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setCleanupMode(false);
    },
    onError: () => {
      toast.error("Cleanup failed");
    }
  });

  const totalTags = tagsQuery.data?.length || 0;
  const totalUsage = tagsQuery.data?.reduce((acc: number, tag: any) =>
    acc + (tag._count?.transactions || 0), 0
  ) || 0;

  return (
    <SkeletonWrapper isLoading={tagsQuery.isFetching}>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
              <Tag className="h-10 w-10 shrink-0 rounded-lg bg-blue-400/10 p-2 text-blue-500 sm:h-12 sm:w-12" />
              <div className="min-w-0">
                <span className="block">Tags</span>
                <div className="text-sm text-muted-foreground">
                  {totalTags} {totalTags === 1 ? "tag" : "tags"} • {totalUsage} {totalUsage === 1 ? "transaction" : "transactions"}
                </div>
              </div>
            </div>

            <CreateTagDialog
              trigger={
                <Button className="w-full gap-2 text-sm sm:w-auto" size="sm">
                  <PlusSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">Create Tag</span>
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        <Separator />

        {dataAvailable && (
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-full text-sm text-muted-foreground sm:w-auto">Sort by:</span>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("name")}
                >
                  Name
                </Button>
                <Button
                  variant={sortBy === "usage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("usage")}
                >
                  Usage
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={cleanupMode ? "destructive" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setCleanupMode(!cleanupMode)}
              >
                <Eraser className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{cleanupMode ? "Exit Cleanup" : "Cleanup Mode"}</span>
                <span className="sm:hidden">{cleanupMode ? "Exit" : "Cleanup"}</span>
              </Button>

              {cleanupMode && sortedTags.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 animate-pulse"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete all ${sortedTags.length} unused tags?`)) {
                      cleanupMutation.mutate();
                    }
                  }}
                  disabled={cleanupMutation.isPending}
                >
                  {cleanupMutation.isPending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0" />}
                  <span className="hidden sm:inline">Delete All Unused</span>
                  <span className="sm:hidden">Delete</span> ({sortedTags.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {!dataAvailable && (
          <div className="flex h-40 w-full flex-col items-center justify-center">
            <p>
              No <span className="m-1 text-blue-500">tags</span> yet
            </p>
            <p className="text-sm text-muted-foreground">
              Create one to organize your transactions
            </p>
          </div>
        )}
        {cleanupMode && dataAvailable && sortedTags.length === 0 && (
          <div className="flex h-32 w-full flex-col items-center justify-center bg-emerald-50/50 dark:bg-emerald-950/10">
            <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-medium text-emerald-600">Your tags are sparkling clean!</p>
            <p className="text-sm text-muted-foreground text-center">No unused tags found.</p>
          </div>
        )}
        {dataAvailable && (
          <div className={cn(
            "grid grid-flow-row gap-2 p-3 sm:grid-flow-row sm:p-4",
            compactMode
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}>
            {sortedTags.map((tag: any) => (
              <TagCard tag={tag} key={tag.id} />
            ))}
          </div>
        )}
      </Card>
    </SkeletonWrapper>
  );
}

function TagCard({ tag }: { tag: any }) {
  const { compactMode } = useUIVibe();
  const hydrated = useHasHydrated();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tags?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete tag");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => {
      toast.error("Failed to delete tag");
    },
  });

  return (
    <div className={cn(
      "flex border-separate flex-col justify-between rounded-xl border shadow-sm transition-all hover:shadow-md",
      compactMode ? "p-2" : "p-0"
    )}>
      <div className={cn(
        "flex flex-col items-center gap-2",
        compactMode ? "p-1" : "p-4"
      )}>
        <div
          className={cn(
            "rounded-full border shadow-inner",
            compactMode ? "h-10 w-10" : "h-16 w-16"
          )}
          style={{ backgroundColor: tag.color }}
        />
        <span className={cn(
          "font-bold truncate w-full text-center",
          compactMode ? "text-xs" : "text-sm"
        )}>{tag.name}</span>
        {!compactMode && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {tag._count?.transactions || 0} transactions
          </span>
        )}
      </div>

      <div className={cn(
        "flex w-full gap-1 p-2",
        compactMode ? "flex-row border-t mt-1 pt-2" : "flex-row sm:flex-col"
      )}>
        <EditTagDialog
          tag={tag}
          trigger={
            <Button
              className={cn(
                "w-full gap-2 text-muted-foreground hover:bg-blue-500/20",
                compactMode ? "h-7 px-2 text-[10px]" : "h-9"
              )}
              variant="secondary"
              size="sm"
            >
              <Pencil className={cn(compactMode ? "h-3 w-3" : "h-4 w-4", "shrink-0")} />
              {compactMode ? "" : "Edit"}
            </Button>
          }
        />
        <DeleteTagDialog
          trigger={
            <Button
              className={cn(
                "w-full gap-2 text-muted-foreground hover:bg-red-500/20",
                compactMode ? "h-7 px-2 text-[10px]" : "h-9"
              )}
              variant="secondary"
              size="sm"
              disabled={deleteMutation.isPending}
            >
              <TrashIcon className={cn(compactMode ? "h-3 w-3" : "h-4 w-4", "shrink-0")} />
              {compactMode ? "" : "Remove"}
            </Button>
          }
          tagName={tag.name}
          transactionCount={tag._count?.transactions || 0}
          onConfirm={() => deleteMutation.mutate(tag.id)}
          isPending={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
