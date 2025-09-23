import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/drizzle";
import { users, sessions, accounts, verifications, apikeys } from "@/db/schema";

const RESEND_API_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM_ADDRESS = "Kalil from Stapply <stapply@kalil0321.com>";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            const recipient = user.email;

            if (!recipient) {
                console.warn("sendResetPassword: missing user email", user.id);
                return;
            }

            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
                console.error("sendResetPassword: RESEND_API_KEY not configured");
                return;
            }

            const fromAddress = process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_ADDRESS;
            const subject = "Reset your Stapply password";
            const greeting = user.name ? ` ${user.name}` : "";
            const htmlBody = `<p>Hello${greeting},</p><p>We received a request to reset your Stapply password.</p><p><a href="${url}">Click here to reset your password</a>. This link will expire soon.</p><p>If you did not request this change, you can safely ignore this email.</p>`;

            try {
                const response = await fetch(RESEND_API_ENDPOINT, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: fromAddress,
                        to: recipient,
                        subject,
                        html: htmlBody,
                    }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(
                        "sendResetPassword: failed to send email",
                        response.status,
                        errorBody
                    );
                }
            } catch (error) {
                console.error("sendResetPassword: failed to send email", error);
            }
        },
        requireEmailVerification: true,
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
