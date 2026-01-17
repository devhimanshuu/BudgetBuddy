"use client";

import React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { StickyNote } from "lucide-react";

interface Props {
    note: string;
}

function NoteDetailsPopover({ note }: Props) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-foreground justify-start"
                >
                    <StickyNote className="h-3 w-3 shrink-0" />
                    <span className="text-xs truncate max-w-[100px]">{note}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <StickyNote className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium leading-none">Note Details</h4>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note}
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default NoteDetailsPopover;
