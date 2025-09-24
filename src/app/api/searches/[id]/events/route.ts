import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/helpers";
import {
    getSearchEmitter,
    getSearchPayload,
    releaseSearchEmitter,
    type SearchStreamPayload,
} from "@/lib/search-events";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const searchId = params.id;
    if (!searchId) {
        return new Response("Search ID is required", { status: 400 });
    }

    const payload = await getSearchPayload(searchId);
    if (!payload) {
        return new Response("Search not found", { status: 404 });
    }

    if (payload.record.userId !== userId) {
        return new Response("Forbidden", { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (data: SearchStreamPayload) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            const emitter = getSearchEmitter(searchId);
            let closed = false;
            let abortHandler: (() => void) | null = null;

            const cleanup = () => {
                if (closed) return;
                closed = true;
                if (abortHandler) {
                    req.signal.removeEventListener("abort", abortHandler);
                }
                emitter.off("update", handler);
                releaseSearchEmitter(searchId);
                controller.close();
            };

            const handler = (data: SearchStreamPayload) => {
                send(data);
                if (data.status === "done" || !data.valid) {
                    cleanup();
                }
            };

            emitter.on("update", handler);

            abortHandler = () => {
                cleanup();
            };

            req.signal.addEventListener("abort", abortHandler);

            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(payload.response)}\n\n`)
            );

            if (
                payload.response.status === "done" ||
                payload.response.valid === false
            ) {
                cleanup();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
