import { NextRequest, NextResponse } from "next/server";
import { readFileFromStorage, fileExists } from "@/lib/storage";
import { auth } from "@/lib/auth/helpers";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ fileName: string }> }
) {
    try {
        const { fileName } = await params;

        if (!fileName) {
            return NextResponse.json(
                { error: "File name is required" },
                { status: 400 }
            );
        }

        // Verify file exists
        const exists = await fileExists(fileName);
        if (!exists) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Read file from storage
        const fileBuffer = await readFileFromStorage(fileName);

        // Return file with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${fileName}"`,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return NextResponse.json(
            { error: "Failed to serve file" },
            { status: 500 }
        );
    }
}
