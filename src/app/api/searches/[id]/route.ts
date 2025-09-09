import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { searches, searchResults } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const searchId = (await params).id;

        // Fetch search data
        const [search] = await db
            .select()
            .from(searches)
            .where(eq(searches.id, searchId));

        if (!search) {
            return NextResponse.json(
                { error: "Search not found" },
                { status: 404 }
            );
        }

        // Fetch search results
        const results = await db
            .select()
            .from(searchResults)
            .where(eq(searchResults.searchId, searchId));

        return NextResponse.json({
            id: search.id,
            query: search.query,
            status: search.status,
            description: search.description,
            valid: search.valid,
            createdAt: search.createdAt,
            results: results.map(result => ({
                id: result.id,
                title: result.title,
                company: result.company,
                location: result.location,
                description: result.description,
                link: result.link,
                postedAt: result.postedAt,
                source: result.source,
                similarityScore: result.similarityScore,
                relevanceScore: result.relevanceScore,
                status: result.status,
                reason: result.reason,
            }))
        });
    } catch (error) {
        console.error("Error fetching search:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
