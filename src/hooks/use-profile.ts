"use client";

import { useState, useEffect, useCallback } from "react";
import {
    UserProfile,
    getUserProfile,
    saveUserProfile,
    hasCompleteProfile,
    clearUserProfile,
    saveResumeToProfile,
    getResumeFromProfile,
    getResumeDataUrl,
    getResumeMetadata,
    removeResumeFromProfile,
    exportProfileData,
    importProfileData,
} from "@/lib/profile-storage";

export function useProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load profile from localStorage
    const loadProfile = useCallback(() => {
        const savedProfile = getUserProfile();
        setProfile(savedProfile);
        setIsLoading(false);
    }, []);

    // Save profile to localStorage
    const saveProfile = useCallback((profileData: Omit<UserProfile, "createdAt" | "updatedAt">) => {
        const success = saveUserProfile(profileData);
        if (success) {
            loadProfile();
        }
        return success;
    }, [loadProfile]);

    // Check if profile is complete
    const isProfileComplete = useCallback(() => {
        return hasCompleteProfile();
    }, []);

    // Clear profile
    const clearProfile = useCallback(() => {
        clearUserProfile();
        loadProfile();
    }, [loadProfile]);

    // Save resume file
    const saveResume = useCallback(async (file: File) => {
        try {
            const success = await saveResumeToProfile(file);
            if (success) {
                loadProfile();
            }
            return success;
        } catch (error) {
            throw error;
        }
    }, [loadProfile]);

    // Get resume file
    const getResume = useCallback(() => {
        return getResumeFromProfile();
    }, []);

    // Get resume data URL for viewing
    const getResumeUrl = useCallback(() => {
        return getResumeDataUrl();
    }, []);

    // Get resume metadata
    const getResumeInfo = useCallback(() => {
        return getResumeMetadata();
    }, []);

    // Remove resume
    const removeResume = useCallback(() => {
        const success = removeResumeFromProfile();
        if (success) {
            loadProfile();
        }
        return success;
    }, [loadProfile]);

    // Export profile data
    const exportProfile = useCallback(() => {
        return exportProfileData();
    }, []);

    // Import profile data
    const importProfile = useCallback((jsonData: string) => {
        const success = importProfileData(jsonData);
        if (success) {
            loadProfile();
        }
        return success;
    }, [loadProfile]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        profile,
        isLoading,
        saveProfile,
        isProfileComplete,
        clearProfile,
        saveResume,
        getResume,
        getResumeUrl,
        getResumeInfo,
        removeResume,
        exportProfile,
        importProfile,
        refreshProfile: loadProfile,
    };
}
