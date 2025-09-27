"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // keep data fresh for 5 minutes
            gcTime: 1000 * 60 * 30, // cache data in memory for 30 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
