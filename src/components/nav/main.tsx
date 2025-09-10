"use client";

import { useQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    PlusCircleIcon,
    type LucideIcon,
    HistoryIcon,
    SearchIcon,
    Loader2,
    ZapIcon,
} from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import Link from "next/link";
import { SearchHistory } from "@/lib/types";
import { useState, useEffect } from "react";

interface HistoryEntry {
    title: string;
    url: string;
    icon: LucideIcon;
    timestamp: string;
}

export function NavMain({
    items = [],
}: {
    items?: {
        title: string;
        url: string;
        icon?: LucideIcon;
    }[];
}) {
    const [cachedCount, setCachedCount] = useState<number | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    const { data: historyEntries = [], isLoading: loading } = useQuery({
        queryKey: ["recentSearches"],
        queryFn: async () => {
            const response = await fetch("/api/searches");
            if (!response.ok) {
                return [] as HistoryEntry[];
            }
            const data = await response.json();
            const recentSearches: SearchHistory[] = data.searches.slice(0, 5);
            return recentSearches.map((search) => {
                const isLiveSearch = search.type === 'live';
                return {
                    title:
                        search.query.length > 25
                            ? `${search.query.slice(0, 25)}...`
                            : search.query,
                    url: isLiveSearch 
                        ? `/live-search/${search.id}?q=${encodeURIComponent(search.query)}`
                        : `/search/${search.id}?q=${encodeURIComponent(search.query)}`,
                    icon: isLiveSearch ? ZapIcon : SearchIcon,
                    timestamp:
                        search.createdAt ||
                        new Date(search.timestamp).toISOString(),
                };
            });
        },
    });

    // Handle mounting state for hydration
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Cache the count when data is successfully loaded
    useEffect(() => {
        if (!loading && historyEntries.length >= 0) {
            setCachedCount(historyEntries.length);
        }
    }, [loading, historyEntries]);

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent className="flex flex-col gap-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip="Start a new job search"
                                className="bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                            >
                                <Link
                                    href="/"
                                    className="flex items-center gap-2"
                                >
                                    <PlusCircleIcon className="size-4" />
                                    <span>New Job Search</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <Collapsible 
                open={hasMounted ? isHistoryOpen : false} 
                onOpenChange={setIsHistoryOpen}
                className="group/collapsible"
            >
                <SidebarGroup>
                    <SidebarGroupLabel asChild>
                        <CollapsibleTrigger>
                            <div className="flex items-center gap-2 w-full">
                                <span>History</span>
                                {loading && cachedCount === null && (
                                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                                )}
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </div>
                        </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <HistoryGroup
                        historyEntries={historyEntries}
                        loading={loading}
                        cachedCount={cachedCount}
                    />
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link
                                    href="/history"
                                    className="flex items-center gap-2"
                                >
                                    <HistoryIcon className="size-4 text-muted-foreground" />
                                    <span>All History</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </Collapsible>
        </>
    );
}

const HistoryGroup = ({
    historyEntries,
    loading,
    cachedCount,
}: {
    historyEntries: HistoryEntry[];
    loading: boolean;
    cachedCount: number | null;
}) => {
    return (
        <CollapsibleContent>
            <SidebarGroupContent>
                <SidebarMenu>
                    {loading && cachedCount !== null && cachedCount > 0 ? (
                        // Show skeleton items based on cached count
                        Array.from({ length: cachedCount }, (_, i) => (
                            <SidebarMenuItem key={`skeleton-${i}`}>
                                <SidebarMenuButton disabled>
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="size-4 bg-muted-foreground/20 rounded animate-pulse" />
                                        <div className="h-4 bg-muted-foreground/20 rounded animate-pulse flex-1" />
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                    ) : loading &&
                      (cachedCount === null || cachedCount === 0) ? (
                        // Show single loading item for first load or when no previous entries
                        <SidebarMenuItem>
                            <SidebarMenuButton disabled>
                                <div className="flex items-center gap-2">
                                    <SearchIcon className="size-4 text-muted-foreground animate-pulse" />
                                    <span className="text-muted-foreground">
                                        Loading...
                                    </span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ) : historyEntries.length > 0 ? (
                        historyEntries.map((entry) => (
                            <SidebarMenuItem
                                key={`${entry.url}-${entry.timestamp}`}
                            >
                                <SidebarMenuButton
                                    asChild
                                    tooltip={entry.title}
                                >
                                    <Link
                                        href={entry.url}
                                        className="flex items-center gap-2"
                                    >
                                        <entry.icon className="size-4 text-muted-foreground" />
                                        <span className="truncate">
                                            {entry.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                    ) : (
                        <SidebarMenuItem>
                            <SidebarMenuButton disabled>
                                <div className="flex items-center gap-2">
                                    <SearchIcon className="size-4 text-muted-foreground" />
                                    <span className="text-muted-foreground text-sm">
                                        No recent searches
                                    </span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </CollapsibleContent>
    );
};
