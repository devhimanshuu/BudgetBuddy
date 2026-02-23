"use client";

import React, { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface Props {
    trigger: ReactNode;
    assetId: string;
    assetName: string;
    assetType: "asset" | "liability";
}

const DeleteAssetDialog = ({ assetId, assetName, assetType, trigger }: Props) => {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/assets/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(`${assetType === "asset" ? "Asset" : "Liability"} deleted successfully`, {
                id: `delete-${assetId}`,
            });

            queryClient.invalidateQueries({
                queryKey: ["assets"],
            });
            queryClient.invalidateQueries({
                queryKey: ["net-worth"],
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Something went wrong", {
                id: `delete-${assetId}`,
            });
        },
    });

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the{" "}
                        <strong>{assetName}</strong> {assetType}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                            e.preventDefault();
                            toast.loading(`Deleting ${assetType}...`, {
                                id: `delete-${assetId}`,
                            });
                            deleteMutation.mutate(assetId);
                        }}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Delete"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteAssetDialog;
