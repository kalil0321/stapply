import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getCookieCache } from "better-auth/cookies";
import { auth } from "@/lib/auth/server";

export async function middleware(request: NextRequest) {
    const session = await getCookieCache(request);

    // Get full session data to check email verification status
    const fullSession = session ? await auth.api.getSession({
        headers: request.headers
    }) : null;

    // Redirect authenticated users away from auth pages
    if (
        session &&
        (request.nextUrl.pathname === "/search" ||
            request.nextUrl.pathname === "/sign-in" ||
            request.nextUrl.pathname === "/sign-up")
    ) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Check if user has an active session but unverified email
    if (fullSession?.user && !fullSession.user.emailVerified) {
        // Allow access to verification page and auth routes
        const allowedPaths = [
            "/verify-email",
            "/sign-out",
            "/api/auth",
        ];
        
        const isAllowedPath = allowedPaths.some(path => 
            request.nextUrl.pathname.startsWith(path)
        );

        if (!isAllowedPath) {
            return NextResponse.redirect(new URL("/verify-email", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
