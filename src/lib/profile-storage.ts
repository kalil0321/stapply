"use client";

export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    dateOfBirth?: string;
    gender?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    summary?: string;
    skills?: string[];
    languages?: Array<{language: string, proficiency: string}>;
    education?: Array<{
        institution: string;
        degree: string;
        fieldOfStudy: string;
        startDate: string;
        endDate: string;
        gpa?: string;
        description?: string;
    }>;
    experience?: Array<{
        company: string;
        position: string;
        startDate: string;
        endDate: string;
        description: string;
        location?: string;
    }>;
    resumeFile?: {
        name: string;
        size: number;
        type: string;
        lastModified: number;
        dataUrl: string; // Base64 encoded file data
    };
    // Browser automation settings
    applicationInstructions?: string;
    credentials?: {
        linkedin?: {
            email: string;
            password: string;
        };
        google?: {
            email: string;
            password: string;
        };
        indeed?: {
            email: string;
            password: string;
        };
        glassdoor?: {
            email: string;
            password: string;
        };
        github?: {
            username: string;
            password: string;
        };
    };
    createdAt?: string;
    updatedAt?: string;
}

const PROFILE_KEY = "bu-user-profile";

// Get user profile from localStorage
export function getUserProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;
    
    try {
        const saved = localStorage.getItem(PROFILE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Error loading user profile:", error);
        return null;
    }
}

// Save user profile to localStorage
export function saveUserProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">): boolean {
    if (typeof window === "undefined") return false;
    
    try {
        const existingProfile = getUserProfile();
        const now = new Date().toISOString();
        
        const updatedProfile: UserProfile = {
            ...profile,
            createdAt: existingProfile?.createdAt || now,
            updatedAt: now,
        };
        
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
        return true;
    } catch (error) {
        console.error("Error saving user profile:", error);
        return false;
    }
}

// Check if user has a complete profile
export function hasCompleteProfile(): boolean {
    const profile = getUserProfile();
    if (!profile) return false;
    
    const requiredFields = ["firstName", "lastName", "email"];
    return requiredFields.every(field => 
        profile[field as keyof UserProfile] && 
        String(profile[field as keyof UserProfile]).trim() !== ""
    );
}

// Clear user profile
export function clearUserProfile(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PROFILE_KEY);
}

// Convert file to base64 data URL
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Convert data URL back to File object
export function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): File {
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mimeType });
}

// Save resume file to profile
export async function saveResumeToProfile(file: File): Promise<boolean> {
    try {
        // Validate file type and size first
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error("Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.");
        }
        
        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size must be less than 5MB.");
        }
        
        const dataUrl = await fileToDataUrl(file);
        
        // Get existing profile or create a minimal one
        const existingProfile = getUserProfile();
        const profile = existingProfile || {
            firstName: "",
            lastName: "",
            email: "",
            skills: [],
            languages: [],
            education: [],
            experience: [],
        };
        
        const updatedProfile = {
            ...profile,
            resumeFile: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                dataUrl,
            },
        };
        
        return saveUserProfile(updatedProfile);
    } catch (error) {
        console.error("Error saving resume:", error);
        throw error;
    }
}

// Get resume file from profile
export function getResumeFromProfile(): File | null {
    const profile = getUserProfile();
    if (!profile?.resumeFile) return null;
    
    try {
        return dataUrlToFile(
            profile.resumeFile.dataUrl,
            profile.resumeFile.name,
            profile.resumeFile.type
        );
    } catch (error) {
        console.error("Error retrieving resume:", error);
        return null;
    }
}

// Get resume data URL for viewing/downloading
export function getResumeDataUrl(): string | null {
    const profile = getUserProfile();
    return profile?.resumeFile?.dataUrl || null;
}

// Get resume metadata
export function getResumeMetadata(): {
    name: string;
    size: number;
    type: string;
    lastModified: number;
} | null {
    const profile = getUserProfile();
    if (!profile?.resumeFile) return null;
    
    return {
        name: profile.resumeFile.name,
        size: profile.resumeFile.size,
        type: profile.resumeFile.type,
        lastModified: profile.resumeFile.lastModified,
    };
}

// Remove resume from profile
export function removeResumeFromProfile(): boolean {
    const profile = getUserProfile();
    if (!profile) return false;
    
    const updatedProfile = { ...profile };
    delete updatedProfile.resumeFile;
    
    return saveUserProfile(updatedProfile);
}

// Export profile data (for backup/download)
export function exportProfileData(): string {
    const profile = getUserProfile();
    if (!profile) return "";
    
    return JSON.stringify(profile, null, 2);
}

// Import profile data (from backup/upload)
export function importProfileData(jsonData: string): boolean {
    try {
        const profile = JSON.parse(jsonData) as UserProfile;
        return saveUserProfile(profile);
    } catch (error) {
        console.error("Error importing profile data:", error);
        return false;
    }
}
