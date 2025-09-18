import { type Metadata } from "next";

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
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            {children}
        </div>
    );
}
