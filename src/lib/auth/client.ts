import { createAuthClient } from "better-auth/react";
import { lastLoginMethod } from "better-auth/plugins"

export const authClient = createAuthClient({
    plugins: [lastLoginMethod()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
