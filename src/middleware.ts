import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getCookieCache } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
    const session = await getCookieCache(request);

    if (
        session &&
        (request.nextUrl.pathname === "/search" ||
            request.nextUrl.pathname === "/sign-in" ||
            request.nextUrl.pathname === "/sign-up")
    ) {
        return NextResponse.redirect(new URL("/", request.url));
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
