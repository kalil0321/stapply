"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutomationStatusIndicator } from "@/components/automation-status-indicator";
import { 
    Play, 
    Pause, 
    RotateCcw, 
    ExternalLink, 
    Loader2, 
    AlertCircle,
    Eye,
    Camera,
    Film,
    CheckCircle,
    Zap
} from "lucide-react";

interface LiveAutomationViewerProps {
    liveUrl: string;
    fallbackUrl: string;
    replayUrl: string;
    taskId: string;
}

type ViewMode = "live" | "fallback" | "replay";

interface TaskStatus {
    ready: boolean;
    status: string;
    message: string;
    tabs_count?: number;
}

/**
 * LiveAutomationViewer - Advanced browser automation viewer with multiple modes
 * 
 * Features:
 * - Real-time live streaming
 * - Screenshot fallback mode
 * - Replay mode with saved screenshots
 * - Smart browser readiness detection
 * - Automatic screenshot availability checking
 */
export function LiveAutomationViewer({ 
    liveUrl, 
    fallbackUrl, 
    replayUrl, 
    taskId 
}: LiveAutomationViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("live");
    const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExtendedLoading, setIsExtendedLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hasScreenshots, setHasScreenshots] = useState(false);

    // Check task readiness
    const checkTaskStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/proxy/task-ready/${taskId}`);
            const data = await response.json();
            setTaskStatus(data);
            
            if (data.ready && !isExtendedLoading) {
                // Start extended loading phase
                setIsExtendedLoading(true);
                setLoadingProgress(0);
                setError(null);
                
                // Animate progress over 3 seconds
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 2; // Increment by 2% every 60ms (3 seconds total)
                    setLoadingProgress(progress);
                    
                    if (progress >= 100) {
                        clearInterval(progressInterval);
                        setTimeout(() => {
                            setIsLoading(false);
                        }, 200); // Small delay for smooth transition
                    }
                }, 60);
            }
        } catch (err) {
            console.error("Error checking task status:", err);
            setError("Failed to check browser status");
        }
    }, [taskId, isExtendedLoading]);

    // Check for available screenshots
    const checkScreenshots = useCallback(async () => {
        try {
            const response = await fetch(`/api/proxy/task-screenshots/${taskId}`);
            const data = await response.json();
            setHasScreenshots(data.screenshots && data.screenshots.length > 0);
        } catch (err) {
            console.error("Error checking screenshots:", err);
        }
    }, [taskId]);

    // Poll for status updates
    useEffect(() => {
        checkTaskStatus();
        checkScreenshots();

        const interval = setInterval(() => {
            if (!taskStatus?.ready) {
                checkTaskStatus();
            }
            checkScreenshots();
        }, 3000);

        return () => clearInterval(interval);
    }, [checkTaskStatus, checkScreenshots, taskStatus?.ready]);

    const getCurrentUrl = () => {
        switch (viewMode) {
            case "live":
                return liveUrl;
            case "fallback":
                return fallbackUrl;
            case "replay":
                return replayUrl;
            default:
                return liveUrl;
        }
    };

    const getViewModeInfo = (mode: ViewMode) => {
        switch (mode) {
            case "live":
                return {
                    label: "Live Stream",
                    icon: Eye,
                    description: "Real-time browser automation",
                    color: "bg-green-500"
                };
            case "fallback":
                return {
                    label: "Screenshots",
                    icon: Camera,
                    description: "Screenshot-based fallback",
                    color: "bg-blue-500"
                };
            case "replay":
                return {
                    label: "Replay",
                    icon: Film,
                    description: "View saved automation",
                    color: "bg-orange-500"
                };
        }
    };

    if (isLoading) {
        const isTaskReady = taskStatus?.ready;
        const showProgress = isExtendedLoading && isTaskReady;
        
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/20">
                <Card className="p-10 text-center max-w-lg border-2 shadow-xl bg-card/95 backdrop-blur-sm">
                    <div className="relative mb-6">
                        {/* Animated loading rings */}
                        <div className="relative w-20 h-20 mx-auto">
                            {showProgress ? (
                                <div className="relative">
                                    <CheckCircle className="h-20 w-20 text-green-500 animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap className="h-8 w-8 text-green-400 animate-bounce" />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Loader2 className="h-20 w-20 animate-spin text-primary" />
                                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
                                    <div className="absolute inset-2 border-2 border-primary/40 rounded-full animate-ping" />
                                </div>
                            )}
                        </div>
                        
                        {/* Floating particles animation */}
                        <div className="absolute -top-4 -left-4 w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="absolute -top-2 -right-6 w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
                        <div className="absolute -bottom-3 -left-6 w-1 h-1 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '1.2s' }} />
                        <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {showProgress ? "Finalizing Setup" : "Starting Browser Automation"}
                        </h3>
                        
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            {showProgress 
                                ? "Preparing your automation environment..." 
                                : (taskStatus?.message || "Initializing browser and setting up automation tools...")
                            }
                        </p>
                        
                        {/* Progress bar for extended loading */}
                        {showProgress && (
                            <div className="space-y-3">
                                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-out rounded-full relative"
                                        style={{ width: `${loadingProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {loadingProgress}% Complete
                                </p>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-center gap-2">
                            <Badge 
                                variant={isTaskReady ? "default" : "secondary"} 
                                className={`transition-all duration-300 ${isTaskReady ? 'bg-green-500 hover:bg-green-600' : ''}`}
                            >
                                <div className={`w-2 h-2 rounded-full mr-2 ${isTaskReady ? 'bg-green-200 animate-pulse' : 'bg-muted-foreground animate-ping'}`} />
                                Status: {isTaskReady ? "Ready" : (taskStatus?.status || "initializing")}
                            </Badge>
                            
                            {taskStatus?.tabs_count && (
                                <Badge variant="outline" className="animate-fade-in">
                                    {taskStatus.tabs_count} tabs active
                                </Badge>
                            )}
                        </div>
                        
                        {/* Loading steps indicator */}
                        <div className="flex justify-center items-center gap-2 mt-6">
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                        (showProgress && loadingProgress >= step * 25) || (!showProgress && step <= 2)
                                            ? 'bg-primary animate-pulse' 
                                            : 'bg-muted-foreground/30'
                                    }`}
                                    style={{ animationDelay: `${step * 0.2}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (error && !taskStatus?.ready) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-destructive/5">
                <Card className="p-10 text-center max-w-lg border-2 border-destructive/20 shadow-xl bg-card/95 backdrop-blur-sm">
                    <div className="relative mb-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <AlertCircle className="h-20 w-20 text-destructive animate-pulse" />
                            <div className="absolute inset-0 border-4 border-destructive/20 rounded-full animate-pulse" />
                        </div>
                        
                        {/* Error particles */}
                        <div className="absolute -top-4 -left-4 w-2 h-2 bg-destructive/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <div className="absolute -top-2 -right-6 w-1.5 h-1.5 bg-destructive/40 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }} />
                        <div className="absolute -bottom-3 -left-6 w-1 h-1 bg-destructive/30 rounded-full animate-bounce" style={{ animationDelay: '1.1s' }} />
                        <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-destructive/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-destructive">Connection Error</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">{error}</p>
                        
                        <div className="pt-4">
                            <Button 
                                onClick={checkTaskStatus} 
                                variant="outline" 
                                size="lg"
                                className="border-2 hover:border-primary transition-all duration-300"
                            >
                                <RotateCcw className="h-5 w-5 mr-2" />
                                Try Again
                            </Button>
                        </div>
                        
                        <Badge variant="destructive" className="animate-pulse">
                            <div className="w-2 h-2 rounded-full mr-2 bg-destructive-foreground animate-ping" />
                            Connection Failed
                        </Badge>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold">Browser Automation</h2>
                        <AutomationStatusIndicator 
                            status={taskStatus?.ready ? "ready" : taskStatus?.status || "starting"}
                            message={taskStatus?.ready ? undefined : taskStatus?.message}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Buttons */}
                        {(["live", "fallback", "replay"] as ViewMode[]).map((mode) => {
                            const info = getViewModeInfo(mode);
                            const Icon = info.icon;
                            const isDisabled = mode === "replay" && !hasScreenshots;
                            
                            return (
                                <Button
                                    key={mode}
                                    variant={viewMode === mode ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode(mode)}
                                    disabled={isDisabled}
                                    className="flex items-center gap-2"
                                >
                                    <Icon className="h-4 w-4" />
                                    {info.label}
                                </Button>
                            );
                        })}

                        {/* External Link */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getCurrentUrl(), "_blank")}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Current View Info */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${getViewModeInfo(viewMode).color}`} />
                        {getViewModeInfo(viewMode).description}
                        {viewMode === "replay" && hasScreenshots && (
                            <Badge variant="secondary" className="ml-2">
                                Screenshots Available
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 relative">
                <iframe 
                    src={getCurrentUrl()} 
                    className="w-full h-full border-0"
                    title={`Browser Automation - ${getViewModeInfo(viewMode).label}`}
                />
            </div>
        </div>
    );
}
