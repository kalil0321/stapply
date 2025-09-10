import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { convertToModelMessages, ModelMessage, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import fs from "fs";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { resumeUrl, fileBuffer, filename, parseOnly } = body;

        let resumeData: ArrayBuffer;

        if (fileBuffer && filename) {
            // Handle direct file buffer (for immediate parsing)
            resumeData = new Uint8Array(fileBuffer).buffer;
        } else if (resumeUrl) {
            // Handle URL-based parsing (for uploaded files)
            if (!resumeUrl) {
                return NextResponse.json(
                    { error: "Resume URL is required" },
                    { status: 400 }
                );
            }

            // Fetch the resume file from the URL
            const response = await fetch(resumeUrl);
            if (!response.ok) {
                return NextResponse.json(
                    { error: "Failed to fetch resume" },
                    { status: 400 }
                );
            }

            resumeData = await response.arrayBuffer();
        } else {
            return NextResponse.json(
                {
                    error: "Either resumeUrl or fileBuffer with filename is required",
                },
                { status: 400 }
            );
        }

        // Define comprehensive schema for resume parsing
        const resumeSchema = z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            location: z.string().optional(),
            summary: z.string().optional(),
            skills: z.array(z.string()).optional(),
            experience: z
                .array(
                    z.object({
                        title: z.string(),
                        company: z.string(),
                        startDate: z.string().optional(),
                        endDate: z.string().optional(),
                        current: z.boolean().optional(),
                        description: z.string().optional(),
                    })
                )
                .optional(),
            education: z
                .array(
                    z.object({
                        degree: z.string(),
                        institution: z.string(),
                        startDate: z.string().optional(),
                        endDate: z.string().optional(),
                        gpa: z.string().optional(),
                    })
                )
                .optional(),
        });

        // Parse resume using AI
        const { object, usage, warnings } = await generateObject({
            model: openai.responses("gpt-4.1-mini"),
            schema: resumeSchema,
            messages: [{
                role: "system",
                content: "You are a resume parser. You will be given a resume and you will need to parse it and extract all relevant information including personal details, work experience, education, and skills. Return structured data that matches the provided schema."
            },
            {
                role: "user",
                content: [{
                    type: "text",
                    text: "Parse this resume and extract all relevant information including personal details, work experience, education, and skills. Return structured data that matches the provided schema.",
                },
                {
                    type: "file",
                    data: resumeData,
                    // @ts-ignore
                    mediaType: "application/pdf",
                    filename: filename || "resume.pdf",
                }]
            },
            ],
        });

        fs.writeFileSync("usage.json", JSON.stringify(usage, null, 2));
        fs.writeFileSync("warnings.json", JSON.stringify(warnings, null, 2));

        if (!object) {
            return NextResponse.json(
                { error: "Failed to parse resume" },
                { status: 500 }
            );
        }

        // If parseOnly flag is set, return parsed data without updating DB
        if (parseOnly) {
            return NextResponse.json({
                data: object,
                message: "Resume parsed successfully",
            });
        }

        // Update the user's profile with parsed data
        const [updatedProfile] = await db
            .update(profiles)
            .set({
                ...object,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(profiles.userId, userId))
            .returning();

        if (!updatedProfile) {
            // If profile doesn't exist, create it
            const [newProfile] = await db
                .insert(profiles)
                .values({
                    userId,
                    ...object,
                })
                .returning();

            return NextResponse.json({
                profile: newProfile,
                message: "Profile updated with resume data",
            });
        }

        return NextResponse.json({
            profile: updatedProfile,
            message: "Profile updated with resume data",
        });
    } catch (error) {
        console.error("Error parsing resume:", error);
        return NextResponse.json(
            { error: "Failed to parse resume" },
            { status: 500 }
        );
    }
}
