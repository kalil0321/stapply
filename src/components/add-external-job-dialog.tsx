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
import { Textarea } from "@/components/ui/textarea";
import {
    PlusIcon,
    Loader2Icon,
    LinkIcon,
    UploadIcon,
    FileTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";
import { z } from "zod";

interface AddExternalJobDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJobAdded: () => void;
}

type JobMode = "individual" | "bulk";

interface JobData {
    title: string;
    company: string;
    location?: string;
    link: string;
    description?: string;
    employmentType?: string;
}

const urlSchema = z.string().url("Please enter a valid URL");

export function AddExternalJobDialog({
    open,
    onOpenChange,
    onJobAdded,
}: AddExternalJobDialogProps) {
    const [mode, setMode] = useState<JobMode>("individual");
    const [loading, setLoading] = useState(false);

    const addJobMutation = useMutation({
        mutationFn: async (data: FormData | Record<string, any>) => {
            const isFormData = data instanceof FormData;
            const response = await fetch("/api/saved-jobs/external", {
                method: "POST",
                headers: isFormData
                    ? undefined
                    : { "Content-Type": "application/json" },
                body: isFormData ? (data as FormData) : JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to add external jobs");
            }

            return response.json();
        },
    });

    // Individual job form data
    const [jobLink, setJobLink] = useState("");

    // Bulk jobs data
    const [bulkData, setBulkData] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const resetForm = () => {
        setJobLink("");
        setBulkData("");
        setCsvFile(null);
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const validateUrl = (url: string): boolean => {
        try {
            urlSchema.parse(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleIndividualSubmit = async () => {
        if (!jobLink.trim()) {
            toast.error("Please provide a job link");
            return;
        }

        if (!validateUrl(jobLink.trim())) {
            toast.error("Please enter a valid URL");
            return;
        }

        setLoading(true);
        
        // Show enhanced processing toast
        const processingToast = toast.loading("Analyzing job posting...", {
            description: "Using AI to extract job details from the URL",
        });
        
        try {
            const result = await addJobMutation.mutateAsync({
                jobLink: jobLink.trim(),
                mode: "individual",
            });
            
            toast.dismiss(processingToast);
            
            // Show success with extracted job info if available
            if (result.jobData) {
                toast.success(`Added "${result.jobData.title}" at ${result.jobData.company}!`, {
                    description: result.jobData.location ? `Location: ${result.jobData.location}` : undefined,
                });
            } else {
                toast.success("Job added successfully!");
            }
            
            onJobAdded();
            handleClose();
        } catch (error) {
            toast.dismiss(processingToast);
            console.error("Error adding job:", error);
            
            const errorMessage = error instanceof Error ? error.message : "Failed to add job";
            
            // Provide more specific error messages
            if (errorMessage.includes("timeout")) {
                toast.error("Request timed out", {
                    description: "The job analysis took too long. Please try again.",
                });
            } else if (errorMessage.includes("extract valid job information")) {
                toast.error("Could not analyze job posting", {
                    description: "Please check the URL and try again, or the page may require login.",
                });
            } else if (errorMessage.includes("already saved")) {
                toast.error("Job already saved", {
                    description: "This job is already in your saved jobs list.",
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const parseCSV = (csvText: string): string[] => {
        const lines = csvText.trim().split("\n");
        if (lines.length < 1) return [];

        // Extract URLs from CSV, checking all columns
        const urls: string[] = [];

        lines.forEach((line) => {
            const values = line
                .split(",")
                .map((v) => v.trim().replace(/"/g, ""));
            values.forEach((value) => {
                if (validateUrl(value)) {
                    urls.push(value);
                }
            });
        });

        return urls;
    };

    const processJobs = async (jobLinks: string[]) => {
        let successCount = 0;
        let failureCount = 0;

        for (const jobLink of jobLinks) {
            try {
                const response = await fetch("/api/saved-jobs/external", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        jobLink: jobLink,
                        mode: "individual",
                    }),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                failureCount++;
            }
        }

        return { successCount, failureCount };
    };

    const handleBulkSubmit = async () => {
        if (!bulkData.trim() && !csvFile) {
            toast.error("Please provide job data or upload a CSV file");
            return;
        }
        setLoading(true);
        try {
            let jobLinks: string[] = [];

            if (csvFile) {
                // Process CSV file
                const csvText = await csvFile.text();
                jobLinks = parseCSV(csvText);
            } else {
                // Process bulk text data - just URLs, one per line
                const lines = bulkData
                    .trim()
                    .split("\n")
                    .filter((line) => line.trim());

                // Extract and validate URLs from each line
                jobLinks = lines.filter((line) => validateUrl(line.trim()));
            }

            if (jobLinks.length === 0) {
                toast.error("No valid job URLs found");
                return;
            }

            const { successCount, failureCount } = await processJobs(jobLinks);

            if (successCount > 0) {
                toast.success(`Successfully added ${successCount} job(s)!`);
                if (failureCount > 0) {
                    toast.warning(`${failureCount} job(s) failed to add`);
                }
                onJobAdded();
                handleClose();
            } else {
                toast.error("Failed to add any jobs");
            }
        } catch (error) {
            console.error("Error processing jobs:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to process jobs"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const csvFile = files.find(
            (file) => file.type === "text/csv" || file.name.endsWith(".csv")
        );

        if (csvFile) {
            setCsvFile(csvFile);
        } else {
            toast.error("Please drop a CSV file");
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCsvFile(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-3xl h-[600px] flex flex-col"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <DialogHeader className="px-4">
                    <DialogTitle>Add External Job</DialogTitle>
                    <DialogDescription>
                        Add jobs from external sources to your saved jobs list
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Toggle */}
                <div className="px-4">
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                        <Button
                            variant={
                                mode === "individual" ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => setMode("individual")}
                            className="flex-1"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Single Job
                        </Button>
                        <Button
                            variant={mode === "bulk" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setMode("bulk")}
                            className="flex-1"
                        >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Bulk & CSV
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    <div className="px-4 mb-1">
                        {mode === "individual" ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Job Link{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="https://company.com/jobs/123"
                                        value={jobLink}
                                        onChange={(e) =>
                                            setJobLink(e.target.value)
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Paste any job URL and we'll extract the
                                        details automatically
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Bulk Text Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Job Data
                                    </label>
                                    <Textarea
                                        placeholder="Paste job URLs, one per line..."
                                        value={bulkData}
                                        onChange={(e) =>
                                            setBulkData(e.target.value)
                                        }
                                        rows={6}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Paste job URLs from any site, one per
                                        line. We'll extract job details
                                        automatically.
                                    </p>
                                </div>

                                {/* OR separator */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 border-t border-muted"></div>
                                    <span className="text-sm text-muted-foreground">
                                        OR
                                    </span>
                                    <div className="flex-1 border-t border-muted"></div>
                                </div>

                                {/* CSV Upload Area */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                        isDragOver
                                            ? "border-primary bg-primary/5"
                                            : "border-muted-foreground/25"
                                    }`}
                                >
                                    {csvFile ? (
                                        <div className="space-y-2">
                                            <FileTextIcon className="w-8 h-8 mx-auto text-green-600" />
                                            <p className="font-medium">
                                                {csvFile.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {(csvFile.size / 1024).toFixed(
                                                    1
                                                )}{" "}
                                                KB
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCsvFile(null)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <UploadIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">
                                                    Drop your CSV file here
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    or click to browse
                                                </p>
                                            </div>
                                            <label
                                                htmlFor="csv-upload"
                                                className="sr-only"
                                            >
                                                Upload CSV file
                                            </label>
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="csv-upload"
                                                title="Upload CSV file"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            "csv-upload"
                                                        )
                                                        ?.click()
                                                }
                                            >
                                                Browse Files
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* CSV Format Info */}
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-sm font-medium mb-1">
                                        CSV Format:
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Any CSV containing job URLs. We'll
                                        automatically find and extract all URLs
                                        from your CSV file.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={
                            mode === "individual"
                                ? handleIndividualSubmit
                                : handleBulkSubmit
                        }
                        disabled={loading}
                    >
                        {loading && (
                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {loading 
                            ? (mode === "individual" ? "Analyzing Job..." : "Processing Jobs...")
                            : (mode === "individual" ? "Add Job" : "Add Jobs")
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
