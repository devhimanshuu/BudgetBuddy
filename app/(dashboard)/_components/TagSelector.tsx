"use client";

import { Badge } from "@/components/ui/badge";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, X, Sparkles, Palette } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#14b8a6", // Teal
];

export default function TagSelector({
  selectedTags,
  onTagsChange,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [customHue, setCustomHue] = useState(200);
  const [customSaturation, setCustomSaturation] = useState(80);
  const [customLightness, setCustomLightness] = useState(50);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const customColor = hslToHex(customHue, customSaturation, customLightness);

  const { data: tags } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: () => fetch("/api/tags").then((res) => res.json()),
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tag");
      }

      return response.json();
    },
    onSuccess: (newTag) => {
      toast.success("Tag created successfully!");
      queryClient.invalidateQueries({ queryKey: ["tags"] });

      // Auto-select the newly created tag
      onTagsChange([...selectedTags, newTag]);

      // Reset form
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setIsCreating(false);
      setSearchValue("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSelectTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Please enter a tag name");
      return;
    }

    createTagMutation.mutate({
      name: newTagName.trim(),
      color: newTagColor,
    });
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1"
            style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
          >
            <span style={{ color: tag.color }}>{tag.name}</span>
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemoveTag(tag.id)}
            />
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            {!isCreating && (
              <>
                <CommandInput
                  placeholder="Search tags..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {tags?.map((tag) => {
                      const isSelected = selectedTags.some((t) => t.id === tag.id);
                      return (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => handleSelectTag(tag)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div
                            className="mr-2 h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setIsCreating(true);
                        setNewTagName(searchValue);
                      }}
                      className="gap-2 text-primary"
                    >
                      <Sparkles className="h-4 w-4" />
                      Create new tag
                      {searchValue && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          &ldquo;{searchValue}&rdquo;
                        </span>
                      )}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </>
            )}

            {isCreating && (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tag Name</label>
                  <Input
                    placeholder="e.g., Business, Travel"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    maxLength={50}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTag();
                      } else if (e.key === "Escape") {
                        handleCancelCreate();
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-6 w-6 rounded-full border-2 transition-all ${newTagColor === color
                          ? "scale-110 border-foreground ring-2 ring-offset-2"
                          : "border-transparent hover:scale-105"
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}

                    {/* Custom Color Picker */}
                    <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center ${!PRESET_COLORS.includes(newTagColor)
                            ? "scale-110 border-foreground ring-2 ring-offset-2"
                            : "border-dashed border-muted-foreground hover:scale-105 hover:border-foreground"
                            }`}
                          style={{
                            backgroundColor: !PRESET_COLORS.includes(newTagColor) ? newTagColor : "transparent"
                          }}
                        >
                          {PRESET_COLORS.includes(newTagColor) && (
                            <Palette className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" side="left">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Custom Color</h4>
                            <p className="text-xs text-muted-foreground">
                              Adjust sliders to create your color
                            </p>
                          </div>

                          {/* Color Preview */}
                          <div className="flex items-center justify-center">
                            <div
                              className="h-12 w-12 rounded-full border-4 border-border shadow-lg"
                              style={{ backgroundColor: customColor }}
                            />
                          </div>

                          {/* Hue Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium">Hue</label>
                              <span className="text-xs text-muted-foreground">{customHue}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={customHue}
                              onChange={(e) => setCustomHue(Number(e.target.value))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, 
                                  hsl(0, 100%, 50%), 
                                  hsl(60, 100%, 50%), 
                                  hsl(120, 100%, 50%), 
                                  hsl(180, 100%, 50%), 
                                  hsl(240, 100%, 50%), 
                                  hsl(300, 100%, 50%), 
                                  hsl(360, 100%, 50%))`
                              }}
                            />
                          </div>

                          {/* Saturation Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium">Saturation</label>
                              <span className="text-xs text-muted-foreground">{customSaturation}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={customSaturation}
                              onChange={(e) => setCustomSaturation(Number(e.target.value))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, 
                                  hsl(${customHue}, 0%, 50%), 
                                  hsl(${customHue}, 100%, 50%))`
                              }}
                            />
                          </div>

                          {/* Lightness Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium">Brightness</label>
                              <span className="text-xs text-muted-foreground">{customLightness}%</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="80"
                              value={customLightness}
                              onChange={(e) => setCustomLightness(Number(e.target.value))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, 
                                  hsl(${customHue}, ${customSaturation}%, 20%), 
                                  hsl(${customHue}, ${customSaturation}%, 50%), 
                                  hsl(${customHue}, ${customSaturation}%, 80%))`
                              }}
                            />
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              setNewTagColor(customColor);
                              setShowColorPicker(false);
                            }}
                            className="w-full"
                            size="sm"
                          >
                            Apply Color
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose a preset or click palette for custom
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelCreate}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={createTagMutation.isPending}
                    className="flex-1"
                  >
                    {createTagMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
