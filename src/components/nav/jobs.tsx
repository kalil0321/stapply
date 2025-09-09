"use client";
import { BriefcaseIcon, LucideIcon } from "lucide-react";

import { Collapsible } from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenu,
    SidebarGroupContent,
} from "@/components/ui/sidebar";

export function NavJobs({
    items,
}: {
    items: { title: string; url: string; icon?: LucideIcon }[];
}) {
    return (
        <>
            <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                    Jobs
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild tooltip={item.title}>
                                    <a href={item.url}>
                                        {item.icon && (
                                            <item.icon className="size-4" />
                                        )}
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </>
    );
}
