import { SearchIcon } from "lucide-react";

export function SearchEmptyState() {
    return (
        <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <SearchIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-lg font-medium text-foreground">
                        No results found
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Try refining your search query or check back later.
                    </p>
                </div>
            </div>
        </div>
    );
}
