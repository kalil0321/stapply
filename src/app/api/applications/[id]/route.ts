import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        console.log("Fetching application with ID:", id, "for user:", userId);

        // Fetch the application with job details
        const [application] = await db
            .select({
                id: applications.id,
                userId: applications.userId,
                jobId: applications.jobId,
                taskId: applications.taskId,
                createdAt: applications.createdAt,
                updatedAt: applications.updatedAt,
                job: {
                    id: jobs.id,
                    link: jobs.link,
                    title: jobs.title,
                    location: jobs.location,
                    company: jobs.company,
                    description: jobs.description,
                    employment_type: jobs.employmentType,
                    industry: jobs.industry,
                    posted_at: jobs.postedAt,
                    created_at: jobs.createdAt,
                },
            })
            .from(applications)
            .innerJoin(jobs, eq(applications.jobId, jobs.id))
            .where(eq(applications.id, id))
            .limit(1);

        console.log("Database query result:", application ? "Found" : "Not found");

        if (!application) {
            // Let's also try to find the application without the job join to see if that's the issue
            const [appOnly] = await db
                .select()
                .from(applications)
                .where(eq(applications.id, id))
                .limit(1);

            console.log("Application exists without job join:", appOnly ? "Yes" : "No");

            return NextResponse.json(
                { error: `Application not found. ID: ${id}, User: ${userId}` },
                { status: 404 }
            );
        }

        // Check if the user owns this application
        if (application.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let url = null;
        let output = null;
        let isSuccess = null;
        let status = null;
        let liveUrl = null;
        let fallbackUrl = null;
        let replayUrl = null;

        try {
            // Try local Flask server first
            const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:3001";

            // Check if task exists in Flask server
            const taskStatusResponse = await fetch(`${FLASK_SERVER_URL}/api/task-ready/${application.taskId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (taskStatusResponse.ok) {
                // Task exists in local Flask server
                const taskStatus = await taskStatusResponse.json();
                status = taskStatus.status || (taskStatus.ready ? "running" : "starting");

                // Get task status from Flask server
                const taskStatusEndpoint = await fetch(`${FLASK_SERVER_URL}/task-status/${application.taskId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (taskStatusEndpoint.ok) {
                    const taskData = await taskStatusEndpoint.json();
                    output = taskData.result || taskData.message || null;
                    isSuccess = taskData.status === "completed" ? true : (taskData.status === "failed" ? false : null);
                    status = taskData.status || status;
                }

                // Generate URLs for local Flask server viewer
                liveUrl = `${FLASK_SERVER_URL}/live-stream/${application.taskId}`;
                fallbackUrl = `${FLASK_SERVER_URL}/screencast/${application.taskId}`;
                replayUrl = `${FLASK_SERVER_URL}/replay/${application.taskId}`;

                console.log("Local Flask server task found:", application.taskId);
            } else {
                // Fallback to BrowserUse API if configured (for backward compatibility)
                const apiKey = process.env.BROWSER_USE_API_KEY;
                if (apiKey) {
                    try {
                        const { BrowserUseClient } = await import("browser-use-sdk");
                        const browser = new BrowserUseClient({
                            apiKey: apiKey,
                        });

                        const task = await browser.tasks.getTask(application.taskId);
                        console.log("BrowserUse task:", JSON.stringify(task, null, 2));

                        if (task && task.sessionId) {
                            const session = await browser.sessions.getSession(task.sessionId);
                            url = session?.liveUrl || session?.publicShareUrl || null;
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
                    } catch (importError) {
                        console.warn("BrowserUse SDK not available:", importError);
                    }
                }
            }
        } catch (browserError) {
            console.error("Browser automation API error:", browserError);
            // Don't fail the entire request if browser API fails
            // Just return the application data without browser session info
        }

        return NextResponse.json({
            application,
            url,
            output,
            isSuccess,
            status,
            liveUrl,
            fallbackUrl,
            replayUrl,
            taskId: application.taskId
        });
    } catch (error) {
        console.error("Error fetching application:", error);
        return NextResponse.json(
            { error: "Failed to fetch application" },
            { status: 500 }
        );
    }
}

// Delete an application
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        console.log("Deleting application with ID:", id, "for user:", userId);

        // First, verify the application exists and belongs to the user
        const [existingApplication] = await db
            .select()
            .from(applications)
            .where(eq(applications.id, id))
            .limit(1);

        if (!existingApplication) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        // Check if the user owns this application
        if (existingApplication.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Optional: Cancel the browser automation task if it's still running
        try {
            // Try local Flask server first
            const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:3001";
            if (existingApplication.taskId) {
                // Check if task exists in Flask server and could be stopped
                // Note: Flask server doesn't have a stop endpoint yet, but we log it
                console.log("Task ID for deletion:", existingApplication.taskId);

                // Fallback to BrowserUse API if configured
                const apiKey = process.env.BROWSER_USE_API_KEY;
                if (apiKey) {
                    try {
                        const { BrowserUseClient } = await import("browser-use-sdk");
                        const browser = new BrowserUseClient({
                            apiKey: apiKey,
                        });

                        const task = await browser.tasks.getTask(existingApplication.taskId);
                        console.log("Task status before deletion:", task?.status);

                        if (task && ['pending', 'in_progress'].includes(task.status)) {
                            console.log("Task is still running, but continuing with deletion");
                        }
                    } catch (importError) {
                        console.warn("BrowserUse SDK not available:", importError);
                    }
                }
            }
        } catch (browserError) {
            console.warn("Failed to check/cancel browser task:", browserError);
            // Don't fail the deletion if browser API fails
        }

        // Delete the application from the database
        await db
            .delete(applications)
            .where(eq(applications.id, id));

        console.log("Application deleted successfully:", id);

        return NextResponse.json({
            message: "Application deleted successfully",
            id: id
        });
    } catch (error) {
        console.error("Error deleting application:", error);
        return NextResponse.json(
            { error: "Failed to delete application" },
            { status: 500 }
        );
    }
}
