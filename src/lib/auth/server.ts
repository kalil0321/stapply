import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import { users, sessions, accounts, verifications, apikeys } from "@/db/schema";
import { anonymous, admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            // TODO: Implement reset password
        },
        requireEmailVerification: false,
    },
    trustedOrigins: ["http://localhost:3000"],
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        usePlural: true,
        schema: {
            users,
            sessions,
            accounts,
            verifications,
            apikeys,
        },
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
        freshAge: 5 * 60, // 5 minutes
    },
    plugins: [
        // In case I want to add subscriptions to the session
        // customSession(async ({ user, session }) => {
        //     const roles = findUserRoles(session.session.userId);
        //     return {
        //         roles,
        //         user: {
        //             ...user,
        //             newField: "newField",
        //         },
        //         session,
        //     };
        // }),
        nextCookies(),
    ],
});
