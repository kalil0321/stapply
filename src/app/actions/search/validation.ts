"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { searchResults } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Job } from "@/lib/types";
import { searchCompletion as searchSystemPrompt } from "@/lib/ai/prompt";
import { searchCompletion as searchCompletionSchema } from "@/lib/ai/schema";
import { SearchPrivateMetadata } from "@/lib/types";

interface JobWithScore extends Job {
    similarityScore?: number;
    source?: "sql" | "vector" | "both";
}

const jobValidationSchema = z.object({
    validations: z.array(
        z.object({
            jobId: z.string(),
            isFullMatch: z
                .boolean()
                .describe(
                    "Whether this job almost fully matches the search query"
                ),
            isPartialMatch: z
                .boolean()
                .describe(
                    "Whether this job partially matches the search query"
                ),
            isInvalid: z
                .boolean()
                .describe(
                    "Whether this job doesn't match the search query at all"
                ),
            relevanceScore: z
                .number()
                .min(1)
                .max(100)
                .describe(
                    "Relevance score from 1-100 (100 being most relevant)"
                ),
            reason: z
                .string()
                .describe("Brief explanation of the validation decision"),
        })
    ),
});

const LLM_BATCH_SIZE = 5; // Process 5 jobs at a time with LLM

export async function validateJobBatch(
    searchId: string,
    searchQuery: string,
    jobs: JobWithScore[],
    validJobs: number,
    resultsLimit: number,
    steps: SearchPrivateMetadata["steps"]
): Promise<{
    validJobs: number;
    processedJobs: number;
}> {
    if (!searchId || !jobs || !Array.isArray(jobs)) {
        throw new Error("Missing required fields: searchId and jobs array");
    }

    let validCount = 0;
    let processedJobsTotal = 0;

    // Build batches of size LLM_BATCH_SIZE
    const batchPromises: Promise<number>[] = [];

    for (let i = 0; i < jobs.length; i += LLM_BATCH_SIZE) {
        const batch = jobs.slice(i, i + LLM_BATCH_SIZE);

        batchPromises.push(
            (async () => {
                try {
                    const startSmallerBatch = Date.now();

                    // Prepare job data for the LLM
                    const jobsForLLM = batch.map((job) => ({
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location || "Not specified",
                        description: job.description || "No description",
                        employment_type: job.employment_type || "Not specified",
                    }));

                    // TODO: Later change to use generateText so i can pass tools to the LLM
                    const { object: validation, usage } = await generateObject({
                        // model: groq("qwen/qwen3-32b"),
                        model: openai.responses("gpt-4.1-mini"),
                        schema: jobValidationSchema,
                        system: `You are a job relevance validator. Given a search query and a list of jobs, evaluate each job's relevance and validity. For each job, you will determine:
1. isFullMatch: Is this a legitimate job posting that matches the search intent? Be quite strict with this. If it's not a match, set isFullMatch to false.
2. isPartialMatch: Is this a job posting that partially matches the search intent? If it's a partial match, set isPartialMatch to true.
3. isInvalid: Is this a job posting that doesn't match the search intent at all? If it's an invalid job posting, set isInvalid to true.
4. relevanceScore: How well does this job match the search query? (1-100, where 100 is perfect match), if the relevance score is low, it means the job is not relevant to the search query
5. reason: Brief explanation of your decision`,
                        prompt: `Search Query: "${searchQuery}"

Jobs to validate:
${jobsForLLM
                                .map(
                                    (job, idx) => `
# Job ${idx + 1}
Job ID: ${job.id}
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
`
                                )
                                .join("\n")}`,
                    });

                    // Update database with validation results
                    let batchValidCount = 0;
                    for (const result of validation.validations) {
                        // Ensure jobId is properly formatted as UUID
                        const jobIdUuid = result.jobId.trim();

                        // Validate UUID format
                        const uuidRegex =
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (!uuidRegex.test(jobIdUuid)) {
                            console.error(
                                `Invalid UUID format for jobId: ${jobIdUuid}`
                            );
                            continue; // Skip this result
                        }

                        await db
                            .update(searchResults)
                            .set({
                                status: result.isFullMatch
                                    ? "valid"
                                    : result.isPartialMatch
                                        ? "partial"
                                        : "invalid",
                                relevanceScore: result.relevanceScore,
                                reason: result.reason,
                            })
                            .where(eq(searchResults.jobId, jobIdUuid));

                        if (result.isFullMatch || result.isPartialMatch) {
                            batchValidCount++;
                        }
                    }

                    processedJobsTotal += batch.length;
                    return batchValidCount;
                } catch (error) {
                    console.error(
                        `Error validating batch starting at index ${i}:`,
                        error
                    );

                    // Mark jobs as invalid if LLM validation fails
                    for (const job of batch) {
                        // Ensure jobId is properly formatted as UUID
                        const jobIdUuid = job.id.trim();

                        // Validate UUID format
                        const uuidRegex =
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (!uuidRegex.test(jobIdUuid)) {
                            console.error(
                                `Invalid UUID format for jobId: ${jobIdUuid}`
                            );
                            continue; // Skip this job
                        }

                        await db
                            .update(searchResults)
                            .set({
                                status: "invalid",
                                relevanceScore: 1,
                                reason: "Failed to validate with LLM",
                            })
                            .where(eq(searchResults.jobId, jobIdUuid));
                    }

                    processedJobsTotal += batch.length;
                    return 0;
                }
            })()
        );
    }

    // Wait for every batch to finish
    const batchValidities = await Promise.all(batchPromises);
    validCount = batchValidities.reduce((acc, cur) => acc + cur, 0);

    return {
        validJobs: validCount,
        processedJobs: processedJobsTotal || jobs.length,
    };
}

export async function validateQuery(
    searchId: string,
    query: string,
    steps: SearchPrivateMetadata["steps"]
) {
    try {
        const startTime = Date.now();
        if (!searchId) {
            throw new Error("Search ID is required");
        }

        if (!query || typeof query !== "string" || query.trim().length === 0) {
            throw new Error("Query is required");
        }

        if (query.length > 1_000) {
            throw new Error("Query too long (max 1000 characters)");
        }

        const { object, usage, providerMetadata, warnings } =
            await generateObject({
                model: openai.responses("gpt-4.1-mini"),
                system: searchSystemPrompt,
                prompt: query.trim(),
                schema: searchCompletionSchema,
            });

        const endTime = Date.now();
        const duration = endTime - startTime;


        return object;
    } catch (error) {
        console.error("Query validation error:", error);

        // Handle specific error types
        if (error instanceof z.ZodError) {
            throw new Error(
                `Schema validation failed`
            );
        }

        // Re-throw the error if it's already a known error
        if (error instanceof Error) {
            throw error;
        }

        // Generic error response
        throw new Error("Internal server error during query validation");
    }
}
