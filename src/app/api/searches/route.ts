import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { searches, searchResults } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateQuery } from "../../actions/search/validate-query";
import { searchJobs } from "../../actions/search/search-jobs";

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        // Create search instance in database
        const [search] = await db
            .insert(searches)
            .values({
                userId: "anonymous", // TODO: Get from auth
                query: query.trim(),
                status: "in-progress",
            })
            .returning();

        // Start the search process asynchronously
        processSearch(search.id, query).catch(console.error);

        return NextResponse.json(search);
    } catch (error) {
        console.error("Error creating search:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function processSearch(searchId: string, query: string) {
    try {
        // Update status to validating
        await db
            .update(searches)
            .set({ status: "validating" })
            .where(eq(searches.id, searchId));

        // Validate the query
        const validationResult = await validateQuery(query);
        
        if (!validationResult.isValid) {
            await db
                .update(searches)
                .set({ 
                    status: "done",
                    valid: false,
                    description: validationResult.reason
                })
                .where(eq(searches.id, searchId));
            return;
        }

        // Update status to query
        await db
            .update(searches)
            .set({ status: "query" })
            .where(eq(searches.id, searchId));

        // Search for jobs using Browser Use
        const jobResults = await searchJobs(query);

        // Update status to data validation
        await db
            .update(searches)
            .set({ status: "data_validation" })
            .where(eq(searches.id, searchId));

        // Store results in database
        if (jobResults.length > 0) {
            await db.insert(searchResults).values(
                jobResults.map((result: any) => ({
                    searchId,
                    title: result.title,
                    company: result.company,
                    location: result.location,
                    description: result.description,
                    link: result.link,
                    postedAt: result.postedAt,
                    source: result.source,
                    similarityScore: result.similarityScore,
                    relevanceScore: result.relevanceScore,
                    status: "valid" as const
                }))
            );
        }

        // Mark search as complete
        await db
            .update(searches)
            .set({ 
                status: "done",
                description: `Found ${jobResults.length} job results`
            })
            .where(eq(searches.id, searchId));

    } catch (error) {
        console.error("Error processing search:", error);
        await db
            .update(searches)
            .set({ 
                status: "done",
                valid: false,
                description: "Search failed due to an error"
            })
            .where(eq(searches.id, searchId));
    }
}
