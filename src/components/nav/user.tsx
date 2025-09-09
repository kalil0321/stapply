"use client";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { UserButton } from "@stackframe/stack";
import * as React from "react";

export function NavUser() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <UserButton
                    showUserInfo={true}
                    colorModeToggle={() => console.log("color mode toggle clicked")}
                />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
