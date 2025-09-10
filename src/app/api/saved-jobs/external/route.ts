import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { savedJobs, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BrowserUseClient } from "browser-use-sdk";
import { z } from "zod";

interface JobData {
    title: string;
    company: string;
    location?: string;
    link: string;
    description?: string;
    employmentType?: string;
}

// Job data schema for validation
const JobDataSchema = z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    location: z.string().optional(),
    description: z.string().optional(),
});

// Extract job info using browser-use for robust parsing
async function extractJobDataWithBrowserUse(jobLink: string): Promise<JobData> {

    try {
        console.log("Extracting job data using browser-use for:", jobLink);

        const browser = new BrowserUseClient({
            apiKey: process.env.BROWSER_USE_API_KEY!,
        });

        const task = await browser.tasks.createTask({
            task: `Visit this job posting URL and extract the job information: ${jobLink}. Please extract the job title, company name, location, job description, employment type (full-time, part-time, contract, etc.), salary range if available, and key requirements. Be accurate and thorough.`,
            schema: JobDataSchema,
            flashMode: true,
            llm: "gemini-2.5-flash",
        });

        console.log("Browser-use task created:", task.id);

        // Poll for completion (with timeout)
        await task.complete();

        const result = await task.complete();
        const jobData = { link: jobLink, ...result.parsed } as JobData;

        return jobData;

    } catch (error) {
        console.error("Error with browser-use extraction:", error);
        throw error;
    }
}

// Process a single job and save to database
async function processJob(jobData: JobData, userId: string) {
    try {
        // Check if job with same link already exists
        const [existingJob] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.link, jobData.link))
            .limit(1);

        let jobId: string;

        if (existingJob) {
            jobId = existingJob.id;
        } else {
            // Create new job
            const [newJob] = await db
                .insert(jobs)
                .values({
                    title: jobData.title,
                    company: jobData.company,
                    location: jobData.location || null,
                    link: jobData.link,
                    description: jobData.description || null,
                    employmentType: jobData.employmentType || null,
                    addedByUser: true,
                    source: "external",
                })
                .returning();

            jobId = newJob.id;
            console.log("New job created:", jobId);
        }

        // Check if user already saved this job
        const [existingSavedJob] = await db
            .select()
            .from(savedJobs)
            .where(
                and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId))
            )
            .limit(1);

        if (existingSavedJob) {
            console.log("Job already saved by user");
            return NextResponse.json(
                { error: "Job already saved" },
                { status: 409 }
            );
        }

        // Save the job for the user
        const [savedJob] = await db
            .insert(savedJobs)
            .values({
                userId,
                jobId,
                notes: null,
                status: "interested",
            })
            .returning();

        return NextResponse.json({
            success: true,
            message: "Job added successfully",
            savedJob,
            jobData: {
                id: jobId,
                title: jobData.title,
                company: jobData.company,
                location: jobData.location,
                link: jobData.link,
            },
        });
    } catch (error) {
        console.error("Error processing job:", jobData, error);
        return NextResponse.json(
            { error: "Failed to add job" },
            { status: 500 }
        );
    }
}

// Add external job (individual only)
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { jobLink, mode } = body;

        if (mode !== "individual") {
            return NextResponse.json(
                { error: "Only individual mode is supported" },
                { status: 400 }
            );
        }

        if (!jobLink) {
            return NextResponse.json(
                { error: "Job link is required" },
                { status: 400 }
            );
        }

        const jobData = await extractJobDataWithBrowserUse(jobLink);
        return await processJob(jobData, userId);
    } catch (error) {
        console.error("Error adding external job:", error);
        return NextResponse.json(
            { error: "Failed to add external job" },
            { status: 500 }
        );
    }
}
