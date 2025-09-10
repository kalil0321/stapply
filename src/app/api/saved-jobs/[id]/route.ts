import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { savedJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Update a saved job (notes, status)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { notes, status } = await req.json();
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Saved job ID is required" },
                { status: 400 }
            );
        }

        // Check if saved job exists and belongs to user
        const [existingSavedJob] = await db
            .select()
            .from(savedJobs)
            .where(and(eq(savedJobs.id, id), eq(savedJobs.userId, userId)))
            .limit(1);

        if (!existingSavedJob) {
            return NextResponse.json(
                { error: "Saved job not found" },
                { status: 404 }
            );
        }

        // Update the saved job
        const [updatedSavedJob] = await db
            .update(savedJobs)
            .set({
                notes: notes !== undefined ? notes : existingSavedJob.notes,
                status: status !== undefined ? status : existingSavedJob.status,
                updatedAt: new Date().toISOString(),
            })
            .where(and(eq(savedJobs.id, id), eq(savedJobs.userId, userId)))
            .returning();

        return NextResponse.json({ savedJob: updatedSavedJob });
    } catch (error) {
        console.error("Error updating saved job:", error);
        return NextResponse.json(
            { error: "Failed to update saved job" },
            { status: 500 }
        );
    }
}

// Delete a saved job
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Saved job ID is required" },
                { status: 400 }
            );
        }

        // Check if saved job exists and belongs to user
        const [existingSavedJob] = await db
            .select()
            .from(savedJobs)
            .where(and(eq(savedJobs.id, id), eq(savedJobs.userId, userId)))
            .limit(1);

        if (!existingSavedJob) {
            return NextResponse.json(
                { error: "Saved job not found" },
                { status: 404 }
            );
        }

        // Delete the saved job
        await db
            .delete(savedJobs)
            .where(and(eq(savedJobs.id, id), eq(savedJobs.userId, userId)));

        return NextResponse.json({ message: "Saved job deleted successfully" });
    } catch (error) {
        console.error("Error deleting saved job:", error);
        return NextResponse.json(
            { error: "Failed to delete saved job" },
            { status: 500 }
        );
    }
}
