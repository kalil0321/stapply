import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const {
            jobUrl,
            instructions = "",
            headless = false,
            maxSteps = 100,
        } = await req.json();

        if (!jobUrl) {
            return NextResponse.json(
                { error: "Job URL is required" },
                { status: 400 }
            );
        }

        try {
            new URL(jobUrl);
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        const [userProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

        if (!userProfile) {
            return NextResponse.json(
                {
                    error: "User profile not found. Please complete your profile first.",
                },
                { status: 400 }
            );
        }

        if (!userProfile.resumeUrl) {
            return NextResponse.json(
                { error: "Resume not found. Please upload your resume first." },
                { status: 400 }
            );
        }

        const response = await fetch("http://localhost:8000/custom-application", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                job_url: jobUrl,
                instructions,
                headless,
                max_steps: maxSteps,
                resume_url: userProfile.resumeUrl,
                profile: userProfile,
            }),
        });

        if (!response.ok) {
            let errorMessage = "Failed to trigger application";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (error) {
                console.error("Failed to parse error response", error);
                const fallbackText = await response.text();
                if (fallbackText) {
                    errorMessage = fallbackText;
                }
            }

            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        const data = await response.json();

        return NextResponse.json({
            task_id: data.task_id,
            live_url: data.live_url,
            fallback_url: data.fallback_url,
            replay_url: data.replay_url,
            status: data.status,
            message: data.message,
        });
    } catch (error) {
        console.error("Error triggering custom application:", error);
        return NextResponse.json(
            { error: "Failed to trigger custom application" },
            { status: 500 }
        );
    }
}
