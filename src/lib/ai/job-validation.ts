import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { searchResults, searches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Job } from "@/lib/types";

interface JobWithScore extends Job {
    similarityScore?: number;
    source?: "sql" | "vector" | "both";
}

const schema = z.object({
    validations: z.array(
        z.object({
            jobId: z.string(),
            isValid: z
                .boolean()
                .describe("Whether this job is relevant and legitimate"),
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
    jobs: JobWithScore[],
    validJobs: number,
    resultsLimit: number
): Promise<{ validJobs: number; processedJobs: number }> {
    if (!searchId || !jobs || !Array.isArray(jobs)) {
        throw new Error("Missing required fields: searchId and jobs array");
    }

    // Get the original search query for context
    const [search] = await db
        .select({ query: searches.query, metadata: searches.metadata })
        .from(searches)
        .where(eq(searches.id, searchId))
        .limit(1);

    if (!search) {
        throw new Error("Search not found");
    }

    const searchQuery = search.query;
    let validCount = 0;

    // Process jobs in smaller batches for LLM
    for (let i = 0; i < jobs.length; i += LLM_BATCH_SIZE) {
        const batch = jobs.slice(i, i + LLM_BATCH_SIZE);
        if (validJobs + validCount > resultsLimit) {
            break;
        }

        try {
            // Prepare job data for LLM
            const jobs = batch.map((job) => ({
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location || "Not specified",
                description: job.description || "No description",
                employment_type: job.employment_type || "Not specified",
            }));

            // TODO: Change to use generateText so i can pass tools to the LLM
            const { object: validation } = await generateObject({
                model: openai.responses("gpt-4.1-mini"),
                schema,
                prompt: `You are a job relevance validator. Given a search query and a list of jobs, evaluate each job's relevance and validity.

Search Query: "${searchQuery}"

Jobs to validate:
${jobs
    .map(
        (job, idx) => `
${idx + 1}. Job ID: ${job.id}
   Title: ${job.title}
   Company: ${job.company}
   Location: ${job.location}
   Type: ${job.employment_type}
   Description: ${job.description}
`
    )
    .join("\n")}

For each job, determine:
1. isValid: Is this a legitimate job posting that matches the search intent? (not spam, not irrelevant)
2. relevanceScore: How well does this job match the search query? (1-100, where 100 is perfect match), if the relevance score is low, it means the job is not relevant to the search query
3. reason: Brief explanation of your decision

Consider factors like:
- Job title relevance to search query
- Company legitimacy
- Job description quality and completeness
- Location match (if specified in query)
- Employment type match (if specified in query)`,
            });

            // Update database with validation results
            for (const result of validation.validations) {
                await db
                    .update(searchResults)
                    .set({
                        status: result.isValid ? "valid" : "invalid",
                        relevanceScore: result.relevanceScore,
                        reason: result.reason,
                    })
                    .where(eq(searchResults.jobId, result.jobId));

                if (result.isValid) {
                    validCount++;
                }
            }
        } catch (error) {
            console.error(
                `Error validating batch starting at index ${i}:`,
                error
            );

            // Mark jobs as invalid if LLM validation fails
            for (const job of batch) {
                await db
                    .update(searchResults)
                    .set({
                        status: "invalid",
                        relevanceScore: 1,
                        reason: "Failed to validate with LLM",
                    })
                    .where(eq(searchResults.jobId, job.id));
            }
        }
    }

    console.log(
        `Validation complete: ${validCount} valid jobs out of ${jobs.length} total`
    );

    return {
        validJobs: validCount,
        processedJobs: jobs.length,
    };
}
