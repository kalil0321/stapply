import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { BrowserUseClient } from "browser-use-sdk";
import { db } from "@/db/drizzle";
import { liveSearches } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        console.log("Fetching live search with ID:", id, "for user:", userId);

        // Get the live search record from database
        const [liveSearchRecord] = await db
            .select()
            .from(liveSearches)
            .where(eq(liveSearches.id, id));

        console.log("Database query result:", liveSearchRecord ? "Found" : "Not found");

        if (!liveSearchRecord) {
            return NextResponse.json({
                error: `Live search task not found. ID: ${id}, User: ${userId}`
            }, { status: 404 });
        }

        // Verify ownership
        if (liveSearchRecord.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Initialize BrowserUse client to check task status
        if (!process.env.BROWSER_USE_API_KEY) {
            return NextResponse.json(
                { error: "Browser automation service is not configured" },
                { status: 500 }
            );
        }

        const browser = new BrowserUseClient({
            apiKey: process.env.BROWSER_USE_API_KEY,
        });

        let url = null;
        let output = null;
        let isSuccess = null;
        let status = null;
        let task = null;

        try {
            task = await browser.tasks.getTask(id);
            console.log("BrowserUse task:", JSON.stringify(task, null, 2));

            if (task && task.sessionId) {
                const session = await browser.sessions.getSession(task.sessionId);
                url = session?.liveUrl || session?.publicShareUrl || null;

                // Try to create public share if no URL available
                if (!url) {
                    try {
                        if (task.sessionId) {
                            const shareView = await browser.sessions.createSessionPublicShare(task.sessionId);
                            url = shareView?.shareUrl || null;
                        }
                    } catch (shareError) {
                        console.warn("Failed to create public share:", shareError);
                    }
                }
            }

            output = task?.output || null;
            isSuccess = task?.isSuccess ?? null;
            status = task?.status || null;

            console.log("BrowserUse liveUrl:", JSON.stringify(url, null, 2));

        } catch (browserError: any) {
            console.error("BrowserUse API error:", browserError);

            if (browserError.statusCode === 404) {
                return NextResponse.json(
                    { error: "Search task not found. It may have been deleted or expired." },
                    { status: 404 }
                );
            }

            if (browserError.statusCode === 403) {
                return NextResponse.json(
                    { error: "Access denied to this search task." },
                    { status: 403 }
                );
            }

            // Don't fail the entire request if BrowserUse API fails
            // Just return the database data without browser session info
        }

        const responseData = {
            liveSearch: liveSearchRecord,
            results: output,
            url,
            isSuccess,
            status,
            query: liveSearchRecord.query,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Live search task API error:", error);

        // Handle specific error types
        if (error && typeof error === 'object' && 'statusCode' in error) {
            const apiError = error as any;

            switch (apiError.statusCode) {
                case 404:
                    return NextResponse.json(
                        { error: "Search task not found. It may have been deleted or expired." },
                        { status: 404 }
                    );
                case 403:
                    return NextResponse.json(
                        { error: "Access denied to this search task." },
                        { status: 403 }
                    );
                case 429:
                    return NextResponse.json(
                        { error: "Too many requests. Please wait a moment and try again." },
                        { status: 429 }
                    );
                case 500:
                    return NextResponse.json(
                        { error: "Browser automation service is temporarily unavailable. Please try again later." },
                        { status: 500 }
                    );
                default:
                    return NextResponse.json(
                        { error: `Service error: ${apiError.statusCode}. Please try again.` },
                        { status: apiError.statusCode }
                    );
            }
        }

        return NextResponse.json(
            { error: "Failed to retrieve search task. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        console.log("Stopping live search with ID:", id, "for user:", userId);

        // Get the live search record from database to verify ownership
        const [liveSearchRecord] = await db
            .select()
            .from(liveSearches)
            .where(eq(liveSearches.id, id));

        if (!liveSearchRecord) {
            return NextResponse.json({
                error: `Live search task not found. ID: ${id}, User: ${userId}`
            }, { status: 404 });
        }

        // Verify ownership
        if (liveSearchRecord.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Initialize BrowserUse client to stop task
        if (!process.env.BROWSER_USE_API_KEY) {
            return NextResponse.json(
                { error: "Browser automation service is not configured" },
                { status: 500 }
            );
        }

        const browser = new BrowserUseClient({
            apiKey: process.env.BROWSER_USE_API_KEY,
        });

        try {
            // Stop the task using the provided syntax
            const task = await browser.tasks.updateTask(id, {
                action: "stop_task_and_session",
            });

            console.log("Task stopped successfully:", JSON.stringify(task, null, 2));

            // Update the database record to reflect the stopped status
            await db
                .update(liveSearches)
                .set({
                    status: 'stopped',
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(liveSearches.id, id));

            return NextResponse.json({
                message: "Task stopped successfully",
                taskId: id,
                status: task?.status || 'stopped'
            });

        } catch (browserError: any) {
            console.error("BrowserUse API error when stopping task:", browserError);

            if (browserError.statusCode === 404) {
                return NextResponse.json(
                    { error: "Task not found or already completed" },
                    { status: 404 }
                );
            }

            if (browserError.statusCode === 403) {
                return NextResponse.json(
                    { error: "Access denied to this task" },
                    { status: 403 }
                );
            }

            return NextResponse.json(
                { error: "Failed to stop task. It may have already completed." },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Stop live search task API error:", error);

        return NextResponse.json(
            { error: "Failed to stop search task. Please try again." },
            { status: 500 }
        );
    }
}

