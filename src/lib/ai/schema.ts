import { z } from "zod";

export const searchCompletion = z.object({
    query: z.object({
        valid: z
            .boolean()
            .describe("Whether the query is appropriate for job search"),
        enhanced: z
            .string()
            .describe(
                "Your thoughts on the query. Provide a short explanation of the query and an enhanced version of the query."
            ),
        suggestion: z
            .string()
            .nullable()
            .describe(
                "Alternative query suggestion if the original is invalid or too specific. Set to null if no suggestion needed."
            ),
        reasoning: z
            .string()
            .nullable()
            .describe(
                "Brief explanation of why the query is invalid or needs modification. Set to null if not applicable."
            ),
    }),
    filters: z
        .array(
            z.object({
                name: z
                    .string()
                    .describe(
                        "Filter category (e.g., location, company, role, experience_level)"
                    ),
                value: z.string().describe("Filter value to apply"),
            })
        )
        .describe("List of search filters extracted from the user query"),
    enrichments: z
        .array(
            z.object({
                field: z
                    .string()
                    .describe(
                        "The data field to enrich (e.g., @founding_year, @company_size)"
                    ),
                description: z
                    .string()
                    .describe("Description of what this enrichment provides"),
            })
        )
        .describe("Optional data enrichments to enhance search results"),
});
