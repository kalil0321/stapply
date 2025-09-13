import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    const { taskId } = params;

    try {
        const response = await fetch(`http://localhost:3001/api/task-screenshots/${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error proxying task screenshots request:", error);
        return NextResponse.json(
            { 
                screenshots: [], 
                total: 0, 
                message: "Failed to load screenshots" 
            },
            { status: 500 }
        );
    }
}
