import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { utapi } from "@/app/api/uploadthing/core";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["application/pdf"];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: "Invalid file type. Please upload PDF documents only.",
                },
                { status: 400 }
            );
        }

        // Validate file size (5MB limit)
        const maxSize = 16 * 1024 * 1024; // 16MB
        if (file.size > maxSize) {
            return NextResponse.json(
                {
                    error: "File size too large. Please upload files smaller than 5MB.",
                },
                { status: 400 }
            );
        }


        const response = await utapi.uploadFiles(file);

        if (response.error) {
            console.error("Supabase upload error:", response.error);
            return NextResponse.json(
                { error: "Failed to upload file" },
                { status: 500 }
            );
        }

        // Get public URL
        const publicUrl = response.data.ufsUrl;

        // Update profile with resume URL
        const [updatedProfile] = await db
            .update(profiles)
            .set({
                resumeUrl: publicUrl,
                resumeUploaded: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(profiles.userId, userId))
            .returning();

        if (!updatedProfile) {
            // If profile doesn't exist, create it
            const [newProfile] = await db
                .insert(profiles)
                .values({
                    userId,
                    resumeUrl: publicUrl,
                    resumeUploaded: true,
                })
                .returning();

            return NextResponse.json({
                resumeUrl: newProfile.resumeUrl,
                message: "Resume uploaded successfully",
            });
        }

        return NextResponse.json({
            resumeUrl: updatedProfile.resumeUrl,
            message: "Resume uploaded successfully",
        });
    } catch (error) {
        console.error("Error uploading resume:", error);
        return NextResponse.json(
            { error: "Failed to upload resume" },
            { status: 500 }
        );
    }
}
