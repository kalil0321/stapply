import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fileBuffer, filename, parseOnly = true } = body;

        if (!fileBuffer || !filename) {
            return NextResponse.json(
                { error: "File buffer and filename are required" },
                { status: 400 }
            );
        }

        // Convert file buffer to ArrayBuffer
        const resumeData = new Uint8Array(fileBuffer).buffer;

        // Define comprehensive schema for resume parsing
        const resumeSchema = z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
            linkedinUrl: z.string().optional(),
            githubUrl: z.string().optional(),
            portfolioUrl: z.string().optional(),
            summary: z.string().optional(),
            skills: z.array(z.string()).optional(),
            languages: z.array(z.object({
                language: z.string(),
                proficiency: z.string().optional()
            })).optional(),
            experience: z.array(z.object({
                company: z.string(),
                position: z.string(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                description: z.string().optional(),
                location: z.string().optional(),
            })).optional(),
            education: z.array(z.object({
                institution: z.string(),
                degree: z.string(),
                fieldOfStudy: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                gpa: z.string().optional(),
                description: z.string().optional(),
            })).optional(),
        });

        // Parse resume using AI
        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: resumeSchema,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Parse this resume and extract all relevant information including personal details, work experience, education, and skills. Return structured data that matches the provided schema. For experience, use 'position' for job title. For languages, if proficiency is not specified, leave it empty. Extract URLs for LinkedIn, GitHub, and portfolio if mentioned.",
                        },
                        {
                            type: "file",
                            data: resumeData,
                            mimeType: filename.toLowerCase().endsWith('.pdf') ? "application/pdf" : 
                                     filename.toLowerCase().endsWith('.txt') ? "text/plain" :
                                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            filename: filename,
                        },
                    ],
                },
            ],
        });

        if (!object) {
            return NextResponse.json(
                { error: "Failed to parse resume" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: object,
            message: "Resume parsed successfully",
        });
    } catch (error) {
        console.error("Error parsing resume:", error);
        return NextResponse.json(
            { error: "Failed to parse resume" },
            { status: 500 }
        );
    }
}
