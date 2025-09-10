"use client";

import type * as React from "react";
import {
    BriefcaseIcon,
    SettingsIcon,
    UserIcon,
    BellIcon,
    BookmarkIcon,
    BarChart3,
    RouteIcon,
    RocketIcon,
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
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Stapply } from "./logo";

const data = {
    user: {
        name: "Alex Johnson",
        email: "alex@example.com",
        avatar: "/placeholder.svg?height=32&width=32",
        role: "Software Engineer",
    },
    jobCategories: [
        {
            title: "Applications",
            url: "/applications",
            icon: BriefcaseIcon,
        },
        {
            title: "Local Applications",
            url: "/local-applications",
            icon: RocketIcon,
        },
        {
            title: "Saved Jobs",
            url: "/saved",
            icon: BookmarkIcon,
        },
        {
            title: "Profile & Preferences",
            url: "/profile",
            icon: UserIcon,
        },
    ],
    navSecondary: [
        // { // For debugging purposes
        //     title: "Analytics",
        //     url: "/analytics",
        //     icon: BarChart3,
        // },
        // {
        //     title: "Roadmap",
        //     url: "/roadmap",
        //     icon: RouteIcon,
        // },
        // {
        //     title: "Notifications",
        //     url: "/notifications",
        //     icon: BellIcon,
        // },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props} className="flex flex-col">
            <SidebarHeader>
                <div className="flex items-center justify-center gap-2">
                    <a href="/">
                        <Stapply className="text-2xl text-black bg-clip-text tracking-tight" showDocs docsSize={28} />
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
