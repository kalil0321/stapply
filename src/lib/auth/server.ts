import { LOCAL_SESSION } from "./local";

export const auth = {
    api: {
        getSession: async () => LOCAL_SESSION,
    },
};
