import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    const { taskId } = params;

    try {
        const response = await fetch(`http://localhost:3001/api/task-ready/${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error proxying task ready request:", error);
        return NextResponse.json(
            { 
                ready: false, 
                status: "error", 
                message: "Failed to check task status" 
            },
            { status: 500 }
        );
    }
}
