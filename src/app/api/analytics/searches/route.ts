import { auth } from "@/lib/auth/helpers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { searches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SearchPrivateMetadata } from "@/lib/types";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const allSearches = await db
            .select()
            .from(searches)
            .where(eq(searches.userId, userId))
            .orderBy(desc(searches.createdAt));

        // Calculate basic analytics
        const totalSearches = allSearches.length;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaySearches = allSearches.filter(
            (search) => new Date(search.createdAt) >= todayStart
        ).length;

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekSearches = allSearches.filter(
            (search) => new Date(search.createdAt) >= weekStart
        ).length;

        // Calculate average duration from privateMetadata
        const searchesWithDuration = allSearches.filter((search) =>
            (search.privateMetadata as SearchPrivateMetadata).steps?.some(
                (step) => step.name === "end"
            )
        );

        const avgDuration =
            searchesWithDuration.length > 0
                ? searchesWithDuration.reduce((sum, search) => {
                      const endStep = (
                          search.privateMetadata as SearchPrivateMetadata
                      ).steps?.find((step) => step.name === "end");
                      return sum + (endStep?.duration || 0);
                  }, 0) / searchesWithDuration.length
                : 0;

        // Status distribution
        const statusCounts = allSearches.reduce((acc, search) => {
            acc[search.status] = (acc[search.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusDistribution = Object.entries(statusCounts).map(
            ([status, count]) => ({
                status,
                count,
                percentage: (count / totalSearches) * 100,
            })
        );

        // Step performance analysis
        const stepDurations = {} as Record<
            string,
            { total: number; count: number }
        >;

        allSearches.forEach((search) => {
            if ((search.privateMetadata as SearchPrivateMetadata).steps) {
                (search.privateMetadata as SearchPrivateMetadata).steps.forEach(
                    (step) => {
                        if (step.name !== "end" && step.duration) {
                            if (!stepDurations[step.name]) {
                                stepDurations[step.name] = {
                                    total: 0,
                                    count: 0,
                                };
                            }
                            stepDurations[step.name].total += step.duration;
                            stepDurations[step.name].count += 1;
                        }
                    }
                );
            }
        });

        const stepMetrics = Object.entries(stepDurations).map(
            ([stepName, data]) => ({
                stepName,
                avgDuration: data.total / data.count,
                count: data.count,
            })
        );

        return NextResponse.json({
            searches: allSearches,
            analytics: {
                totalSearches,
                todaySearches,
                weekSearches,
                avgDuration,
                statusDistribution,
                stepMetrics,
            },
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
