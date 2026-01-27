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
import { Eraser, Loader2, Merge, Pencil, PlusSquare, Sparkles, TrashIcon, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";
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
import { Tag } from "lucide-react";
import MergeCategoriesDialog from "./_components/MergeCategoriesDialog";

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
      <div className="container flex flex-col gap-4 px-4 py-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Set your default currency for transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyComboBox />
          </CardContent>
        </Card>
        <CategoryList type="income" />
        <CategoryList type="expense" />
        <TagList />
      </div>
    </>
  );
};

export default page;


function CategoryList({ type }: { type: TransactionType }) {
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
          <div className="grid grid-flow-row gap-2 p-3 sm:grid-flow-row sm:grid-cols-2 sm:p-4 md:grid-cols-3 lg:grid-cols-4">
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
  return (
    <div className="flex border-separate flex-col justify-between rounded-md border shadow-md shadow-black/[0.1] dark:shadow-white/[0.1]">
      <div className="flex flex-col items-center gap-2 p-4">
        <span className="text-3xl" role="img">
          {category.icon}
        </span>
        <span>{category.name}</span>
        <span className="text-xs text-muted-foreground">
          {category._count?.transactions || 0} transactions
        </span>
      </div>
      <div className="flex w-full flex-row gap-2 p-2 sm:flex-col">
        <EditCategoryDialog
          category={category}
          trigger={
            <Button
              className="flex-1 gap-2 text-muted-foreground hover:bg-blue-500/20"
              variant={"secondary"}
              size="sm"
            >
              <Pencil className="h-4 w-4 shrink-0" />
              Edit
            </Button>
          }
        />
        <DeleteCategoryDialog
          category={category}
          trigger={
            <Button
              className="flex-1 gap-2 text-muted-foreground hover:bg-red-500/20"
              variant={"secondary"}
              size="sm"
            >
              <TrashIcon className="h-4 w-4 shrink-0" />
              Remove
            </Button>
          }
        />
      </div>
    </div>
  );
}


function TagList() {
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
          <div className="grid grid-flow-row gap-2 p-3 sm:grid-flow-row sm:grid-cols-2 sm:p-4 md:grid-cols-3 lg:grid-cols-4">
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
    <div className="flex border-separate flex-col justify-between rounded-md border shadow-md shadow-black/[0.1] dark:shadow-white/[0.1]">
      <div className="flex flex-col items-center gap-2 p-4">
        <div
          className="h-8 w-8 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        <span>{tag.name}</span>
        <span className="text-xs text-muted-foreground">
          {tag._count?.transactions || 0} transactions
        </span>
      </div>
      <div className="flex w-full flex-row gap-2 p-2 sm:flex-col">
        <EditTagDialog
          tag={tag}
          trigger={
            <Button
              className="flex-1 gap-2 text-muted-foreground hover:bg-blue-500/20"
              variant="secondary"
              size="sm"
            >
              <Pencil className="h-4 w-4 shrink-0" />
              Edit
            </Button>
          }
        />
        <DeleteTagDialog
          trigger={
            <Button
              className="flex-1 gap-2 text-muted-foreground hover:bg-red-500/20"
              variant="secondary"
              size="sm"
              disabled={deleteMutation.isPending}
            >
              <TrashIcon className="h-4 w-4 shrink-0" />
              Remove
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
