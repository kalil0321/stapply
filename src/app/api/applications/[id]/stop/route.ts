import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { applications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:3001";

export async function POST(
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
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        // Verify the application exists and belongs to the user
        const [application] = await db
            .select()
            .from(applications)
            .where(eq(applications.id, id))
            .limit(1);

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        // Check if the user owns this application
        if (application.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Stop the task in Flask server if taskId exists
        if (application.taskId) {
            try {
                const response = await fetch(`${FLASK_SERVER_URL}/stop-task/${application.taskId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.warn("Failed to stop task in Flask server:", errorData);
                    // Continue anyway - we'll still update the database
                } else {
                    const data = await response.json();
                    console.log("Task stopped successfully:", data);
                }
            } catch (error) {
                console.error("Error stopping task in Flask server:", error);
                // Continue anyway - we'll still update the database
            }
        }

        // Update application status in database
        await db
            .update(applications)
            .set({
                updatedAt: new Date(),
            })
            .where(eq(applications.id, id));

        return NextResponse.json({
            success: true,
            message: "Application workflow stopped successfully",
        });
    } catch (error) {
        console.error("Error stopping application:", error);
        return NextResponse.json(
            { error: "Failed to stop application" },
            { status: 500 }
        );
    }
}
