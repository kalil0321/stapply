import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { BrowserUseClient } from "browser-use-sdk";
import { db } from "@/db/drizzle";
import { liveSearches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query?.trim()) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log("Creating live search task for user:", userId, "with query:", query.trim());

        // Check if BrowserUse is configured
        if (!process.env.BROWSER_USE_API_KEY) {
            return NextResponse.json(
                { error: "Browser automation service is not configured" },
                { status: 500 }
            );
        }

        // Create BrowserUse client
        const browser = new BrowserUseClient({
            apiKey: process.env.BROWSER_USE_API_KEY,
        });

        // Create BrowserUse task for job searching
        let browserTask;
        try {
            browserTask = await browser.tasks.createTask({
                systemPromptExtension: `You are a professional job search assistant. You search for jobs and collect information about 3 relevant job postings. Please be thorough and accurate in collecting this information. If a company name is mentioned, try using their careers page or their job board like for Mistral: https://jobs.lever.co/mistral or Palantir: https://jobs.lever.co/palantir or OpenAI: https://jobs.ashbyhq.com/openai. Otherwise, use linkedin to find the jobs.`,
                task: `Please search for "${query}"`,
                schema: z.array(z.object({
                    title: z.string(),
                    link: z.url(),
                })),
                flashMode: true,
                highlightElements: true,
                llm: "gemini-2.5-flash",
            });
        } catch (error) {
            console.error("Error creating BrowserUse task:", error);

            // Check for specific error types
            if (error && typeof error === 'object' && 'statusCode' in error) {
                const browserError = error as any;
                if (browserError.statusCode === 429) {
                    return NextResponse.json(
                        { error: "Too many concurrent searches. Please wait for one to finish or try again later." },
                        { status: 429 }
                    );
                }
            }

            return NextResponse.json(
                { error: "Failed to create browser automation task. Please try again." },
                { status: 500 }
            );
        }

        console.log("BrowserUse task created:", JSON.stringify(browserTask, null, 2));

        // Store the live search record in the dedicated live_searches table
        const [liveSearchRecord] = await db
            .insert(liveSearches)
            .values({
                userId,
                query: query.trim(),
                status: "pending",
                id: browserTask.id,
                browserTaskId: browserTask.id,
            })
            .returning();

        console.log("Live search record created:", JSON.stringify(liveSearchRecord, null, 2));

        // Stream to frontend
        return NextResponse.json({
            id: browserTask.id,
            status: "pending",
            message: "Live search task created successfully",
            liveSearch: liveSearchRecord
        });

    } catch (error) {
        console.error("Live search API error:", error);

        // Handle specific error types
        if (error && typeof error === 'object' && 'statusCode' in error) {
            const apiError = error as any;

            switch (apiError.statusCode) {
                case 429:
                    return NextResponse.json(
                        { error: "Too many concurrent searches. Please wait for one to finish or try again later." },
                        { status: 429 }
                    );
                case 403:
                    return NextResponse.json(
                        { error: "Access denied to browser automation service." },
                        { status: 403 }
                    );
                case 500:
                    return NextResponse.json(
                        { error: "Browser automation service is temporarily unavailable. Please try again later." },
                        { status: 500 }
                    );
                default:
                    return NextResponse.json(
                        { error: `Service error: ${apiError.statusCode}. Please try again.` },
                        { status: apiError.statusCode }
                    );
            }
        }

        return NextResponse.json(
            { error: "Failed to create live search task. Please try again." },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all live search tasks for the user from the dedicated table
        const liveSearchTasks = await db
            .select()
            .from(liveSearches)
            .where(eq(liveSearches.userId, userId))
            .orderBy(desc(liveSearches.createdAt));

        return NextResponse.json({
            tasks: liveSearchTasks,
            message: "Live search tasks retrieved successfully"
        });

    } catch (error) {
        console.error("Live search GET API error:", error);
        return NextResponse.json(
            { error: "Failed to retrieve live search tasks" },
            { status: 500 }
        );
    }
}
