import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

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
                sessionId: applications.sessionId,
                status: applications.status,
                replayUrl: applications.replayUrl,
                liveUrl: applications.liveUrl,
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

        return NextResponse.json({
            application,
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
