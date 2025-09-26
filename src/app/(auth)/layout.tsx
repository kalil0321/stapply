import { type Metadata } from "next";
import { FlickeringGrid } from "@/components/background/flickering-grid";

export const metadata: Metadata = {
    title: "Auth - Stapply",
    description: "Authenticate to Stapply",
};

export default async function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative h-screen min-h-screen w-full flex items-center justify-center p-4">
            <FlickeringGrid
                className="absolute inset-0"
                squareSize={4}
                gridGap={6}
                flickerChance={0.3}
                color="rgb(100, 100, 100)"
                maxOpacity={0.2}
            />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
