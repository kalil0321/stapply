import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications, jobs, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BrowserUseClient } from "browser-use-sdk";

// Create a new application
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { jobId, instructions } = await req.json();

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

        // Initialize browser automation
        if (!process.env.BROWSER_USE_API_KEY) {
            return NextResponse.json(
                { error: "Browser automation service is not configured" },
                { status: 500 }
            );
        }

        console.log(`[Application ${jobId}] Starting application process for user ${userId}`);

        const browser = new BrowserUseClient({
            apiKey: process.env.BROWSER_USE_API_KEY,
        });

        console.log(`[Application ${jobId}] Creating browser session...`);
        const session = await browser.sessions.createSession();
        console.log(`[Application ${jobId}] Browser session created: ${session.id}`);

        // Download resume file from URL
        console.log(`[Application ${jobId}] Downloading resume from: ${userProfile.resumeUrl}`);
        const resumeResponse = await fetch(userProfile.resumeUrl);
        if (!resumeResponse.ok) {
            console.error(`[Application ${jobId}] Failed to download resume: ${resumeResponse.status} ${resumeResponse.statusText}`);
            return NextResponse.json(
                { error: "Failed to download resume file" },
                { status: 500 }
            );
        }

        const resumeBuffer = await resumeResponse.arrayBuffer();
        const resumeFileName = `resume_${userId}.pdf`;
        console.log(`[Application ${jobId}] Resume downloaded successfully, size: ${resumeBuffer.byteLength} bytes`);

        // Get presigned URL for file upload to BrowserUse
        console.log(`[Application ${jobId}] Getting presigned URL for file upload...`);
        const fileUploadUrl = await browser.files.userUploadFilePresignedUrl(
            session.id,
            {
                fileName: resumeFileName,
                contentType: 'application/pdf',
                sizeBytes: resumeBuffer.byteLength
            }
        );
        console.log(JSON.stringify(fileUploadUrl, null, 2));
        console.log(`[Application ${jobId}] Presigned URL obtained: ${fileUploadUrl.url}`);

        // Upload the resume file to BrowserUse using form data
        console.log(`[Application ${jobId}] Preparing form data for file upload...`);
        const formData = new FormData();

        // Add all the form fields from the presigned URL response
        Object.entries(fileUploadUrl.fields).forEach(([key, value]) => {
            formData.append(key, value);
            console.log(`[Application ${jobId}] Added form field: ${key}`);
        });

        // Add the file itself
        formData.append('file', new Blob([resumeBuffer], { type: 'application/pdf' }), resumeFileName);
        console.log(`[Application ${jobId}] Added file to form data: ${resumeFileName}`);

        console.log(`[Application ${jobId}] Uploading file to BrowserUse...`);
        const uploadResponse = await fetch(fileUploadUrl.url, {
            method: fileUploadUrl.method,
            body: formData,
        });
        // console.log(JSON.stringify(uploadResponse, null, 2));

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`[Application ${jobId}] File upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
            console.error(`[Application ${jobId}] Upload error response: ${errorText}`);
            return NextResponse.json(
                { error: "Failed to upload resume to automation service" },
                { status: 500 }
            );
        }

        console.log(`[Application ${jobId}] File uploaded successfully to BrowserUse`);

        const valid_session = await browser.sessions.getSession(session.id);

        if (!valid_session) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 500 }
            );
        } else {
            console.log(`[Application ${jobId}] Valid session found: ${valid_session.id}`);
        }

        // Generate a task ID for tracking
        console.log(`[Application ${jobId}] Creating automation task...`);
        const task = await browser.tasks.createTask({
            systemPromptExtension: `You are a helpful assistant that can help me apply to jobs. If a field is not present and not required, just leave it blank. Otherwise, fill in the field with the information provided or infer the infos based on user profile.`,
            startUrl: jobExists.link,
            task: `
            Please go to ${jobExists.link} and complete the application process using this information.
            Here are the infos about the user:
            ${userProfile.firstName && userProfile.lastName ? `Name: ${userProfile.firstName || ''} ${userProfile.lastName || ''}` : ''}
            ${userProfile.email ? `Email: ${userProfile.email || ''}` : ''}
            ${userProfile.phone ? `Phone: ${userProfile.phone || ''}` : ''}
            ${userProfile.location ? `Location: ${userProfile.location || ''}` : ''}
            ${userProfile.nationality ? `Nationality: ${userProfile.nationality || ''}` : ''}
            ${userProfile.gender ? `Gender: ${userProfile.gender || ''}` : ''}
            ${userProfile.linkedinUrl ? `LinkedIn: ${userProfile.linkedinUrl || ''}` : ''}
            ${userProfile.websiteUrl ? `Website: ${userProfile.websiteUrl || ''}` : ''}
            ${userProfile.githubUrl ? `GitHub: ${userProfile.githubUrl || ''}` : ''}
            ${userProfile.summary ? `Summary: ${userProfile.summary || ''}` : ''}
            ${userProfile.skills ? `Skills: ${userProfile.skills.join(', ')}` : ''}
            ${fileUploadUrl.fileName ? `The resume file name is ${fileUploadUrl.fileName}, upload it when prompted.` : ''}

            ${instructions && instructions.length > 0 ? `Additional instructions: ${instructions}` : ''}
            
            Intership duration should be 3 to 6 months on average.


            Please navigate to the job posting and complete the application process using this information.
            Make sure to upload the resume file when prompted, only as the last step.
                `,
            llm: "gemini-2.5-flash",
            flashMode: true,
            sessionId: session.id,
        });

        console.log(`[Application ${jobId}] Automation task created: ${task.id}`);

        // Create the application
        console.log(`[Application ${jobId}] Saving application to database...`);
        const [newApplication] = await db
            .insert(applications)
            .values({
                userId,
                jobId,
                taskId: task.id,
            })
            .returning();

        console.log(`[Application ${jobId}] Application saved with ID: ${newApplication.id}`);

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

        console.log(`[Application ${jobId}] Application process completed successfully`);
        return NextResponse.json({ application: applicationWithJob });
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
