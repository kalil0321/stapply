import { LOCAL_SESSION } from "./local";

type AuthError = {
    error: {
        message: string;
    };
};

type AuthCallback = {
    onError?: (ctx: AuthError) => void;
};

type LocalSession = typeof LOCAL_SESSION;
type UseSessionResult = {
    data: LocalSession | null;
    isPending: boolean;
    error: Error | null;
    refetch: () => Promise<{ data: LocalSession | null }>;
};

const maybeRedirect = (payload: Record<string, unknown>) => {
    if (typeof window === "undefined") {
        return;
    }
    const callbackURL = payload.callbackURL;
    if (typeof callbackURL === "string" && callbackURL.length > 0) {
        window.location.assign(callbackURL);
    }
};

export const authClient = {
    getLastUsedLoginMethod: () => null,
    signIn: {
        email: async (
            _payload: Record<string, unknown>,
            _callbacks?: AuthCallback
        ) => {
            maybeRedirect(_payload);
            return LOCAL_SESSION;
        },
        social: async (
            _payload: Record<string, unknown>,
            _callbacks?: AuthCallback
        ) => {
            maybeRedirect(_payload);
            return LOCAL_SESSION;
        },
    },
    signUp: {
        email: async (
            _payload: Record<string, unknown>,
            _callbacks?: AuthCallback
        ) => {
            maybeRedirect(_payload);
            return LOCAL_SESSION;
        },
    },
};

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = async () => undefined;
export const useSession = (): UseSessionResult => ({
    data: LOCAL_SESSION,
    isPending: false,
    error: null,
    refetch: async () => ({ data: LOCAL_SESSION }),
});
