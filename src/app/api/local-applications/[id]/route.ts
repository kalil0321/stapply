import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { jobs, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: jobId } = await params;
        const { instructions, headless = true, maxSteps = 100 } = await req.json();

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

        console.log(`[Local Application ${jobId}] Starting local application process for user ${userId}`);

        // Prepare the request payload for the Flask server
        const flaskPayload = {
            link: jobExists.link,
            additional_information: instructions || '',
            headless: headless,
            max_steps: maxSteps,
            resume_url: userProfile.resumeUrl
        };

        console.log(`[Local Application ${jobId}] Sending request to Flask server...`);
        
        // Make request to local Flask server
        const flaskResponse = await fetch('http://localhost:3001/apply-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(flaskPayload),
        });

        if (!flaskResponse.ok) {
            const errorText = await flaskResponse.text();
            console.error(`[Local Application ${jobId}] Flask server error: ${flaskResponse.status} ${flaskResponse.statusText}`);
            console.error(`[Local Application ${jobId}] Error response: ${errorText}`);
            
            return NextResponse.json(
                { 
                    error: "Failed to process application through local server",
                    details: errorText 
                },
                { status: 500 }
            );
        }

        const flaskResult = await flaskResponse.json();
        console.log(`[Local Application ${jobId}] Flask server response received`);

        // Use AI to parse and format the server response
        let parsedResult;
        try {
            const { text } = await generateText({
                model: openai('gpt-5'),
                prompt: `
                Parse the following job application automation response and create a pleasant, user-friendly summary.
                
                Job Details:
                - Title: ${jobExists.title}
                - Company: ${jobExists.company}
                - Link: ${jobExists.link}
                
                Raw automation response: ${JSON.stringify(flaskResult)}
                
                Please analyze the automation history and provide:
                1. A clear status (success/partial/failed)
                2. A user-friendly summary of what happened
                3. Key actions that were performed
                4. Any important notes or next steps for the user
                5. Whether the application was likely submitted successfully
                
                Format the response as a JSON object with this structure:
                {
                    "status": "success" | "partial" | "failed",
                    "summary": "Brief, user-friendly description of what happened",
                    "application_submitted": true | false,
                    "raw_history": "condensed version of key events"
                }
                
                Be encouraging and helpful in your language. If there were errors, suggest actionable next steps.
                `,
            });
            
            parsedResult = JSON.parse(text);
        } catch (aiError) {
            console.error(`[Local Application ${jobId}] AI parsing failed:`, aiError);
            // Fallback to basic parsing
            parsedResult = {
                status: flaskResult.error ? "failed" : "success",
                summary: flaskResult.error ? 
                    `Application encountered an issue: ${flaskResult.error}` : 
                    "Application automation completed successfully",
                actions: ["Automated application process executed"],
                notes: flaskResult.error ? 
                    "Please check the job link and your profile information, then try again" : 
                    "Please check your email for confirmation and follow up as needed",
                confidence: flaskResult.error ? "low" : "medium",
                application_submitted: !flaskResult.error,
                raw_history: flaskResult.history || flaskResult.error || "No detailed history available"
            };
        }

        console.log(`[Local Application ${jobId}] Application process completed`);
        
        return NextResponse.json({ 
            success: true,
            job: {
                id: jobExists.id,
                title: jobExists.title,
                company: jobExists.company,
                link: jobExists.link,
                location: jobExists.location,
                description: jobExists.description,
                employmentType: jobExists.employmentType
            },
            result: parsedResult,
            timestamp: new Date().toISOString(),
            userId: userId
        });

    } catch (error) {
        console.error(`Error processing local application for job ${params.id}:`, error);
        return NextResponse.json(
            { 
                error: "Failed to process local application",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

// Get application status (placeholder for future enhancement)
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: jobId } = await params;

        // Get job details for reference
        const [job] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, jobId))
            .limit(1);

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        // Since local applications are not stored in the database,
        // we return job information and indicate that no application history is available
        return NextResponse.json({
            job: {
                id: job.id,
                title: job.title,
                company: job.company,
                link: job.link,
                location: job.location,
                description: job.description,
                employmentType: job.employmentType
            },
            message: "Local applications are processed in real-time. Use POST to start a new application.",
            hasStoredApplication: false
        });

    } catch (error) {
        console.error(`Error fetching local application for job ${params.id}:`, error);
        return NextResponse.json(
            { error: "Failed to fetch application information" },
            { status: 500 }
        );
    }
}
