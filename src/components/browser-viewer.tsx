"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    AlertCircle,
    ExternalLink,
    RefreshCw,
    SquareIcon
} from "lucide-react";

interface BrowserViewerProps {
    taskId: string;
    liveUrl?: string;
    fallbackUrl?: string;
    replayUrl?: string;
    onStop?: () => void;
    isStopping?: boolean;
}

/**
 * BrowserViewer - Direct WebSocket/SSE connection to Flask server
 * Displays browser automation in real-time using Server-Sent Events
 */
export function BrowserViewer({
    taskId,
    liveUrl,
    fallbackUrl,
    replayUrl,
    onStop,
    isStopping = false
}: BrowserViewerProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentFrame, setCurrentFrame] = useState<string | null>(null);
    const [frameCount, setFrameCount] = useState(0);
    const [waitingForFirstFrame, setWaitingForFirstFrame] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const frameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!taskId) {
            setError("Task ID is required");
            setIsLoading(false);
            return;
        }

        // Check if browser is ready first
        const checkBrowserReady = async () => {
            try {
                const response = await fetch(`/api/proxy/task-ready/${taskId}`);
                const data = await response.json();

                if (data.ready) {
                    startLiveStream();
                } else {
                    // Poll until ready (check every 1 second for faster response)
                    const checkInterval = setInterval(async () => {
                        const checkResponse = await fetch(`/api/proxy/task-ready/${taskId}`);
                        const checkData = await checkResponse.json();

                        if (checkData.ready) {
                            clearInterval(checkInterval);
                            startLiveStream();
                        }
                    }, 1000);

                    // Timeout after 30 seconds (reduced from 60)
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        if (!isConnected) {
                            setError("Browser took too long to start. Please try again.");
                            setIsLoading(false);
                        }
                    }, 30000);
                }
            } catch (err) {
                console.error("Error checking browser readiness:", err);
                // Try to start stream anyway
                startLiveStream();
            }
        };

        const startLiveStream = () => {
            try {
                // Clear any existing timeout
                if (frameTimeoutRef.current) {
                    clearTimeout(frameTimeoutRef.current);
                    frameTimeoutRef.current = null;
                }

                setIsLoading(true);
                setError(null);
                setWaitingForFirstFrame(false);

                // Use proxy endpoint to avoid CORS issues
                const eventSource = new EventSource(`/api/proxy/live-stream/${taskId}`);
                eventSourceRef.current = eventSource;

                eventSource.onopen = () => {
                    console.log("✅ Connected to live stream");
                    setIsConnected(true);
                    setIsLoading(false);
                    setWaitingForFirstFrame(true);

                    // Set timeout for waiting for first frame (30 seconds)
                    frameTimeoutRef.current = setTimeout(() => {
                        setWaitingForFirstFrame((prev) => {
                            if (prev) {
                                setError("No frames received yet. The browser automation may still be initializing.");
                                return false;
                            }
                            return prev;
                        });
                    }, 30000);
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.type === "frame" && data.data) {
                            // Clear timeout when first frame arrives
                            if (frameTimeoutRef.current) {
                                clearTimeout(frameTimeoutRef.current);
                                frameTimeoutRef.current = null;
                            }
                            setWaitingForFirstFrame(false);
                            // Update frame image
                            setCurrentFrame(`data:image/png;base64,${data.data}`);
                            setFrameCount(data.frame_number || frameCount + 1);
                        } else if (data.type === "error") {
                            setError(data.message || "Stream error occurred");
                            setIsConnected(false);
                        } else if (data.type === "status") {
                            console.log("Stream status:", data.message);
                        } else if (data.type === "keepalive") {
                            // Keep connection alive
                            console.log("Keepalive received");
                        }
                    } catch (parseError) {
                        console.error("Error parsing SSE data:", parseError);
                    }
                };

                eventSource.onerror = (err) => {
                    console.error("EventSource error:", err);
                    setError("Connection lost. Trying to reconnect...");
                    setIsConnected(false);

                    // Close and try to reconnect after a delay
                    eventSource.close();
                    setTimeout(() => {
                        if (eventSourceRef.current) {
                            checkBrowserReady();
                        }
                    }, 3000);
                };
            } catch (err) {
                console.error("Error starting live stream:", err);
                setError("Failed to start live stream");
                setIsLoading(false);
            }
        };

        checkBrowserReady();

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (frameTimeoutRef.current) {
                clearTimeout(frameTimeoutRef.current);
                frameTimeoutRef.current = null;
            }
        };
    }, [taskId, isConnected]);

    const handleReconnect = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        if (frameTimeoutRef.current) {
            clearTimeout(frameTimeoutRef.current);
            frameTimeoutRef.current = null;
        }
        setIsConnected(false);
        setIsLoading(true);
        setError(null);
        setCurrentFrame(null);
        setFrameCount(0);
        setWaitingForFirstFrame(false);

        // Trigger reconnection
        const checkBrowserReady = async () => {
            try {
                const response = await fetch(`/api/proxy/task-ready/${taskId}`);
                const data = await response.json();

                if (data.ready) {
                    const eventSource = new EventSource(`/api/proxy/live-stream/${taskId}`);
                    eventSourceRef.current = eventSource;

                    eventSource.onopen = () => {
                        setIsConnected(true);
                        setIsLoading(false);
                    };

                    eventSource.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === "frame" && data.data) {
                                setCurrentFrame(`data:image/png;base64,${data.data}`);
                                setFrameCount(data.frame_number || frameCount + 1);
                            }
                        } catch (err) {
                            console.error("Error parsing SSE data:", err);
                        }
                    };
                }
            } catch (err) {
                setError("Failed to reconnect");
                setIsLoading(false);
            }
        };

        checkBrowserReady();
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/20">
                <Card className="p-10 text-center max-w-lg border-2 shadow-xl bg-card/95 backdrop-blur-sm">
                    <div className="relative mb-6">
                        <Loader2 className="h-20 w-20 animate-spin text-primary mx-auto" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Connecting to Browser</h3>
                        <p className="text-muted-foreground text-lg">
                            Waiting for browser automation to start...
                        </p>
                        <Badge variant="secondary" className="animate-pulse">
                            <div className="w-2 h-2 rounded-full mr-2 bg-muted-foreground animate-ping" />
                            Initializing
                        </Badge>
                    </div>
                </Card>
            </div>
        );
    }

    if (error && !isConnected) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-destructive/5">
                <Card className="p-10 text-center max-w-lg border-2 border-destructive/20 shadow-xl bg-card/95 backdrop-blur-sm">
                    <div className="relative mb-6">
                        <AlertCircle className="h-20 w-20 text-destructive animate-pulse mx-auto" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-destructive">Connection Error</h3>
                        <p className="text-muted-foreground text-lg">{error}</p>
                        <div className="pt-4">
                            <Button
                                onClick={handleReconnect}
                                variant="outline"
                                size="lg"
                            >
                                <RefreshCw className="h-5 w-5 mr-2" />
                                Reconnect
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold">Browser Automation</h2>
                        <Badge variant={isConnected ? "default" : "secondary"}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                            {isConnected ? "Live" : "Connecting"}
                        </Badge>
                        {frameCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                                Frame {frameCount}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {onStop && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onStop}
                                disabled={isStopping}
                            >
                                {isStopping ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Stopping...
                                    </>
                                ) : (
                                    <>
                                        <SquareIcon className="h-4 w-4 mr-2" />
                                        Stop Workflow
                                    </>
                                )}
                            </Button>
                        )}
                        {liveUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(liveUrl, "_blank")}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in New Tab
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReconnect}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 relative bg-black overflow-hidden">
                {currentFrame ? (
                    <img
                        ref={imageRef}
                        src={currentFrame}
                        alt="Browser automation view"
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "high-quality" }}
                    />
                ) : waitingForFirstFrame ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
                            <p className="text-muted-foreground">Connected. Waiting for first frame...</p>
                            <p className="text-xs text-muted-foreground/70">The browser automation is starting up</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
                            <p className="text-muted-foreground">Waiting for frames...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
