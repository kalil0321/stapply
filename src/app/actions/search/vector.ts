"use server";

import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { SearchPrivateMetadata } from "@/lib/types";

const translationSchema = z.object({
    translatedQuery: z.string().describe("The query translated to English"),
});

// TODO: remove translation step and add it to validation step
export async function vectorSearch(
    searchId: string,
    searchQuery: string,
    steps: SearchPrivateMetadata["steps"]
) {
    try {
        const startTime = Date.now();
        // Step 1: Translate to English if needed
        const {
            object: translation,
            usage,
            providerMetadata,
            warnings,
        } = await generateObject({
            model: openai.responses("gpt-4.1-mini"),
            schema: translationSchema,
            system: `
You are a helpful assistant that translates search queries to English. You will be given a search query and you will need to translate it to English if it's not already in English.

You will need to return the following:
- The translated query"
            `,
            prompt: `
Query: "${searchQuery}"
            `,
        });

        const englishQuery = translation.translatedQuery;
        console.log("Translation result:", translation);

        const endTime = Date.now();
        const duration = endTime - startTime;

        const model = JSON.stringify(providerMetadata?.model) || "gpt-4.1-mini";

        const startTime2 = Date.now();
        // Step 2: Generate embedding for the English query
        const embeddingResponse = await fetch(
            "https://api.openai.com/v1/embeddings",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input: englishQuery,
                    model: "text-embedding-3-small",
                }),
            }
        );

        if (!embeddingResponse.ok) {
            throw new Error("Failed to generate embedding");
        }

        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding; 

        // Step 3: Perform vector similarity search
        const vectorResults: {
            id: string;
            link: string;
            title: string;
            location: string;
            company: string;
            similarity_score: number;
        }[] = await db.execute(sql`
            SELECT 
                id,
                link,
                title,
                location,
                company,
                1 - (embedding <=> ${JSON.stringify(
                    queryEmbedding
                )}::vector) as similarity_score
            FROM jobs
            WHERE embedding IS NOT NULL
            AND (1 - (embedding <=> ${JSON.stringify(
                queryEmbedding
            )}::vector)) > 0.4
            ORDER BY similarity_score DESC
            LIMIT 100
        `);

        return {
            jobs: vectorResults,
            translation,
            englishQuery,
            queryEmbedding,
        };
    } catch (error) {
        console.error("Error in vector search:", error);
        return {
            error: "Error in vector search",
        };
    }
}
