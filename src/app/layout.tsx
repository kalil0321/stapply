import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Stapply",
    description: "Stapply, an AI job search engine that goes beyond search",
    keywords: ["job", "job search", "ai job search", "ai job search engine", "ai job search platform", "ai job search tool", "ai job search software", "ai job search service", "ai job search application", "ai job search website", "ai job search app", "ai job search tool", "ai job search software", "ai job search service", "ai job search application", "ai job search website", "ai job search app"],
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`flex flex-col items-center justify-center min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
