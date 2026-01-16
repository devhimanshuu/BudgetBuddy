"use client";

import CreateCategoryDialog from "@/app/(dashboard)/_components/CreateCategoryDialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TransactionType } from "@/lib/type";
import { cn } from "@/lib/utils";
import { Category } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface Props {
  type: TransactionType;
  onChange: (value: Category) => void;
}

function CategoryPicker({ type, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: () =>
      fetch(`/api/categories?type=${type}`).then((res) => res.json()),
  });

  // Fetch recent categories
  const recentCategoriesQuery = useQuery({
    queryKey: ["categories", "recent", type],
    queryFn: () =>
      fetch(`/api/categories/recent?type=${type}`).then((res) => res.json()),
    enabled: !!type,
  });

  // Removed useEffect that caused infinite loop

  const selectedCategory = categoriesQuery.data?.find(
    (category: Category) => category.name === value
  );

  const successCallback = useCallback(
    (category: Category) => {
      setValue(category.name);
      setOpen((prev) => !prev);
      onChange(category);
    },
    [setValue, setOpen, onChange]
  );

  // Get recent category names for filtering
  const recentCategoryNames = new Set(
    recentCategoriesQuery.data?.map((cat: any) => cat.name) || []
  );

  // Split categories into recent and other
  const recentCategories = categoriesQuery.data?.filter((cat: Category) =>
    recentCategoryNames.has(cat.name)
  ) || [];

  const otherCategories = categoriesQuery.data?.filter((cat: Category) =>
    !recentCategoryNames.has(cat.name)
  ) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedCategory ? (
            <CategoryRow category={selectedCategory} />
          ) : (
            "Select category"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <CommandInput placeholder="Search category..." />
          <CreateCategoryDialog type={type} successCallback={successCallback} />
          <CommandEmpty>
            <p>Category not found</p>
            <p className="text-xs text-muted-foreground">
              Tip: Create a new category
            </p>
          </CommandEmpty>

          {/* Recent Categories */}
          {recentCategories.length > 0 && (
            <CommandGroup heading="Recent">
              <CommandList>
                {recentCategories.map((category: Category) => (
                  <CommandItem
                    key={category.name}
                    onSelect={() => {
                      setValue(category.name);
                      setOpen((prev) => !prev);
                      onChange(category);
                    }}
                  >
                    <CategoryRow category={category} />
                    <Check
                      className={cn(
                        "mr-2 w-4 h-4 opacity-0",
                        value === category.name && "opacity-100"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          )}

          {/* All Categories */}
          {otherCategories.length > 0 && (
            <CommandGroup heading={recentCategories.length > 0 ? "All Categories" : undefined}>
              <CommandList>
                {otherCategories.map((category: Category) => (
                  <CommandItem
                    key={category.name}
                    onSelect={() => {
                      setValue(category.name);
                      setOpen((prev) => !prev);
                      onChange(category);
                    }}
                  >
                    <CategoryRow category={category} />
                    <Check
                      className={cn(
                        "mr-2 w-4 h-4 opacity-0",
                        value === category.name && "opacity-100"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CategoryPicker;

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className="flex items-center gap-2">
      <span role="img">{category.icon}</span>
      <span>{category.name}</span>
    </div>
  );
}
