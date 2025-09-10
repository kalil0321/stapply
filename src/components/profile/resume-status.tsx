"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { Loader2, Upload, FileText, CheckCircle, Info } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResumeStatusProps {
    resumeUrl?: string | null;
    resumeUploaded?: boolean;
    onResumeDataParsed?: (data: any) => void;
}

export interface ResumeStatusRef {
    uploadResume: () => Promise<string | null>;
    getSelectedFile: () => File | null;
    hasFileSelected: () => boolean;
}

export const ResumeStatus = forwardRef<ResumeStatusRef, ResumeStatusProps>(
    ({ resumeUrl: initialResumeUrl, onResumeDataParsed }, ref) => {
        const searchParams = useSearchParams();
        const isEditing = searchParams.get("update") === "true";
        const { data: session } = useSession();
        const userId = session?.user?.id;

        const [uploading, setUploading] = useState(false);
        const [parsing, setParsing] = useState(false);
        const [resumeUrl, setResumeUrl] = useState<string | null>(
            initialResumeUrl || null
        );
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [updateProfileWithResume, setUpdateProfileWithResume] =
            useState(false);
        const [uploadError, setUploadError] = useState<string | null>(null);
        const [parseSuccess, setParseSuccess] = useState(false);

        // Expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            uploadResume: async () => {
                if (!selectedFile || !userId) {
                    return resumeUrl; // Return existing URL if no new file
                }

                setUploading(true);
                setUploadError(null);

                try {
                    const formData = new FormData();
                    formData.append("file", selectedFile);

                    const response = await fetch("/api/profile/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                            errorData.error || "Failed to upload file"
                        );
                    }

                    const data = await response.json();
                    setResumeUrl(data.resumeUrl);
                    setSelectedFile(null); // Clear selected file after successful upload
                    return data.resumeUrl;
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Upload failed";
                    setUploadError(errorMessage);
                    throw error;
                } finally {
                    setUploading(false);
                }
            },
            getSelectedFile: () => selectedFile,
            hasFileSelected: () => !!selectedFile,
        }));

        const parseResumeFile = async (file: File) => {
            if (!onResumeDataParsed) return;

            setParsing(true);
            setUploadError(null);
            setParseSuccess(false);

            try {
                // Read file as array buffer for parsing
                const fileBuffer = await file.arrayBuffer();

                const parseResponse = await fetch("/api/profile/parse-resume", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileBuffer: Array.from(new Uint8Array(fileBuffer)),
                        filename: file.name,
                        parseOnly: true, // Flag to indicate we only want parsing, not DB update
                    }),
                });

                if (!parseResponse.ok) {
                    const errorData = await parseResponse.json();
                    throw new Error(
                        errorData.error || "Failed to parse resume"
                    );
                }

                const parsedData = await parseResponse.json();
                onResumeDataParsed(parsedData);
                setParseSuccess(true);
            } catch (error) {
                console.error("Failed to parse resume:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to parse resume";
                setUploadError(`Parse failed: ${errorMessage}`);
            } finally {
                setParsing(false);
            }
        };

        const handleFileChange = async (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setSelectedFile(file);
            setUploadError(null);
            setParseSuccess(false);

            // If user wants to update profile with resume data, parse it immediately
            if (updateProfileWithResume) {
                await parseResumeFile(file);
            }
        };

        const handleAutoFillToggle = async (checked: boolean) => {
            setUpdateProfileWithResume(checked);

            // If auto-fill is enabled and we have a selected file, parse it immediately
            if (checked && selectedFile && onResumeDataParsed) {
                await parseResumeFile(selectedFile);
            }
        };

        if (!isEditing) {
            // view mode
            return (
                <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-gray-600">
                        {resumeUrl ? (
                            <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium"
                            >
                                View resume
                            </a>
                        ) : (
                            <span>No resume uploaded</span>
                        )}
                    </div>
                </div>
            );
        }

        // edit mode
        return (
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Resume</h3>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">
                                Upload your resume to automatically fill form
                                fields or keep as attachment. File will be
                                uploaded when you save the form.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                    {/* File Selection Area */}
                    <div className="space-y-3">
                        <label
                            htmlFor="resume-upload"
                            className={cn(
                                "flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                selectedFile
                                    ? "border-green-300 bg-green-50 text-green-700"
                                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                                (uploading || parsing) &&
                                    "opacity-50 pointer-events-none"
                            )}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-medium">
                                        Uploading resume...
                                    </span>
                                </>
                            ) : parsing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-medium">
                                        Parsing resume data...
                                    </span>
                                </>
                            ) : selectedFile ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <div className="text-center">
                                        <div className="font-medium">
                                            File selected: {selectedFile.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Click to select a different file
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    <div className="text-center">
                                        <div className="font-medium">
                                            {resumeUrl
                                                ? "Replace resume"
                                                : "Select resume file"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            PDF files only, max 5MB
                                        </div>
                                    </div>
                                </>
                            )}
                        </label>

                        <input
                            id="resume-upload"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={uploading || parsing}
                        />
                    </div>

                    {/* Auto-fill Option */}
                    <div className="flex items-start gap-3 p-3 rounded-lg">
                        <input
                            id="auto-fill-checkbox"
                            type="checkbox"
                            checked={updateProfileWithResume}
                            onChange={(e) =>
                                handleAutoFillToggle(e.target.checked)
                            }
                            className="mt-1 w-4 h-4 text-blue-600 rounded"
                            disabled={uploading || parsing}
                        />
                        <div className="flex-1 space-y-1">
                            <label
                                htmlFor="auto-fill-checkbox"
                                className="text-sm font-medium text-blue-900 cursor-pointer"
                            >
                                Auto-fill form with resume data
                            </label>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-blue-700">
                                    Automatically extract and populate form
                                    fields from your resume when selected
                                </p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-blue-600 cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            When enabled, your resume will be
                                            parsed using AI to extract
                                            information like work experience,
                                            education, and skills to
                                            automatically fill the form. You can
                                            review and edit the data before
                                            saving.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {parseSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-800">
                                <strong>Resume parsed successfully!</strong>{" "}
                                Form has been auto-filled with your resume data.
                            </p>
                        </div>
                    )}

                    {selectedFile && !parsing && !parseSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                <strong>Ready to upload:</strong> Your file will
                                be uploaded when you save the form.
                            </p>
                        </div>
                    )}

                    {resumeUrl && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">
                                    Current resume
                                </span>
                            </div>
                            <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                View current
                            </a>
                        </div>
                    )}

                    {uploadError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                <strong>Upload failed:</strong> {uploadError}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        );
    }
);

ResumeStatus.displayName = "ResumeStatus";
