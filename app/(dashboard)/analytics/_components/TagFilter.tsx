"use client";

import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import TagSelector from "../../_components/TagSelector";

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface TagFilterProps {
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
}

export default function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
    const [open, setOpen] = useState(false);

    const handleClearAll = () => {
        onTagsChange([]);
    };

    return (
        <div className="flex items-center gap-2">
            {selectedTags.length > 0 && (
                <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                        {selectedTags.slice(0, 2).map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="gap-1 text-xs"
                                style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
                            >
                                <span style={{ color: tag.color }}>{tag.name}</span>
                            </Badge>
                        ))}
                        {selectedTags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                                +{selectedTags.length - 2}
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter by Tags
                        {selectedTags.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {selectedTags.length}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Filter by Tags</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Select tags to filter analytics data
                            </p>
                        </div>

                        <TagSelector
                            selectedTags={selectedTags}
                            onTagsChange={onTagsChange}
                        />

                        <div className="flex gap-2 pt-2">
                            <Button
                                size="sm"
                                onClick={() => setOpen(false)}
                                className="flex-1"
                            >
                                Apply
                            </Button>
                            {selectedTags.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleClearAll}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
