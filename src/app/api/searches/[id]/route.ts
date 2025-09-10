import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import Exa from "exa-js";
import { db } from "@/db/drizzle";
import { searches, searchResults, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { error: "Search ID is required" },
            { status: 400 }
        );
    }

    try {
        // Fetch the search record from the database using the text ID
        const [searchRecord] = await db
            .select()
            .from(searches)
            .where(eq(searches.id, id));

        if (!searchRecord) {
            return NextResponse.json(
                { error: "Search not found" },
                { status: 404 }
            );
        }

        // Check if the user owns this search
        if (searchRecord.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch search results from database
        const searchResultsWithJobs = await db
            .select({
                id: searchResults.id,
                similarityScore: searchResults.similarityScore,
                source: searchResults.source,
                status: searchResults.status,
                reason: searchResults.reason,
                createdAt: searchResults.createdAt,
                job: {
                    id: jobs.id,
                    link: jobs.link,
                    title: jobs.title,
                    location: jobs.location,
                    company: jobs.company,
                    // description: jobs.description,
                    // employment_type: jobs.employment_type,
                    // industry: jobs.industry,
                    // posted_at: jobs.posted_at,
                    // created_at: jobs.created_at,
                },
            })
            .from(searchResults)
            .innerJoin(jobs, eq(searchResults.jobId, jobs.id))
            .where(eq(searchResults.searchId, id));

        return NextResponse.json({
            metadata: searchRecord.metadata,
            status: searchRecord.status,
            valid: searchRecord.valid,
            results: searchResultsWithJobs,
            totalResults: searchResultsWithJobs.length,
        });
    } catch (error) {
        console.error("Error fetching search:", error);
        return NextResponse.json(
            { error: "Failed to fetch search" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { error: "Search ID is required" },
            { status: 400 }
        );
    }

    try {
        // Fetch the search record from the database using the text ID
        const [searchRecord] = await db
            .select()
            .from(searches)
            .where(eq(searches.id, id));

        if (!searchRecord) {
            return NextResponse.json(
                { error: "Search not found" },
                { status: 404 }
            );
        }

        // Check if the user owns this search
        if (searchRecord.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.delete(searches).where(eq(searches.id, id));

        return NextResponse.json({ message: "Search deleted successfully" });
    } catch (error) {
        console.error("Error deleting search:", error);
        return NextResponse.json(
            { error: "Failed to delete search" },
            { status: 500 }
        );
    }
}
