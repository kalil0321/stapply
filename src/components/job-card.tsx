import { Job } from "@/lib/types";

import {
    BuildingIcon,
    MapPinIcon,
    ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function JobCard({ job, className }: { job: Job, className?: string }) {
    return (
        <div className={cn("relative p-3 rounded-lg border border-border/50 bg-card hover:bg-accent hover:border-border transition-all duration-200 overflow-hidden", className)}>
            <div className="space-y-2">
                {/* Title and Actions */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="text-base font-semibold leading-tight text-foreground capitalize line-clamp-2 break-words overflow-hidden">
                            {job.title || "Job Title Not Available"}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1 min-w-0 flex-shrink-0 overflow-hidden">
                                <BuildingIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-sm capitalize truncate min-w-0">
                                    {job.company || "Company Not Available"}
                                </span>
                            </div>
                            {job.location && (
                                <>
                                    <span className="text-muted-foreground/50 flex-shrink-0">
                                        •
                                    </span>
                                    <div className="flex items-center gap-1 min-w-0 flex-shrink overflow-hidden">
                                        <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="text-sm capitalize truncate min-w-0">
                                            {job.location}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {job.link && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-7 px-2 text-xs whitespace-nowrap"
                            >
                                <Link
                                    href={job.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                >
                                    <ExternalLinkIcon className="w-3 h-3" />
                                    View Listing
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
