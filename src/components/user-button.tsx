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
import {
    UserCircleIcon,
    SunIcon,
    MoonIcon,
    FileTextIcon,
    HeartIcon,
    CreditCardIcon,
    LogOutIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut, useSession } from "@/lib/auth/client";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCustomer } from "autumn-js/react";

export function UserButton({
    variant = "sidebar",
}: {
    variant?: "sidebar" | "dropdown";
}) {
    const { customer, openBillingPortal, isLoading: isCustomerLoading } = useCustomer();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { data: session, isPending: isUserLoading, error } = useSession();
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

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (!user && !isUserLoading) {
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

    // Use skeletons in-place for user info if loading
    const name = isUserLoading
        ? ""
        : user?.name || "";
    const email = isUserLoading
        ? ""
        : user?.email || "";
    const avatar = isUserLoading
        ? ""
        : user?.image || "/placeholder.svg";
    const tier = customer?.products.filter(p => p.status === "active").map(p => p.id)[0];

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="mb-4 w-full flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted/70 border border-muted shadow-sm min-w-[180px]">
                    <div className="gap-1 border-r-3 border-muted pr-1">
                        <span className="inline-block w-2 h-2 rounded-full mx-1"
                            style={{
                                background:
                                    tier === "pro"
                                        ? "#22c55e"
                                        : tier === "premium"
                                            ? "#3b82f6"
                                            : tier
                                                ? "#f59e42"
                                                : "#a3a3a3",
                            }}
                            aria-label={tier || "..."}
                        />
                        <span className={`capitalize font-semibold ${tier ? "text-primary" : "text-muted-foreground"} ${isCustomerLoading ? "animate-pulse" : ""}`}>
                            {tier || "..."}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">Applications</span>
                        <span className="font-mono text-foreground bg-background/70 rounded px-1 py-0.5">
                            {customer?.features?.application?.balance !== undefined
                                ? customer.features.application.balance
                                : <span className={`italic text-muted-foreground ${isCustomerLoading ? "animate-pulse" : ""}`}>...</span>}
                        </span>
                    </div>
                    <span className="text-muted-foreground">/</span>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">Searches</span>
                        <span className="font-mono text-foreground bg-background/70 rounded px-1 py-0.5">
                            {customer?.features?.search?.balance !== undefined
                                ? customer.features.search.balance
                                : <span className={`italic text-muted-foreground ${isCustomerLoading ? "animate-pulse" : ""}`}>...</span>}
                        </span>
                    </div>
                </div>
            </div>
            <DialogTrigger asChild>
                {variant === "sidebar" ? (
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        disabled={isUserLoading}
                    >
                        <Avatar className="h-8 w-8 rounded-lg">
                            {isUserLoading ? (
                                <>
                                    <AvatarFallback className="rounded-lg bg-muted border border-border text-black relative">
                                        <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
                                    </AvatarFallback>
                                </>
                            ) : (
                                <>
                                    <AvatarImage src={avatar} alt={name} />
                                    <AvatarFallback className="rounded-lg bg-muted border border-border text-black">
                                        {name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium relative">
                                {isUserLoading ? (
                                    <>
                                        <Skeleton className="absolute left-0 top-0 h-4 w-20 animate-pulse" />
                                    </>
                                ) : (
                                    name
                                )}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="truncate text-xs text-muted-foreground relative">
                                    {isUserLoading ? (
                                        <>
                                            <Skeleton className="absolute left-0 top-0 h-3 w-32 animate-pulse" />
                                        </>
                                    ) : (
                                        email
                                    )}
                                </span>
                            </div>
                        </div>
                    </SidebarMenuButton>
                ) : (
                    <button
                        className="rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        disabled={isUserLoading}
                        aria-label={isUserLoading ? "Loading user profile" : name}
                    >
                        <Avatar className="h-6 w-6 rounded-lg">
                            {isUserLoading ? (
                                <AvatarFallback className="rounded-lg bg-muted border border-border text-black relative">
                                    <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
                                </AvatarFallback>
                            ) : (
                                <>
                                    <AvatarImage src={avatar} alt={name} />
                                    <AvatarFallback className="rounded-lg bg-muted border border-border text-black">
                                        {name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                            {isUserLoading ? (
                                <AvatarFallback className="rounded-lg bg-muted border border-border text-black relative">
                                    <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
                                </AvatarFallback>
                            ) : (
                                <>
                                    <AvatarImage src={avatar} alt={name} />
                                    <AvatarFallback className="rounded-lg bg-muted border border-border text-black">
                                        {name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                        <div className="text-left">
                            <div className="font-medium relative">
                                {isUserLoading ? (
                                    <>
                                        <Skeleton className="absolute left-0 top-0 h-4 w-24 animate-pulse" />
                                    </>
                                ) : (
                                    name
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground font-normal relative">
                                {isUserLoading ? (
                                    <>
                                        <Skeleton className="absolute left-0 top-0 h-3 w-32 animate-pulse" />
                                    </>
                                ) : (
                                    email
                                )}
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
                        disabled={isUserLoading}
                    >
                        <UserCircleIcon className="size-4 mr-2" />
                        Profile & Preferences
                        {isUserLoading && (
                            <Skeleton className="ml-2 h-4 w-20 inline-block align-middle" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            router.push("/applications");
                            setIsDialogOpen(false);
                        }}
                        disabled={isUserLoading}
                    >
                        <FileTextIcon className="size-4 mr-2" />
                        My Applications
                        {isUserLoading && (
                            <Skeleton className="ml-2 h-4 w-24 inline-block align-middle" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                            router.push("/saved");
                            setIsDialogOpen(false);
                        }}
                        disabled={isUserLoading}
                    >
                        <HeartIcon className="size-4 mr-2" />
                        Saved Jobs
                        {isUserLoading && (
                            <Skeleton className="ml-2 h-4 w-20 inline-block align-middle" />
                        )}
                    </Button>

                    <div className="border-t pt-2 space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                openBillingPortal();
                            }}
                            disabled={isUserLoading}
                        >
                            <CreditCardIcon className="size-4 mr-2" />
                            Billing
                            {isUserLoading && (
                                <Skeleton className="ml-2 h-4 w-16 inline-block align-middle" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                switchTheme();
                                setIsDialogOpen(false);
                            }}
                            disabled={isUserLoading}
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
                            {isUserLoading && (
                                <Skeleton className="ml-2 h-4 w-16 inline-block align-middle" />
                            )}
                        </Button>
                    </div>

                    <div className="border-t pt-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => {
                                signOut();
                                setIsDialogOpen(false);
                            }}
                            disabled={isUserLoading}
                        >
                            <LogOutIcon className="size-4 mr-2" />
                            Log out
                            {isUserLoading && (
                                <Skeleton className="ml-2 h-4 w-16 inline-block align-middle" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
