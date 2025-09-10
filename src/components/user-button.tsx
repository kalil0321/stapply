"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    UserCircleIcon,
    SunIcon,
    MoonIcon,
    FileTextIcon,
    HeartIcon,
    BellIcon,
    SettingsIcon,
    CreditCardIcon,
    LogOutIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut, useSession } from "@/lib/auth/client";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function UserButton({
    variant = "sidebar",
}: {
    variant?: "sidebar" | "dropdown";
}) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { data: session, isPending, error, refetch } = useSession();
    const user = session?.user;
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const switchTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    // Add keyboard shortcut for theme switching (Ctrl/Cmd + \)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "\\") {
                event.preventDefault();
                switchTheme();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [theme, setTheme]);

    if (isPending) {
        // Create loading skeleton that matches the actual content structure
        return variant === "sidebar" ? (
            <SidebarMenuButton size="lg" className="cursor-default" disabled>
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </SidebarMenuButton>
        ) : (
            <button
                className="rounded-lg focus:outline-none cursor-default"
                disabled
                aria-label="Loading user profile"
            >
                <Skeleton className="h-6 w-6 rounded-lg" />
            </button>
        );
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (!user) {
        // Create "no user" skeleton that matches the actual content structure
        return variant === "sidebar" ? (
            <SidebarMenuButton size="lg" className="cursor-default" disabled>
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </SidebarMenuButton>
        ) : (
            <button
                className="rounded-lg focus:outline-none cursor-default"
                disabled
                aria-label="User not found"
            >
                <Skeleton className="h-6 w-6 rounded-lg" />
            </button>
        );
    }

    const name = user.name || "User";
    const email = user.email || "";
    const avatar = user.image || "/placeholder.svg";
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {variant === "sidebar" ? (
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={avatar} alt={name} />
                            <AvatarFallback className="rounded-lg bg-muted border border-border text-black">
                                {name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{name}</span>
                            <div className="flex items-center gap-1">
                                <span className="truncate text-xs text-muted-foreground">
                                    {email}
                                </span>
                            </div>
                        </div>
                    </SidebarMenuButton>
                ) : (
                    <button className="rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <Avatar className="h-6 w-6 rounded-lg">
                            <AvatarImage src={avatar} alt={name} />
                            <AvatarFallback className="rounded-lg bg-muted border border-border text-black">
                                {name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage src={avatar} alt={name} />
                            <AvatarFallback className="rounded-lg bg-muted border border-border text-black">
                                {name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <div className="font-medium">{name}</div>
                            <div className="text-sm text-muted-foreground font-normal">
                                {email}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            router.push("/profile");
                            setIsDialogOpen(false);
                        }}
                    >
                        <UserCircleIcon className="size-4 mr-2" />
                        Profile & Preferences
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            switchTheme();
                            setIsDialogOpen(false);
                        }}
                    >
                        {theme === "dark" ? (
                            <SunIcon className="size-4 mr-2" />
                        ) : (
                            <MoonIcon className="size-4 mr-2" />
                        )}
                        Switch Theme
                        <span className="ml-auto text-xs text-muted-foreground">
                            {typeof navigator !== "undefined" &&
                                navigator.platform.toLowerCase().includes("mac")
                                ? "⌘\\"
                                : "Ctrl\\"}
                        </span>
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            router.push("/applications");
                            setIsDialogOpen(false);
                        }}
                    >
                        <FileTextIcon className="size-4 mr-2" />
                        My Applications
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            router.push("/saved");
                            setIsDialogOpen(false);
                        }}
                    >
                        <HeartIcon className="size-4 mr-2" />
                        Saved Jobs
                    </Button>

                    {/* <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            router.push("/notifications");
                            setIsDialogOpen(false);
                        }}
                    >
                        <BellIcon className="size-4 mr-2" />
                        Notifications
                        <Badge
                            variant="destructive"
                            className="ml-auto h-4 w-4 p-0 text-xs"
                        >
                            3
                        </Badge>
                    </Button> */}

                    {/* <div className="border-t pt-2 space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                router.push("/settings");
                                setIsDialogOpen(false);
                            }}
                        >
                            <SettingsIcon className="size-4 mr-2" />
                            Settings
                        </Button> 

                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                router.push("/billing");
                                setIsDialogOpen(false);
                            }}
                        >
                            <CreditCardIcon className="size-4 mr-2" />
                            Billing
                        </Button>
                    </div> */}

                    <div className="border-t pt-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => {
                                signOut();
                                setIsDialogOpen(false);
                            }}
                        >
                            <LogOutIcon className="size-4 mr-2" />
                            Log out
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
