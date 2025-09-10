import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { savedJobs, jobs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Save a job for the user
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { jobId, notes, status = "interested" } = await req.json();

        if (!jobId) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 }
            );
        }

        // Check if job exists
        const [jobExists] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, jobId))
            .limit(1);

        if (!jobExists) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        // Check if already saved
        const [existingSave] = await db
            .select()
            .from(savedJobs)
            .where(
                and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId))
            )
            .limit(1);

        if (existingSave) {
            return NextResponse.json(
                { error: "Job already saved" },
                { status: 409 }
            );
        }

        // Save the job
        const [savedJob] = await db
            .insert(savedJobs)
            .values({
                userId,
                jobId,
                notes,
                status,
            })
            .returning();

        return NextResponse.json({ savedJob });
    } catch (error) {
        console.error("Error saving job:", error);
        return NextResponse.json(
            { error: "Failed to save job" },
            { status: 500 }
        );
    }
}

// Get user's saved jobs
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userSavedJobs = await db
            .select({
                id: savedJobs.id,
                jobId: savedJobs.jobId,
                notes: savedJobs.notes,
                status: savedJobs.status,
                createdAt: savedJobs.createdAt,
                updatedAt: savedJobs.updatedAt,
                // Job details
                job: {
                    id: jobs.id,
                    link: jobs.link,
                    title: jobs.title,
                    location: jobs.location,
                    company: jobs.company,
                    description: jobs.description,
                    industry: jobs.industry,
                    postedAt: jobs.postedAt,
                    createdAt: jobs.createdAt,
                },
            })
            .from(savedJobs)
            .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
            .where(eq(savedJobs.userId, userId))
            .orderBy(desc(savedJobs.createdAt));

        return NextResponse.json({ savedJobs: userSavedJobs });
    } catch (error) {
        console.error("Error fetching saved jobs:", error);
        return NextResponse.json(
            { error: "Failed to fetch saved jobs" },
            { status: 500 }
        );
    }
}
