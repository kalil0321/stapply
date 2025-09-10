"use client";

import { useSearchParams } from "next/navigation";
import { ProfileDisplay } from "./display";
import { ProfileForm } from "./form";

export const Profile = () => {
    const searchParams = useSearchParams();
    const isEditing = searchParams.get("update") === "true";

    return isEditing ? <ProfileForm /> : <ProfileDisplay />;
};
