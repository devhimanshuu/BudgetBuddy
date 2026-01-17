"use client";

import React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon } from "lucide-react";

interface Props {
    tags: { tag: { id: string; name: string; color: string } }[];
}

function TagsPopover({ tags }: Props) {
    if (tags.length <= 2) {
        return (
            <div className="flex flex-wrap gap-1">
                {tags.map((item) => {
                    if (!item || !item.tag) return null;
                    const { tag } = item;
                    return (
                        <span
                            key={tag.id}
                            className="inline-flex items-center rounded-sm px-1 text-[10px] font-medium ring-1 ring-inset"
                            style={{
                                backgroundColor: tag.color + "15",
                                color: tag.color,
                                "--tw-ring-color": tag.color + "30",
                            } as React.CSSProperties}
                        >
                            #{tag.name}
                        </span>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-1 items-center">
            {tags.slice(0, 2).map((item) => {
                if (!item || !item.tag) return null;
                const { tag } = item;
                return (
                    <span
                        key={tag.id}
                        className="inline-flex items-center rounded-sm px-1 text-[10px] font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: tag.color + "15",
                            color: tag.color,
                            "--tw-ring-color": tag.color + "30",
                        } as React.CSSProperties}
                    >
                        #{tag.name}
                    </span>
                );
            })}

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center h-4 px-1.5 text-[10px] text-muted-foreground hover:text-foreground rounded-sm border border-dashed"
                    >
                        +{tags.length - 2}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <TagIcon className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium leading-none">All Tags</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((item) => {
                                if (!item || !item.tag) return null;
                                const { tag } = item;
                                return (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                        style={{
                                            backgroundColor: tag.color + "15",
                                            color: tag.color,
                                            "--tw-ring-color": tag.color + "30",
                                        } as React.CSSProperties}
                                    >
                                        #{tag.name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default TagsPopover;
