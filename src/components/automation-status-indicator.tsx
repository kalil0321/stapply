"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface AutomationStatusIndicatorProps {
    status: string;
    message?: string;
    className?: string;
}

export function AutomationStatusIndicator({ 
    status, 
    message, 
    className = "" 
}: AutomationStatusIndicatorProps) {
    const getStatusInfo = () => {
        switch (status.toLowerCase()) {
            case "ready":
                return {
                    icon: CheckCircle,
                    variant: "default" as const,
                    color: "text-green-500",
                    label: "Ready"
                };
            case "starting":
            case "pending":
            case "initializing":
                return {
                    icon: Loader2,
                    variant: "secondary" as const,
                    color: "text-blue-500",
                    label: "Starting",
                    animate: true
                };
            case "running":
            case "in_progress":
                return {
                    icon: Loader2,
                    variant: "default" as const,
                    color: "text-green-500",
                    label: "Running",
                    animate: true
                };
            case "completed":
            case "finished":
                return {
                    icon: CheckCircle,
                    variant: "outline" as const,
                    color: "text-green-500",
                    label: "Completed"
                };
            case "failed":
            case "error":
                return {
                    icon: AlertCircle,
                    variant: "destructive" as const,
                    color: "text-red-500",
                    label: "Failed"
                };
            case "connecting":
            case "not_accessible":
                return {
                    icon: Clock,
                    variant: "secondary" as const,
                    color: "text-yellow-500",
                    label: "Connecting"
                };
            default:
                return {
                    icon: Clock,
                    variant: "secondary" as const,
                    color: "text-gray-500",
                    label: status
                };
        }
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;

    return (
        <Badge variant={statusInfo.variant} className={`flex items-center gap-2 ${className}`}>
            <Icon 
                className={`h-3 w-3 ${statusInfo.color} ${statusInfo.animate ? 'animate-spin' : ''}`} 
            />
            {statusInfo.label}
            {message && (
                <span className="text-xs opacity-75">
                    • {message}
                </span>
            )}
        </Badge>
    );
}
