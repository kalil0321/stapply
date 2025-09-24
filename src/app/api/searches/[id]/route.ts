import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { searches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSearchPayload } from "@/lib/search-events";

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
        const payload = await getSearchPayload(id);

        if (!payload) {
            return NextResponse.json(
                { error: "Search not found" },
                { status: 404 }
            );
        }

        if (payload.record.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(payload.response);
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
