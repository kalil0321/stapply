"use server";

import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { SearchPrivateMetadata } from "@/lib/types";

const sqlQuerySchema = z.object({
    query: z.string().describe("The SQL query to execute"),
});

export async function sqlSearch(
    query: string,
    searchId: string,
    steps: SearchPrivateMetadata["steps"]
) {
    try {
        const startTime = Date.now();
        // Generate SQL query using LLM
        const { object, usage, providerMetadata, warnings } =
            await generateObject({
                model: openai.responses("gpt-4.1-mini"),
                schema: sqlQuerySchema,
                system: `You are a SQL expert. Generate a PostgreSQL query to search for jobs based on the user's search query. You need to craft the best query to find the most relevant jobs for the user's search query that will yield the lest number of false positives. Keep in mind the data is not perfect and you need to account for that.

I provide you with the jobs table schema.
Jobs table schema:
- id: uuid (primary key)
- link: text (job posting URL)
- title: text (job title)
- location: text (job location)
- company: text (company name)
- description: text (job description)
- posted_at: timestamp
- created_at: timestamp

Note that the user may make some quite complex queries like location could be a country, city, state, etc. for example. In this case, you need to query for cities in the country or regions. Also, you can query the region or the country too.
For example, if user ask for jobs in "Silicon Valley", you need to query for "Palo Alto", "Sunnyvale", "Mountain View", "San Jose", "San Francisco", "Redwood City", "Menlo Park".
You need to craft the best query to find the most relevant jobs for the user's search query that will yield the lest number of false positives.
When you make a query, you need to make sure that the query is valid and that it will not lead to an error.
Please limit results to 100 rows and keep in mind it is better to return no results than to return invalid results that don't fully match the search query.
`,
                // providerOptions: {
                //     openai: { reasoningEffort: "high" },
                // },
                prompt: `
User search query: "${query}"

Generate a SQL query that finds the most relevant jobs for this search.
            `,
            });

        console.log("Generated SQL:", object.query);

        const endTime = Date.now();
        const duration = endTime - startTime;

        const model =
            JSON.stringify(providerMetadata?.model) || "gpt-4.1-mini";
        // JSON.stringify(providerMetadata?.model) || "qwen/qwen3-32b";

        // Execute the generated SQL query safely
        const results = await db.execute(sql.raw(object.query));

        return {
            jobs: results,
            query: object.query,
            searchId,
        };
    } catch (error) {
        console.error("Error in SQL search:", error);
        return {
            error: "Failed to execute SQL search",
            jobs: [],
        };
    }
}
