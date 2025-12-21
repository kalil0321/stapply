import { LOCAL_USER } from "./local";

export const getUserId = async () => {
    return LOCAL_USER.id;
};

export const auth = async () => {
    return { userId: LOCAL_USER.id };
};
