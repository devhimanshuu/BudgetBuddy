"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagSelector from "./TagSelector";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface SearchFilters {
  query: string;
  tags: Tag[];
  category: string;
  type: string;
  minAmount: string;
  maxAmount: string;
  from: string;
  to: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories?: string[];
}

export default function AdvancedSearch({
  onSearch,
  categories = [],
}: AdvancedSearchProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    tags: [],
    category: "",
    type: "",
    minAmount: "",
    maxAmount: "",
    from: "",
    to: "",
  });

  const handleSearch = () => {
    onSearch(filters);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: "",
      tags: [],
      category: "",
      type: "",
      minAmount: "",
      maxAmount: "",
      from: "",
      to: "",
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Advanced Search
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Search</SheetTitle>
          <SheetDescription>
            Search and filter transactions with multiple criteria
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Text Search */}
          <div className="space-y-2">
            <Label htmlFor="query">Search Text</Label>
            <Input
              id="query"
              placeholder="Search in description and notes..."
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelector
              selectedTags={filters.tags}
              onTagsChange={(tags) => setFilters({ ...filters, tags })}
              allowCreation={false}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters({ ...filters, category: value === "all_categories" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_categories">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value === "all_types" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) =>
                  setFilters({ ...filters, minAmount: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) =>
                  setFilters({ ...filters, maxAmount: e.target.value })
                }
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="space-y-2">
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSearch} className="flex-1">
              Search
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
