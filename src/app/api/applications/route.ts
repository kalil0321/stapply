import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications, jobs, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Autumn as autumn } from "autumn-js";

// Create a new application
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = await autumn.check({
        customer_id: userId,
        feature_id: "application",
    });

    if (!data?.allowed || data?.balance === 0) {
        return NextResponse.json({ error: "No credits left" }, { status: 401 });
    }

    try {
        const { jobId, jobUrl, instructions } = await req.json();

        // Validate input - either jobId or jobUrl must be provided
        if (!jobId && !jobUrl) {
            return NextResponse.json(
                { error: "Either jobId or jobUrl is required" },
                { status: 400 }
            );
        }

        let jobExists: any;
        let jobIdToUse: string;

        if (jobId) {
            // Check if job exists by ID
            const [existingJob] = await db
                .select()
                .from(jobs)
                .where(eq(jobs.id, jobId))
                .limit(1);

            if (!existingJob) {
                return NextResponse.json(
                    { error: "Job not found" },
                    { status: 404 }
                );
            }

            jobExists = existingJob;
            jobIdToUse = jobId;
        } else if (jobUrl) {
            // Validate URL format
            try {
                new URL(jobUrl);
            } catch {
                return NextResponse.json(
                    { error: "Invalid URL format" },
                    { status: 400 }
                );
            }

            // Check if a job with this URL already exists
            const [existingJob] = await db
                .select()
                .from(jobs)
                .where(eq(jobs.link, jobUrl))
                .limit(1);

            if (existingJob) {
                jobExists = existingJob;
                jobIdToUse = existingJob.id;
            } else {
                // Create a new job entry with the URL
                const [newJob] = await db
                    .insert(jobs)
                    .values({
                        link: jobUrl,
                        title: "Application - Job Details Pending",
                        company: "Company Details Pending",
                        description: "Job details will be updated shortly",
                        addedByUser: true,
                        isActive: true,
                    })
                    .returning();

                jobExists = newJob;
                jobIdToUse = newJob.id;
            }
        } else {
            // This should never happen due to the validation above, but TypeScript needs it
            return NextResponse.json(
                { error: "Either jobId or jobUrl is required" },
                { status: 400 }
            );
        }

        // Check if user has already applied to this job
        const [existingApplication] = await db
            .select()
            .from(applications)
            .where(
                and(
                    eq(applications.jobId, jobIdToUse),
                    eq(applications.userId, userId)
                )
            )
            .limit(1);

        if (existingApplication) {
            return NextResponse.json(
                { error: "You have already applied to this job" },
                { status: 409 }
            );
        }

        // Get user profile data
        const [userProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

        if (!userProfile) {
            return NextResponse.json(
                { error: "User profile not found. Please complete your profile first." },
                { status: 400 }
            );
        }

        if (!userProfile.resumeUrl) {
            return NextResponse.json(
                { error: "Resume not found. Please upload your resume first." },
                { status: 400 }
            );
        }

        // Always use local server for job applications
        const response = await fetch('http://localhost:8000/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: jobExists.link, instructions, resume_url: userProfile.resumeUrl, profile: userProfile }),
        });

        // It will return: live_url, session_id (if we use a local browser-use instance, live_url will be empty)

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to apply to job through local server" },
                { status: 500 }
            );
        }

        const data = await response.json();

        // Store the application in the database
        const [newApplication] = await db
            .insert(applications)
            .values({
                userId,
                jobId: jobIdToUse,
                sessionId: data.session_id,
                liveUrl: data.live_url,
            })
            .returning();

        await autumn.track({
            customer_id: userId,
            feature_id: "application",
            value: 1,
        });

        return NextResponse.json({
            application: {
                id: newApplication.id,
                userId: newApplication.userId,
                jobId: newApplication.jobId,
                sessionId: newApplication.sessionId,
                createdAt: newApplication.createdAt,
                updatedAt: newApplication.updatedAt,
                job: {
                    id: jobExists.id,
                    link: jobExists.link,
                    title: jobExists.title,
                    location: jobExists.location,
                    company: jobExists.company,
                    description: jobExists.description,
                    employment_type: jobExists.employmentType,
                    industry: jobExists.industry,
                    posted_at: jobExists.postedAt,
                    created_at: jobExists.createdAt,
                },
            },
            live_url: data.live_url,
            session_id: data.session_id,
            message: jobUrl && !jobId ? "Application created! Job details will be updated shortly." : "Application created successfully!"
        });

        after(async () => {
            // TODO: update the job details
        });
    } catch (error) {
        console.error("Error creating application:", error);
        return NextResponse.json(
            { error: "Failed to create application" },
            { status: 500 }
        );
    }
}

// Get user's applications
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userApplications = await db
            .select({
                id: applications.id,
                userId: applications.userId,
                jobId: applications.jobId,
                sessionId: applications.sessionId,
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
            .where(eq(applications.userId, userId));

        return NextResponse.json({ applications: userApplications });
    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        );
    }
}
