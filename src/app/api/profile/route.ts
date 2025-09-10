import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get user profile
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [userProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

        if (!userProfile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ profile: userProfile });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// Create or update user profile
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const profileData = await req.json();

        // Check if profile exists
        const [existingProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

        let savedProfile;
        if (existingProfile) {
            // Update existing profile
            [savedProfile] = await db
                .update(profiles)
                .set({
                    ...profileData,
                    userId,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(profiles.userId, userId))
                .returning();
        } else {
            // Create new profile
            [savedProfile] = await db
                .insert(profiles)
                .values({
                    ...profileData,
                    userId,
                })
                .returning();
        }

        return NextResponse.json({ profile: savedProfile });
    } catch (error) {
        console.error("Error saving profile:", error);
        return NextResponse.json(
            { error: "Failed to save profile" },
            { status: 500 }
        );
    }
}
