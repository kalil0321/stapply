import { auth as authServer } from "./server";
import { headers } from "next/headers";

export const getUserId = async () => {
    const session = await authServer.api.getSession({
        headers: await headers(),
    });

    return session?.user?.id;
};

export const auth = async () => {
    const session = await authServer.api.getSession({
        headers: await headers(),
    });

    console.log("USER ID RETURNED", session?.user?.id);

    return { userId: session?.user?.id };
};
