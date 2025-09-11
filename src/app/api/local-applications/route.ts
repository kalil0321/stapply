import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { jobs, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Development mode check
function isDevelopment() {
    return process.env.NODE_ENV === "development";
}

// Middleware to check if in development mode
function checkDevelopmentMode() {
    if (!isDevelopment()) {
        return NextResponse.json(
            { error: "Local applications are only available in development mode" },
            { status: 403 }
        );
    }
    return null;
}

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Create a new local application
export async function POST(req: NextRequest) {
    // Check if in development mode
    const devCheck = checkDevelopmentMode();
    if (devCheck) return devCheck;

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { jobId, instructions, headless = true, maxSteps = 100 } = await req.json();

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
                model: openai('gpt-4o-mini'),
                prompt: `
                Parse the following job application automation response and create a pleasant, user-friendly summary.
                
                Raw response: ${JSON.stringify(flaskResult)}
                
                Please provide:
                1. A brief status summary
                2. Key actions taken during the application process
                3. Any important notes or next steps
                4. Overall success/failure indication
                
                Format the response as a JSON object with the following structure:
                {
                    "status": "success" | "partial" | "failed",
                    "summary": "Brief description of what happened",
                    "actions": ["list", "of", "key", "actions"],
                    "notes": "Any important notes or next steps",
                    "raw_history": "original history if needed for debugging"
                }
                `,
            });
            
            parsedResult = JSON.parse(text);
        } catch (aiError) {
            console.error(`[Local Application ${jobId}] AI parsing failed:`, aiError);
            // Fallback to basic parsing
            parsedResult = {
                status: flaskResult.error ? "failed" : "success",
                summary: flaskResult.error ? `Application failed: ${flaskResult.error}` : "Application process completed",
                actions: ["Automated application submission attempted"],
                notes: flaskResult.error ? "Please check the job link and try again" : "Please monitor your email for application updates",
                raw_history: flaskResult.history || flaskResult.error || "No detailed history available"
            };
        }

        console.log(`[Local Application ${jobId}] Application process completed successfully`);
        
        return NextResponse.json({ 
            success: true,
            job: {
                id: jobExists.id,
                title: jobExists.title,
                company: jobExists.company,
                link: jobExists.link,
                location: jobExists.location
            },
            result: parsedResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error creating local application:", error);
        return NextResponse.json(
            { error: "Failed to create local application" },
            { status: 500 }
        );
    }
}

// Get local applications (placeholder - could be used for history if we store them)
export async function GET() {
    // Check if in development mode
    const devCheck = checkDevelopmentMode();
    if (devCheck) return devCheck;

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return empty array since we're not storing local applications in DB
    // This could be enhanced to store application history in a separate table
    return NextResponse.json({ 
        applications: [],
        message: "Local applications are processed in real-time and not stored in the database" 
    });
}
