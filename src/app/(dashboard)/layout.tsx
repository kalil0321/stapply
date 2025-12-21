import { AppSidebar } from "@/components/app-sidebar";
import { QueryProvider } from "@/components/providers/query";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    return (
        <QueryProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar variant="floating" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex-1 px-4  flex flex-col">{children}</div>
                </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </QueryProvider>
    );
}
