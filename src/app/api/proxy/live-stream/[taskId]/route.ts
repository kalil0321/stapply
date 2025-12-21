import { NextRequest, NextResponse } from "next/server";

const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:3001";

export async function GET(
    req: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const { taskId } = await params;

        if (!taskId) {
            return new NextResponse("Task ID is required", { status: 400 });
        }

        // Proxy the SSE stream from Flask server
        const response = await fetch(`${FLASK_SERVER_URL}/api/live-stream/${taskId}`, {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

        if (!response.ok) {
            return new NextResponse(
                `Failed to connect to live stream: ${response.statusText}`,
                { status: response.status }
            );
        }

        // Create a readable stream to pipe the SSE data
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    controller.close();
                    return;
                }

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }
                } catch (error) {
                    console.error("Error streaming SSE:", error);
                } finally {
                    controller.close();
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control",
            },
        });
    } catch (error) {
        console.error("Error proxying live-stream request:", error);
        return new NextResponse("Failed to connect to live stream", { status: 500 });
    }
}
