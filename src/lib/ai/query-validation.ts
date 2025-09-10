import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { searchCompletion as system } from "@/lib/ai/prompt";
import { searchCompletion as schema } from "@/lib/ai/schema";
import { db } from "@/db/drizzle";
import { searches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SearchMetadata } from "@/lib/types";

export async function validateQuery(searchId: string, query: string) {
    try {
        if (!searchId) {
            throw new Error("Search ID is required");
        }

        if (!query || typeof query !== "string" || query.trim().length === 0) {
            throw new Error("Query is required");
        }

        if (query.length > 1_000) {
            throw new Error("Query too long (max 1000 characters)");
        }

        const { object } = await generateObject({
            model: openai.responses("gpt-4.1-mini"),
            system,
            prompt: query.trim(),
            schema,
        });

        await db
            .update(searches)
            .set({ metadata: object as SearchMetadata })
            .where(eq(searches.id, searchId));

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
