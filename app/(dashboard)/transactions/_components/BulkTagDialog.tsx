"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BulkUpdateTransactionsTags } from "../_actions/bulkUpdateTransactions";
import { toast } from "sonner";
import TagSelector from "../../_components/TagSelector";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    transactionIds: string[];
    onSuccess: () => void;
}

export default function BulkTagDialog({
    open,
    setOpen,
    transactionIds,
    onSuccess,
}: Props) {
    const [selectedTags, setSelectedTags] = useState<
        { id: string; name: string; color: string }[]
    >([]);
    const [operation, setOperation] = useState<"ADD" | "REMOVE" | "REPLACE">(
        "ADD"
    );

    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            BulkUpdateTransactionsTags(
                transactionIds,
                selectedTags.map((t) => t.id),
                operation
            ),
        onSuccess: () => {
            toast.success(
                `Bulk operation completed on ${transactionIds.length} transactions`,
                { id: "bulk-tags" }
            );
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setOpen(false);
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.message, { id: "bulk-tags" });
        },
    });

    const handleApply = () => {
        if (selectedTags.length === 0 && (operation === "ADD" || operation === "REMOVE")) {
            toast.error("Please select at least one tag");
            return;
        }
        toast.loading("Applying changes...", { id: "bulk-tags" });
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bulk Tag Operation</DialogTitle>
                    <DialogDescription>
                        Selected {transactionIds.length} transactions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-base">Operation</Label>
                        <RadioGroup
                            value={operation}
                            onValueChange={(v: any) => setOperation(v)}
                            className="flex flex-col space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ADD" id="op-add" />
                                <Label htmlFor="op-add" className="font-normal">
                                    <strong>Add Tags</strong> (append to existing tags)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="REMOVE" id="op-remove" />
                                <Label htmlFor="op-remove" className="font-normal">
                                    <strong>Remove Tags</strong> (delete from selected transactions)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="REPLACE" id="op-replace" />
                                <Label htmlFor="op-replace" className="font-normal">
                                    <strong>Replace Tags</strong> (clear existing and set new)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base">Target Tags</Label>
                        <TagSelector
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Apply Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
