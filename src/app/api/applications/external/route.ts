import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications, jobs, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BrowserUseClient } from "browser-use-sdk";

// Create an application from a job URL
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { jobUrl } = await req.json();

        if (!jobUrl) {
            return NextResponse.json(
                { error: "Job URL is required" },
                { status: 400 }
            );
        }

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
        let existingJob = await db
            .select()
            .from(jobs)
            .where(eq(jobs.link, jobUrl))
            .limit(1);

        let jobId: string;

        if (existingJob.length > 0) {
            jobId = existingJob[0].id;
        } else {
            // If job doesn't exist, we need to create it
            // For now, we'll create a basic job entry with the URL
            // You might want to integrate with a web scraping service to get job details
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

            jobId = newJob.id;

            // TODO: You might want to queue a job here to scrape the URL and update the job details
            // For example, using a background job service or webhook
        }

        // Check if user has already applied to this job
        const [existingApplication] = await db
            .select()
            .from(applications)
            .where(
                and(
                    eq(applications.jobId, jobId),
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

        // Generate a task ID for tracking
        if (!process.env.BROWSER_USE_API_KEY) {
            return NextResponse.json(
                { error: "Browser automation service is not configured" },
                { status: 500 }
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

        const browser = new BrowserUseClient({
            apiKey: process.env.BROWSER_USE_API_KEY,
        });

        const session = await browser.sessions.createSession();

        // Download resume file from URL
        const resumeResponse = await fetch(userProfile.resumeUrl);
        if (!resumeResponse.ok) {
            return NextResponse.json(
                { error: "Failed to download resume file" },
                { status: 500 }
            );
        }

        const resumeBuffer = await resumeResponse.arrayBuffer();
        const resumeFileName = `resume_${userId}.pdf`;

        // Get presigned URL for file upload to BrowserUse
        const fileUploadUrl = await browser.files.userUploadFilePresignedUrl(
            session.id,
            {
                fileName: resumeFileName,
                contentType: 'application/pdf',
                sizeBytes: resumeBuffer.byteLength
            }
        );

        // Upload the resume file to BrowserUse using form data
        const formData = new FormData();

        // Add all the form fields from the presigned URL response
        Object.entries(fileUploadUrl.fields).forEach(([key, value]) => {
            formData.append(key, value);
        });

        // Add the file itself
        formData.append('file', new Blob([resumeBuffer], { type: 'application/pdf' }), resumeFileName);

        const uploadResponse = await fetch(fileUploadUrl.url, {
            method: fileUploadUrl.method,
            body: formData,
        });

        if (!uploadResponse.ok) {
            return NextResponse.json(
                { error: "Failed to upload resume to automation service" },
                { status: 500 }
            );
        }

        //TODO: add language, add experience, add education
        // length of internship should be 3 to 6 months on average
        let task;
        try {
            task = await browser.tasks.createTask({
                startUrl: jobUrl,
                task: `You are a helpful assistant that can help me apply to jobs.

Please go to the following url: ${jobUrl} and apply to the job.

Here are the infos about the user:
Name: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
Email: ${userProfile.email || ''}
Phone: ${userProfile.phone || ''}
Location: ${userProfile.location || ''}
Nationality: ${userProfile.nationality || ''}
Gender: ${userProfile.gender || ''}
LinkedIn: ${userProfile.linkedinUrl || ''}
Website: ${userProfile.websiteUrl || ''}
GitHub: ${userProfile.githubUrl || ''}
Summary: ${userProfile.summary || ''}
Skills: ${userProfile.skills ? userProfile.skills.join(', ') : ''}
The resume file name is ${fileUploadUrl.fileName}, upload it when prompted.

Instructions:
1. Navigate to the job posting URL
2. Look for an "Apply" button or similar application mechanism
3. Fill out the application form using the provided user information
4. Upload the resume file when prompted
5. Submit the application if possible
6. Report back on the status of the application

Please use the provided user information to fill in any application forms automatically.`,
                maxSteps: 50,
                highlightElements: true,
                vision: true,
                sessionId: session.id,
            });
        } catch (error) {
            console.error("Error creating browser automation task:", error);
            return NextResponse.json(
                { error: "Failed to create automation task" },
                { status: 500 }
            );
        }

        const taskId = task.id;

        // Create the application
        const [newApplication] = await db
            .insert(applications)
            .values({
                userId,
                jobId,
                taskId,
            })
            .returning();

        // Return the created application with job details
        const [applicationWithJob] = await db
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
            .where(eq(applications.id, newApplication.id))
            .limit(1);

        return NextResponse.json({
            application: applicationWithJob,
            message:
                existingJob.length > 0
                    ? "Application created successfully!"
                    : "Application created! Job details will be updated shortly.",
        });
    } catch (error) {
        console.error("Error creating application from URL:", error);
        return NextResponse.json(
            { error: "Failed to create application" },
            { status: 500 }
        );
    }
}
