"use client";

import type * as React from "react";
import {
    BriefcaseIcon,
    UserIcon,
    BookmarkIcon,
    Link2Icon,
} from "lucide-react";

import { NavMain } from "@/components/nav/main";
import { NavJobs } from "@/components/nav/jobs";
import { NavSecondary } from "@/components/nav/secondary";
import { NavUser } from "@/components/nav/user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";

const data = {
    user: {
        name: "Alex Johnson",
        email: "alex@example.com",
        avatar: "/placeholder.svg?height=32&width=32",
        role: "Software Engineer",
    },
    jobCategories: [
        {
            title: "Quick Apply",
            url: "/quick-apply",
            icon: Link2Icon,
        },
        {
            title: "Saved Jobs",
            url: "/saved-jobs",
            icon: BookmarkIcon,
        },
        {
            title: "Applications",
            url: "/applications",
            icon: BriefcaseIcon,
        },
        {
            title: "Profile & Preferences",
            url: "/profile",
            icon: UserIcon,
        },
    ],
    navSecondary: [
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props} className="flex flex-col">
            <SidebarHeader>
                <div className="flex items-center justify-center gap-2">
                    <a href="/">
                        <Logo className="text-2xl text-black bg-clip-text tracking-tight" showDocs docsSize={28} />
                    </a>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain />
                <NavJobs items={data.jobCategories} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
