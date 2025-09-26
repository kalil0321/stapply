import { createAuthClient } from "better-auth/react";
import { lastLoginMethodClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [lastLoginMethodClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
