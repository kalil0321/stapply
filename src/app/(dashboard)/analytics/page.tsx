"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    TrendingUp,
    Clock,
    Search,
    Activity,
    Timer,
    Zap,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Calendar,
    Filter,
    Eye,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchMetadata } from "@/lib/types";

interface SearchRecord {
    id: string;
    userId: string;
    query: string;
    metadata: SearchMetadata | null;
    description: string | null;
    status: "in-progress" | "validating" | "query" | "data_validation" | "done";
    createdAt: string;
    valid: boolean;
    privateMetadata: any;
}

interface AnalyticsData {
    searches: SearchRecord[];
    analytics: {
        totalSearches: number;
        todaySearches: number;
        weekSearches: number;
        avgDuration: number;
        statusDistribution: {
            status: string;
            count: number;
            percentage: number;
        }[];
        stepMetrics: {
            stepName: string;
            avgDuration: number;
            count: number;
        }[];
    };
}

export default function AnalyticsPage() {
    const [expandedSearches, setExpandedSearches] = useState<Set<string>>(
        new Set()
    );

    const toggleExpanded = (searchId: string) => {
        const newExpanded = new Set(expandedSearches);
        if (newExpanded.has(searchId)) {
            newExpanded.delete(searchId);
        } else {
            newExpanded.add(searchId);
        }
        setExpandedSearches(newExpanded);
    };

    const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
        queryKey: ["analytics-searches"],
        queryFn: async () => {
            const response = await fetch("/api/analytics/searches");
            if (!response.ok) {
                throw new Error("Failed to fetch analytics");
            }
            return response.json();
        },
        refetchInterval: 30000,
    });

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "done":
                return <CheckCircle className="size-4 text-green-500" />;
            case "in-progress":
                return (
                    <RefreshCw className="size-4 text-blue-500 animate-spin" />
                );
            case "validating":
                return <AlertCircle className="size-4 text-yellow-500" />;
            case "query":
                return <Search className="size-4 text-orange-500" />;
            case "data_validation":
                return <Filter className="size-4 text-purple-500" />;
            default:
                return <XCircle className="size-4 text-red-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "bg-green-100 text-green-800 border-green-200";
            case "in-progress":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "validating":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "query":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "data_validation":
                return "bg-purple-100 text-purple-800 border-purple-200";
            default:
                return "bg-red-100 text-red-800 border-red-200";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-medium">Analytics</h1>
                        <p className="text-sm text-muted-foreground">
                            Search analytics and usage data
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-red-500 mb-4">
                            Error loading analytics data
                        </div>
                        <Button onClick={() => refetch()}>
                            <RefreshCw className="size-4 mr-2" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { searches, analytics } = data || { searches: [], analytics: null };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-xl font-medium flex items-center gap-2">
                        <BarChart3 className="size-6" />
                        Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Search analytics and usage data
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        <Activity className="size-3" />
                        Live Data
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Global aggregate token usage by model */}
            {(() => {
                if (!searches || searches.length === 0) return null;
                const globalModelStats: Record<
                    string,
                    { in: number; out: number; total: number }
                > = {};
                searches.forEach((search: any) => {
                    if (search.privateMetadata?.steps) {
                        search.privateMetadata.steps.forEach((step: any) => {
                            if (step.usage && step.model) {
                                if (!globalModelStats[step.model]) {
                                    globalModelStats[step.model] = {
                                        in: 0,
                                        out: 0,
                                        total: 0,
                                    };
                                }
                                globalModelStats[step.model].in +=
                                    step.usage.in || 0;
                                globalModelStats[step.model].out +=
                                    step.usage.out || 0;
                                globalModelStats[step.model].total +=
                                    step.usage.total || 0;
                            }
                        });
                    }
                });
                const models = Object.keys(globalModelStats);
                if (models.length === 0) return null;
                return (
                    <div className="mb-6">
                        <div className="text-xs font-semibold mb-1">
                            Global Token Usage by Model (All Searches)
                        </div>
                        <div className="overflow-x-auto">
                            <table className="text-xs border rounded w-full min-w-[350px]">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="px-2 py-1 text-left">
                                            Model
                                        </th>
                                        <th className="px-2 py-1 text-right">
                                            Tokens In
                                        </th>
                                        <th className="px-2 py-1 text-right">
                                            Tokens Out
                                        </th>
                                        <th className="px-2 py-1 text-right">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {models.map((model) => (
                                        <tr key={model}>
                                            <td className="px-2 py-1 font-mono">
                                                {model}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {globalModelStats[model].in}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {globalModelStats[model].out}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {globalModelStats[model].total}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {analytics && (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Search className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Total Searches
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {analytics.totalSearches}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {analytics.todaySearches} today
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Avg Duration
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {formatDuration(analytics.avgDuration)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Per search
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        This Week
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {analytics.weekSearches}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Searches performed
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Success Rate
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {analytics.totalSearches > 0
                                        ? Math.round(
                                              (searches.filter(
                                                  (s: SearchRecord) =>
                                                      s.status === "done" &&
                                                      s.valid
                                              ).length /
                                                  analytics.totalSearches) *
                                                  100
                                          )
                                        : 0}
                                    %
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Completed successfully
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Status Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-5" />
                                Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {analytics.statusDistribution.map((status) => (
                                    <div
                                        key={status.status}
                                        className="text-center"
                                    >
                                        <div className="flex items-center justify-center mb-2">
                                            {getStatusIcon(status.status)}
                                        </div>
                                        <div className="text-sm font-medium capitalize">
                                            {status.status.replace("-", " ")}
                                        </div>
                                        <div className="text-xl font-bold">
                                            {status.count}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {status.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* All Searches */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="size-5" />
                                All Searches ({searches.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {searches.map((search) => {
                                    const isExpanded = expandedSearches.has(
                                        search.id
                                    );
                                    const totalDuration =
                                        search.privateMetadata?.steps?.find(
                                            (s: any) => s.name === "end"
                                        )?.duration || 0;

                                    return (
                                        <div
                                            key={search.id}
                                            className="border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(
                                                                search.status
                                                            )}
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                                                                    search.status
                                                                )}`}
                                                            >
                                                                {search.status.replace(
                                                                    "-",
                                                                    " "
                                                                )}
                                                            </span>
                                                        </div>
                                                        {!search.valid && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-xs"
                                                            >
                                                                Invalid
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-medium mb-1 truncate">
                                                        {search.query}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="size-3" />
                                                            {formatDate(
                                                                search.createdAt
                                                            )}
                                                        </div>
                                                        {search.metadata
                                                            ?.filters &&
                                                            search.metadata
                                                                .filters
                                                                .length > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <Filter className="size-3" />
                                                                    {
                                                                        search
                                                                            .metadata
                                                                            .filters
                                                                            .length
                                                                    }{" "}
                                                                    filters
                                                                </div>
                                                            )}
                                                        {search.privateMetadata
                                                            ?.steps && (
                                                            <div className="flex items-center gap-1">
                                                                <Timer className="size-3" />
                                                                {totalDuration >
                                                                0
                                                                    ? formatDuration(
                                                                          totalDuration
                                                                      )
                                                                    : "Processing..."}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {search.privateMetadata
                                                        ?.steps && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                toggleExpanded(
                                                                    search.id
                                                                )
                                                            }
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="size-4" />
                                                            ) : (
                                                                <ChevronRight className="size-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/search/${search.id}`}
                                                        >
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Expanded Private Metadata */}
                                            {isExpanded &&
                                                search.privateMetadata
                                                    ?.steps && (
                                                    <div className="border-t border-border p-4 bg-muted/20">
                                                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                            <Timer className="size-4" />
                                                            Step Performance
                                                            Details
                                                        </h4>
                                                        {/* Aggregate stats by model */}
                                                        {(() => {
                                                            // Aggregate tokens by model
                                                            const modelStats: Record<
                                                                string,
                                                                {
                                                                    in: number;
                                                                    out: number;
                                                                    total: number;
                                                                }
                                                            > = {};
                                                            search.privateMetadata.steps.forEach(
                                                                (step: any) => {
                                                                    if (
                                                                        step.usage &&
                                                                        step.model
                                                                    ) {
                                                                        if (
                                                                            !modelStats[
                                                                                step
                                                                                    .model
                                                                            ]
                                                                        ) {
                                                                            modelStats[
                                                                                step.model
                                                                            ] =
                                                                                {
                                                                                    in: 0,
                                                                                    out: 0,
                                                                                    total: 0,
                                                                                };
                                                                        }
                                                                        modelStats[
                                                                            step.model
                                                                        ].in +=
                                                                            step
                                                                                .usage
                                                                                .in ||
                                                                            0;
                                                                        modelStats[
                                                                            step.model
                                                                        ].out +=
                                                                            step
                                                                                .usage
                                                                                .out ||
                                                                            0;
                                                                        modelStats[
                                                                            step.model
                                                                        ].total +=
                                                                            step
                                                                                .usage
                                                                                .total ||
                                                                            0;
                                                                    }
                                                                }
                                                            );
                                                            const models =
                                                                Object.keys(
                                                                    modelStats
                                                                );
                                                            if (
                                                                models.length ===
                                                                0
                                                            )
                                                                return null;
                                                            return (
                                                                <div className="mb-4">
                                                                    <div className="text-xs font-semibold mb-1">
                                                                        Token
                                                                        Usage by
                                                                        Model
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="text-xs border rounded w-full min-w-[350px]">
                                                                            <thead>
                                                                                <tr className="bg-muted">
                                                                                    <th className="px-2 py-1 text-left">
                                                                                        Model
                                                                                    </th>
                                                                                    <th className="px-2 py-1 text-right">
                                                                                        Tokens
                                                                                        In
                                                                                    </th>
                                                                                    <th className="px-2 py-1 text-right">
                                                                                        Tokens
                                                                                        Out
                                                                                    </th>
                                                                                    <th className="px-2 py-1 text-right">
                                                                                        Total
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {models.map(
                                                                                    (
                                                                                        model
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={
                                                                                                model
                                                                                            }
                                                                                        >
                                                                                            <td className="px-2 py-1 font-mono">
                                                                                                {
                                                                                                    model
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-right">
                                                                                                {
                                                                                                    modelStats[
                                                                                                        model
                                                                                                    ]
                                                                                                        .in
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-right">
                                                                                                {
                                                                                                    modelStats[
                                                                                                        model
                                                                                                    ]
                                                                                                        .out
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-right">
                                                                                                {
                                                                                                    modelStats[
                                                                                                        model
                                                                                                    ]
                                                                                                        .total
                                                                                                }
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="space-y-3">
                                                            {search.privateMetadata.steps
                                                                .filter(
                                                                    (
                                                                        step: any
                                                                    ) =>
                                                                        step.name !==
                                                                        "end"
                                                                )
                                                                .map(
                                                                    (
                                                                        step: any,
                                                                        index: number
                                                                    ) => (
                                                                        <div
                                                                            key={`${step.name}-${index}`}
                                                                            className="flex flex-col gap-2 p-3 bg-background rounded-md border mb-3"
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                                                        {index +
                                                                                            1}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-sm font-medium capitalize">
                                                                                            {step.name.replace(
                                                                                                "_",
                                                                                                " "
                                                                                            )}
                                                                                        </div>
                                                                                        {step.description && (
                                                                                            <div className="text-xs text-muted-foreground">
                                                                                                {
                                                                                                    step.description
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="text-sm font-medium">
                                                                                        {step.duration
                                                                                            ? formatDuration(
                                                                                                  step.duration
                                                                                              )
                                                                                            : "N/A"}
                                                                                    </div>
                                                                                    {step.cost && (
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            $
                                                                                            {step.cost.toFixed(
                                                                                                4
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {/* Inline step metadata */}
                                                                            {(step.model ||
                                                                                step.usage) && (
                                                                                <div className="ml-9 text-xs text-muted-foreground flex flex-wrap gap-4">
                                                                                    {step.model && (
                                                                                        <span className="font-mono">
                                                                                            model:{" "}
                                                                                            {
                                                                                                step.model
                                                                                            }
                                                                                        </span>
                                                                                    )}
                                                                                    {step.usage && (
                                                                                        <>
                                                                                            <span>
                                                                                                in:{" "}
                                                                                                {step
                                                                                                    .usage
                                                                                                    .in ??
                                                                                                    0}
                                                                                            </span>
                                                                                            <span>
                                                                                                out:{" "}
                                                                                                {step
                                                                                                    .usage
                                                                                                    .out ??
                                                                                                    0}
                                                                                            </span>
                                                                                            <span>
                                                                                                total:{" "}
                                                                                                {step
                                                                                                    .usage
                                                                                                    .total ??
                                                                                                    0}
                                                                                            </span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {/* Full step metadata */}
                                                                            <details className="ml-9">
                                                                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                                                                    Show
                                                                                    full
                                                                                    metadata
                                                                                </summary>
                                                                                <pre className="mt-2 p-2 bg-background rounded border text-xs overflow-auto">
                                                                                    {JSON.stringify(
                                                                                        step,
                                                                                        null,
                                                                                        2
                                                                                    )}
                                                                                </pre>
                                                                            </details>
                                                                        </div>
                                                                    )
                                                                )}

                                                            {/* Total Duration */}
                                                            {totalDuration >
                                                                0 && (
                                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md border border-primary/20">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                                            <CheckCircle className="size-3 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-medium">
                                                                                Total
                                                                                Duration
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                End
                                                                                to
                                                                                end
                                                                                processing
                                                                                time
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-sm font-bold text-primary">
                                                                        {formatDuration(
                                                                            totalDuration
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}

                                {searches.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No searches found
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
