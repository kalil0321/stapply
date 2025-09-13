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
import { Loader2Icon, TrashIcon } from "lucide-react";

interface DeleteApplicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
    applicationTitle?: string;
    companyName?: string;
}

export function DeleteApplicationDialog({
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
    applicationTitle = "this application",
    companyName,
}: DeleteApplicationDialogProps) {
    const displayTitle = applicationTitle !== "this application" 
        ? `${applicationTitle}${companyName ? ` at ${companyName}` : ""}`
        : applicationTitle;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        if (!isDeleting) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrashIcon className="size-5 text-destructive" />
                        Delete Application
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {displayTitle}? This action cannot be undone.
                        {applicationTitle !== "this application" && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                This will permanently remove the application from your records.
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2Icon className="size-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <TrashIcon className="size-4" />
                                Delete Application
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
