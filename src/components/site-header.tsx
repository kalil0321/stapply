"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
    const { open } = useSidebar();
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center gap-2 px-4 justify-between">
                <SidebarTrigger className="-ml-1" />
            </div>
        </header>
    );
}
