"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    RocketIcon, 
    BrainIcon, 
    MonitorIcon, 
    SearchIcon,
    ArrowRightIcon,
    InfoIcon,
    CheckCircleIcon,
    AlertTriangleIcon
} from "lucide-react";
import Link from "next/link";

export default function LocalApplicationsPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if we're in development mode
        if (process.env.NODE_ENV !== "development") {
            // Redirect to main dashboard in production
            router.replace("/");
            return;
        }
    }, [router]);

    // Don't render anything in production
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="border-b border-border p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <RocketIcon className="w-6 h-6" />
                        <h1 className="text-2xl font-semibold">Local Applications</h1>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <BrainIcon className="w-3 h-3" />
                        AI-Powered Automation
                    </Badge>
                </div>
                <p className="text-muted-foreground mt-2">
                    Use your local automation server to apply to jobs automatically using AI
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* How it Works */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <InfoIcon className="w-5 h-5" />
                                How Local Applications Work
                            </CardTitle>
                            <CardDescription>
                                Automated job applications using your local browser automation server
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="flex items-start gap-3 p-4 border rounded-lg">
                                    <div className="p-2 bg-blue-50 rounded-full">
                                        <SearchIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">1. Find a Job</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Search and find jobs you want to apply to
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 border rounded-lg">
                                    <div className="p-2 bg-green-50 rounded-full">
                                        <RocketIcon className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">2. Start Automation</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Click "Apply Locally" to start the automated process
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 border rounded-lg">
                                    <div className="p-2 bg-purple-50 rounded-full">
                                        <BrainIcon className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">3. AI Completes</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            AI fills out the application using your profile
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Requirements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangleIcon className="w-5 h-5" />
                                Requirements
                            </CardTitle>
                            <CardDescription>
                                Make sure these requirements are met before using local applications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Local Flask server running on <code className="px-1 py-0.5 bg-muted rounded text-xs">localhost:3001</code></span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Complete profile with resume uploaded</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">OpenAI API key configured for result parsing</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                            <CardDescription>
                                What makes local applications powerful
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <MonitorIcon className="w-4 h-4" />
                                        Browser Control
                                    </h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• Choose headless or visible mode</li>
                                        <li>• Adjustable automation steps</li>
                                        <li>• Real-time browser interaction</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <BrainIcon className="w-4 h-4" />
                                        AI Intelligence
                                    </h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• Smart form field detection</li>
                                        <li>• Context-aware responses</li>
                                        <li>• Custom instructions support</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Get Started */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Get Started</CardTitle>
                            <CardDescription>
                                Ready to automate your job applications?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button asChild className="flex-1">
                                    <Link href="/search">
                                        <SearchIcon className="w-4 h-4 mr-2" />
                                        Find Jobs to Apply To
                                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/profile">
                                        Check Profile Completeness
                                    </Link>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                💡 Tip: Look for the "Apply Locally" button on job listings to start the automated application process
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
