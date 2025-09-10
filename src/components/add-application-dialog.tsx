"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    BriefcaseIcon,
    Loader2Icon,
    LinkIcon,
    PlusCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AddApplicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApplicationAdded: () => void;
}

export function AddApplicationDialog({
    open,
    onOpenChange,
    onApplicationAdded,
}: AddApplicationDialogProps) {
    const [jobUrl, setJobUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const addApplicationMutation = useMutation({
        mutationFn: async (url: string) => {
            const response = await fetch("/api/applications/external", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobUrl: url }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create application");
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success(data.message || "Application created successfully!");
            onApplicationAdded();
            handleClose();
        },
        onError: (error) => {
            console.error("Error creating application:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create application"
            );
        },
    });

    const resetForm = () => {
        setJobUrl("");
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async () => {
        const url = jobUrl.trim();

        if (!url) {
            toast.error("Please enter a job URL");
            return;
        }

        if (!isValidUrl(url)) {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsLoading(true);
        try {
            await addApplicationMutation.mutateAsync(url);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isLoading) {
            handleSubmit();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BriefcaseIcon className="size-5" />
                        Add Application
                    </DialogTitle>
                    <DialogDescription>
                        Enter the URL of the job you want to track your
                        application for. We'll automatically fetch the job
                        details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="job-url"
                            className="text-sm font-medium"
                        >
                            Job URL
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                id="job-url"
                                type="url"
                                placeholder="https://company.com/jobs/position"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-10"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-start gap-2">
                            <PlusCircleIcon className="size-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">
                                    What happens next?
                                </p>
                                <ul className="space-y-1 text-xs">
                                    <li>
                                        • We'll create an application record for
                                        tracking
                                    </li>
                                    <li>
                                        • Job details will be fetched
                                        automatically
                                    </li>
                                    <li>
                                        • You can track your application
                                        progress
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !jobUrl.trim()}
                    >
                        {isLoading ? (
                            <>
                                <Loader2Icon className="size-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <PlusCircleIcon className="size-4 mr-2" />
                                Add Application
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
