"use client";

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
import { ReactNode } from "react";

interface DeleteTagDialogProps {
    trigger: ReactNode;
    tagName: string;
    transactionCount: number;
    onConfirm: () => void;
    isPending?: boolean;
}

export default function DeleteTagDialog({
    trigger,
    tagName,
    transactionCount,
    onConfirm,
    isPending = false,
}: DeleteTagDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tag?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the tag{" "}
                        <span className="font-semibold text-foreground">&ldquo;{tagName}&rdquo;</span>?
                        {transactionCount > 0 && (
                            <>
                                <br />
                                <br />
                                This tag is currently used in{" "}
                                <span className="font-semibold text-foreground">
                                    {transactionCount} {transactionCount === 1 ? "transaction" : "transactions"}
                                </span>
                                . The tag will be removed from all transactions, but the transactions themselves will not be deleted.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? "Deleting..." : "Delete Tag"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
