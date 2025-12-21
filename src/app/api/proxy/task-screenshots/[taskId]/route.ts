import { NextRequest, NextResponse } from "next/server";

const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:3001";

export async function GET(
    req: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const { taskId } = await params;

        if (!taskId) {
            return NextResponse.json(
                { error: "Task ID is required" },
                { status: 400 }
            );
        }

        const response = await fetch(`${FLASK_SERVER_URL}/api/task-screenshots/${taskId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error || "Failed to get screenshots" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error proxying task-screenshots request:", error);
        return NextResponse.json(
            { error: "Failed to get screenshots" },
            { status: 500 }
        );
    }
}
