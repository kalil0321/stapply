import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BrowserUseClient } from "browser-use-sdk";

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

        try {
            const apiKey = process.env.BROWSER_USE_API_KEY;
            if (!apiKey) {
                throw new Error("BROWSER_USE_API_KEY not configured");
            }
            
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
        } catch (browserError) {
            console.error("BrowserUse API error:", browserError);
            // Don't fail the entire request if BrowserUse API fails
            // Just return the application data without browser session info
        }

        return NextResponse.json({ 
            application, 
            url, 
            output, 
            isSuccess, 
            status 
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
            const apiKey = process.env.BROWSER_USE_API_KEY;
            if (apiKey && existingApplication.taskId) {
                const browser = new BrowserUseClient({
                    apiKey: apiKey,
                });

                // Try to get the task to check its status
                const task = await browser.tasks.getTask(existingApplication.taskId);
                console.log("Task status before deletion:", task?.status);
                
                // If task is still running, we could potentially cancel it
                // Note: BrowserUse SDK might not have a cancel method, but we log it for now
                if (task && ['pending', 'in_progress'].includes(task.status)) {
                    console.log("Task is still running, but continuing with deletion");
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
