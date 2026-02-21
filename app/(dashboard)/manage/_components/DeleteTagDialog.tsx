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
            <AlertDialogContent className="w-[95vw] max-w-[400px] rounded-2xl border-destructive/20 bg-gradient-to-b from-background to-destructive/5 backdrop-blur-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">Delete Tag?</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground/70">
                        Are you sure you want to delete the tag{" "}
                        <strong className="text-foreground italic">&ldquo;{tagName}&rdquo;</strong>?
                        {transactionCount > 0 && (
                            <>
                                <br />
                                <br />
                                This tag is currently used in{" "}
                                <span className="font-bold text-foreground">
                                    {transactionCount} {transactionCount === 1 ? "transaction" : "transactions"}
                                </span>
                                . It will be removed from them, but transactions remain intact.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-3 pt-2">
                    <AlertDialogCancel disabled={isPending} className="flex-1 rounded-xl h-11">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11"
                    >
                        {isPending ? "Deleting..." : "Delete Tag"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
