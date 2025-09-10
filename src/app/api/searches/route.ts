import { after, NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { searches, liveSearches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SearchMetadata, SearchPrivateMetadata } from "@/lib/types";
import { validateQuery } from "@/app/actions/search/validation";
import { sqlSearch } from "@/app/actions/search/sql";
import { vectorSearch } from "@/app/actions/search/vector";
import { combineResults } from "@/app/actions/search/combine";
import { auth } from "@/lib/auth/helpers";

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();
    const privateMetadata: SearchPrivateMetadata = {
        steps: [],
    };

    try {
        const startTime = Date.now();
        // First insert the search query into the database
        const [searchRecord] = await db
            .insert(searches)
            .values({
                userId,
                query,
            })
            .returning();

        after(async () => {
            // Update status to validating
            await db
                .update(searches)
                .set({ status: "validating" })
                .where(eq(searches.id, searchRecord.id));

            // Validate query
            const object = (await validateQuery(
                searchRecord.id,
                query,
                privateMetadata.steps
            )) as SearchMetadata;

            if (!object) {
                console.error("Error validating query");
                await db
                    .update(searches)
                    .set({ status: "done", valid: false, privateMetadata })
                    .where(eq(searches.id, searchRecord.id));
                return;
            }

            console.log("API: ", JSON.stringify(object, null, 2));
            const { query: q, filters } = object;

            if (!q.valid) {
                await db
                    .update(searches)
                    .set({ status: "done", valid: false, privateMetadata })
                    .where(eq(searches.id, searchRecord.id));
                return;
            }

            // Update metadata and status to query
            await db
                .update(searches)
                .set({
                    metadata: object,
                    status: "query",
                })
                .where(eq(searches.id, searchRecord.id));

            const enhancedQuery =
                query +
                "\n" +
                q.enhanced +
                "\n" +
                filters.map((f) => f.name + ": " + f.value).join("\n");

            // Custom search algorithm: SQL + Vector search
            try {
                // Parallel search calls
                const [sqlData, vectorData] = await Promise.all([
                    // Path 1: Generate SQL query using LLM
                    sqlSearch(
                        enhancedQuery,
                        searchRecord.id,
                        privateMetadata.steps
                    ),
                    // Path 2: Vector embedding search
                    vectorSearch(
                        searchRecord.id,
                        enhancedQuery,
                        privateMetadata.steps
                    ),
                ]);

                if (sqlData.error && vectorData.error) {
                    console.error("Search API error:", {
                        sql: sqlData.error,
                        vector: vectorData.error,
                    });
                    await db
                        .update(searches)
                        .set({ status: "done", privateMetadata })
                        .where(eq(searches.id, searchRecord.id));
                    return;
                }

                await db
                    .update(searches)
                    .set({
                        status: "data_validation",
                        embedding: vectorData.queryEmbedding,
                        enhancedQuery: vectorData.englishQuery,
                        sqlQuery: sqlData.query,
                    })
                    .where(eq(searches.id, searchRecord.id));

                // Combine and rank results
                const combineData = await combineResults(
                    sqlData.jobs || [],
                    vectorData.jobs || [],
                    searchRecord.id,
                    enhancedQuery,
                    privateMetadata.steps
                );

                if (combineData.error) {
                    console.error("Combine API error:", combineData.error);
                    await db
                        .update(searches)
                        .set({ status: "done", privateMetadata })
                        .where(eq(searches.id, searchRecord.id));
                    return;
                }

                const endTime = Date.now();
                const fullDuration = endTime - startTime;

                privateMetadata.steps.push({
                    name: "end",
                    duration: fullDuration,
                });

                await db
                    .update(searches)
                    .set({
                        privateMetadata,
                    })
                    .where(eq(searches.id, searchRecord.id));

                // Update status to done
                await db
                    .update(searches)
                    .set({ status: "done" })
                    .where(eq(searches.id, searchRecord.id));
            } catch (searchError) {
                console.error("Error in custom search:", searchError);
                await db
                    .update(searches)
                    .set({ status: "done" })
                    .where(eq(searches.id, searchRecord.id));
            }
        });

        return NextResponse.json({ id: searchRecord.id });
    } catch (error) {
        console.error("Error creating search:", error);
        return NextResponse.json(
            { error: "Failed to create search" },
            { status: 500 }
        );
    }
}

// Get user search history from db (including live searches)
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch regular searches
        const searchHistory = await db
            .select()
            .from(searches)
            .where(eq(searches.userId, userId))
            .orderBy(desc(searches.createdAt));

        // Fetch live searches
        const liveSearchHistory = await db
            .select()
            .from(liveSearches)
            .where(eq(liveSearches.userId, userId))
            .orderBy(desc(liveSearches.createdAt));

        // Combine and format the results
        const combinedHistory = [
            ...searchHistory.map(search => ({
                ...search,
                type: 'regular' as const,
                timestamp: new Date(search.createdAt).getTime()
            })),
            ...liveSearchHistory.map(liveSearch => ({
                ...liveSearch,
                type: 'live' as const,
                timestamp: new Date(liveSearch.createdAt).getTime(),
                // Map live search fields to match regular search interface
                valid: liveSearch.status !== 'failed',
                metadata: null as SearchMetadata | null
            }))
        ].sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending

        return NextResponse.json({ searches: combinedHistory });
    } catch (error) {
        console.error("Error fetching searches:", error);
        return NextResponse.json(
            { error: "Failed to fetch searches" },
            { status: 500 }
        );
    }
}

// Delete all user search history (including live searches)
export async function DELETE() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Delete both regular searches and live searches
        await Promise.all([
            db.delete(searches).where(eq(searches.userId, userId)),
            db.delete(liveSearches).where(eq(liveSearches.userId, userId))
        ]);

        return NextResponse.json({
            message: "Search history cleared successfully",
        });
    } catch (error) {
        console.error("Error clearing search history:", error);
        return NextResponse.json(
            { error: "Failed to clear search history" },
            { status: 500 }
        );
    }
}
