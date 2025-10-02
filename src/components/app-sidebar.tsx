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
    FileTextIcon,
    MessagesSquareIcon,
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
        // Only show Local Applications in development mode
        // ...(process.env.NODE_ENV === "development" ? [{
        //     title: "Local Applications",
        //     url: "/local-applications",
        //     icon: RocketIcon,
        // }] : []),
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
        {
            title: "Resume Builder",
            url: "/tools/resume",
            icon: FileTextIcon,
        },
        {
            title: "Interview Prep",
            url: "/tools/interview",
            icon: MessagesSquareIcon,
        },
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
