"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    BriefcaseIcon,
    LinkIcon,
    Loader2Icon,
    PlayIcon,
    PlusIcon,
} from "lucide-react";

interface ApplicationActionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApplicationAdded: () => void;
}

export function ApplicationActionsDialog({
    open,
    onOpenChange,
    onApplicationAdded,
}: ApplicationActionsDialogProps) {
    const [activeTab, setActiveTab] = useState("create");
    const [jobUrl, setJobUrl] = useState("");
    const [customJobUrl, setCustomJobUrl] = useState("");
    const [customInstructions, setCustomInstructions] = useState("");
    const [runHeadless, setRunHeadless] = useState(false);
    const [maxSteps, setMaxSteps] = useState("100");

    const resetForm = () => {
        setJobUrl("");
        setCustomJobUrl("");
        setCustomInstructions("");
        setRunHeadless(false);
        setMaxSteps("100");
        setActiveTab("create");
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const addApplicationMutation = useMutation({
        mutationFn: async (url: string) => {
            const response = await fetch("/api/applications", {
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
            handleClose(false);
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

    const triggerApplicationMutation = useMutation({
        mutationFn: async (payload: {
            jobUrl: string;
            instructions: string;
            headless: boolean;
            maxSteps: number;
        }) => {
            const response = await fetch("/api/custom-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMessage = "Failed to trigger application";
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (err) {
                    console.error("Failed to parse error response", err);
                }
                throw new Error(errorMessage);
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success("Automation started. Opening live view in a new tab.");
            if (data?.live_url) {
                window.open(data.live_url, "_blank", "noopener,noreferrer");
            }
            handleClose(false);
        },
        onError: (error) => {
            console.error("Error triggering application:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to trigger application"
            );
        },
    });

    const handleCreateSubmit = async () => {
        const url = jobUrl.trim();

        if (!url) {
            toast.error("Please enter a job URL");
            return;
        }

        if (!isValidUrl(url)) {
            toast.error("Please enter a valid URL");
            return;
        }

        await addApplicationMutation.mutateAsync(url);
    };

    const handleTriggerSubmit = async () => {
        const url = customJobUrl.trim();
        const steps = Number(maxSteps);

        if (!url) {
            toast.error("Please enter a job URL");
            return;
        }

        if (!isValidUrl(url)) {
            toast.error("Please enter a valid URL");
            return;
        }

        if (Number.isNaN(steps) || steps <= 0) {
            toast.error("Max steps must be a positive number");
            return;
        }

        await triggerApplicationMutation.mutateAsync({
            jobUrl: url,
            instructions: customInstructions.trim(),
            headless: runHeadless,
            maxSteps: steps,
        });
    };

    const creating = addApplicationMutation.isPending;
    const triggering = triggerApplicationMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BriefcaseIcon className="size-5" />
                        Start a new application
                    </DialogTitle>
                    <DialogDescription>
                        Add a job to your tracker or trigger a local automation
                        to apply for you.
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-4"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create" className="gap-2">
                            <PlusIcon className="size-4" />
                            Create application
                        </TabsTrigger>
                        <TabsTrigger value="trigger" className="gap-2">
                            <PlayIcon className="size-4" />
                            Trigger automation
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="application-job-url">Job URL</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="application-job-url"
                                    type="url"
                                    placeholder="https://company.com/jobs/position"
                                    value={jobUrl}
                                    onChange={(e) => setJobUrl(e.target.value)}
                                    disabled={creating || triggering}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                We'll fetch the job details and add this
                                application to your tracker.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="trigger" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="custom-application-job-url">
                                Job URL
                            </Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="custom-application-job-url"
                                    type="url"
                                    placeholder="https://company.com/jobs/position"
                                    value={customJobUrl}
                                    onChange={(e) => setCustomJobUrl(e.target.value)}
                                    disabled={creating || triggering}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-application-instructions">
                                Additional instructions (optional)
                            </Label>
                            <Textarea
                                id="custom-application-instructions"
                                placeholder="Share anything that will help the automation personalize your application."
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                disabled={creating || triggering}
                                className="min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground">
                                Instructions will be passed directly to your local
                                automation server.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">
                                        Headless mode
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Run the automation without opening a
                                        visible browser window.
                                    </p>
                                </div>
                                <Switch
                                    checked={runHeadless}
                                    onCheckedChange={setRunHeadless}
                                    disabled={creating || triggering}
                                />
                            </div>
                            <div className="rounded-lg border p-3">
                                <Label htmlFor="custom-application-max-steps" className="text-xs uppercase text-muted-foreground">
                                    Max steps
                                </Label>
                                <Input
                                    id="custom-application-max-steps"
                                    type="number"
                                    min={1}
                                    value={maxSteps}
                                    onChange={(e) => setMaxSteps(e.target.value)}
                                    disabled={creating || triggering}
                                    className="mt-2"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Limit how many actions the automation can
                                    take (default 100).
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={creating || triggering}
                    >
                        Cancel
                    </Button>
                    {activeTab === "create" ? (
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={creating || triggering || !jobUrl.trim()}
                        >
                            {creating ? (
                                <>
                                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="mr-2 size-4" />
                                    Add application
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleTriggerSubmit}
                            disabled={
                                creating ||
                                triggering ||
                                !customJobUrl.trim()
                            }
                        >
                            {triggering ? (
                                <>
                                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                                    Triggering...
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="mr-2 size-4" />
                                    Trigger automation
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
