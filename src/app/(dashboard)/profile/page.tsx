"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Trash2, Save, CheckCircle, Upload, FileText, Download, X, AlertCircle, Eye, ExternalLink, Settings, Shield, Lock, Bot, Wand2 } from "lucide-react";
import { GENDER_OPTIONS, PROFICIENCY_LEVELS, COMMON_COUNTRIES, COMMON_LANGUAGES } from "@/lib/profile-constants";
import { useProfile } from "@/hooks/use-profile";
import { UserProfile } from "@/lib/profile-storage";

const defaultProfile: UserProfile = {
    firstName: "",
    lastName: "",
    email: "",
    skills: [],
    languages: [],
    education: [],
    experience: [],
    applicationInstructions: "",
    credentials: {
        linkedin: { email: "", password: "" },
        google: { email: "", password: "" },
        indeed: { email: "", password: "" },
        glassdoor: { email: "", password: "" },
        github: { username: "", password: "" },
    },
};

export default function ProfilePage() {
    const { 
        profile: savedProfile, 
        isLoading, 
        saveProfile, 
        isProfileComplete, 
        saveResume, 
        getResume, 
        getResumeUrl,
        getResumeInfo,
        removeResume,
        exportProfile,
        importProfile 
    } = useProfile();
    
    const [profile, setProfile] = useState<UserProfile>(defaultProfile);
    const [newSkill, setNewSkill] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeError, setResumeError] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState<Partial<UserProfile> | null>(null);
    const [showParseDialog, setShowParseDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (savedProfile) {
            setProfile(savedProfile);
            // Get resume info from profile instead of reconstructing file
            const resumeInfo = getResumeInfo();
            if (resumeInfo) {
                // Create a dummy file object for display purposes
                const dummyFile = new File([], resumeInfo.name, { type: resumeInfo.type });
                Object.defineProperty(dummyFile, 'size', { value: resumeInfo.size });
                Object.defineProperty(dummyFile, 'lastModified', { value: resumeInfo.lastModified });
                setResumeFile(dummyFile);
            } else {
                setResumeFile(null);
            }
        }
    }, [savedProfile, getResumeInfo]);

    const handleInputChange = (field: keyof UserProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !profile.skills?.includes(newSkill.trim())) {
            setProfile(prev => ({
                ...prev,
                skills: [...(prev.skills || []), newSkill.trim()]
            }));
            setNewSkill("");
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
        }));
    };

    const handleAddLanguage = () => {
        setProfile(prev => ({
            ...prev,
            languages: [...(prev.languages || []), { language: "", proficiency: "" }]
        }));
    };

    const handleLanguageChange = (index: number, field: "language" | "proficiency", value: string) => {
        setProfile(prev => ({
            ...prev,
            languages: prev.languages?.map((lang, i) => 
                i === index ? { ...lang, [field]: value } : lang
            ) || []
        }));
    };

    const handleRemoveLanguage = (index: number) => {
        setProfile(prev => ({
            ...prev,
            languages: prev.languages?.filter((_, i) => i !== index) || []
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage("");
        
        try {
            const success = saveProfile(profile);
            if (success) {
                setSaveMessage("Profile saved successfully!");
                setTimeout(() => setSaveMessage(""), 3000);
            } else {
                setSaveMessage("Failed to save profile. Please try again.");
            }
        } catch (error) {
            setSaveMessage("Error saving profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setResumeError("");

        try {
            await saveResume(file);
            setResumeFile(file);
            setSaveMessage("Resume uploaded successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error) {
            setResumeError(error instanceof Error ? error.message : "Failed to upload resume");
        }
    };

    const handleRemoveResume = () => {
        const success = removeResume();
        if (success) {
            setResumeFile(null);
            setSaveMessage("Resume removed successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        }
    };

    const handleExportProfile = () => {
        const data = exportProfile();
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'profile-backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleViewResume = () => {
        const dataUrl = getResumeUrl();
        const resumeInfo = getResumeInfo();
        
        if (dataUrl && resumeInfo) {
            try {
                // Convert data URL to blob
                const byteCharacters = atob(dataUrl.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: resumeInfo.type });
                
                // Create blob URL
                const blobUrl = URL.createObjectURL(blob);
                
                // Handle different file types
                if (resumeInfo.type === 'application/pdf') {
                    // For PDFs, open in new tab
                    const newWindow = window.open(blobUrl, '_blank');
                    if (!newWindow) {
                        setSaveMessage("Popup blocked. Please allow popups or use download instead.");
                        setTimeout(() => setSaveMessage(""), 3000);
                    }
                } else if (resumeInfo.type === 'text/plain') {
                    // For text files, open in new tab
                    window.open(blobUrl, '_blank');
                } else {
                    // For DOC/DOCX files, browsers can't display them, so download instead
                    setSaveMessage("Word documents cannot be previewed. Downloading instead...");
                    setTimeout(() => setSaveMessage(""), 3000);
                    
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = resumeInfo.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                // Clean up the blob URL after some time
                setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                
            } catch (error) {
                console.error("Error viewing resume:", error);
                setSaveMessage("Error opening resume. Please try downloading instead.");
                setTimeout(() => setSaveMessage(""), 3000);
            }
        }
    };

    const handleDownloadResume = () => {
        const dataUrl = getResumeUrl();
        const resumeInfo = getResumeInfo();
        
        if (dataUrl && resumeInfo) {
            try {
                // Convert data URL to blob for better download support
                const byteCharacters = atob(dataUrl.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: resumeInfo.type });
                
                // Create download link
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = resumeInfo.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                
                setSaveMessage("Resume downloaded successfully!");
                setTimeout(() => setSaveMessage(""), 3000);
            } catch (error) {
                console.error("Error downloading resume:", error);
                setSaveMessage("Error downloading resume. Please try again.");
                setTimeout(() => setSaveMessage(""), 3000);
            }
        }
    };

    const handleParseResume = async () => {
        if (!resumeFile) return;

        setIsParsing(true);
        setResumeError("");

        try {
            // Convert file to array buffer
            const arrayBuffer = await resumeFile.arrayBuffer();
            const fileBuffer = Array.from(new Uint8Array(arrayBuffer));

            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileBuffer,
                    filename: resumeFile.name,
                    parseOnly: true,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to parse resume');
            }

            setParsedData(result.data);
            setShowParseDialog(true);
        } catch (error) {
            setResumeError(error instanceof Error ? error.message : "Failed to parse resume");
        } finally {
            setIsParsing(false);
        }
    };

    const handleApplyParsedData = () => {
        if (!parsedData) return;

        // Merge parsed data with existing profile, keeping existing data where available
        const mergedProfile = {
            ...profile,
            ...Object.fromEntries(
                Object.entries(parsedData).filter(([_, value]) => value !== undefined && value !== null && value !== "")
            ),
        };

        setProfile(mergedProfile);
        setShowParseDialog(false);
        setParsedData(null);
        setSaveMessage("Resume data applied to profile! Don't forget to save.");
        setTimeout(() => setSaveMessage(""), 5000);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-6 py-8 max-w-4xl">
                <div className="text-center">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-semibold">Profile & Preferences</h1>
                    {isProfileComplete() && (
                        <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                        Local Storage
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={handleExportProfile} 
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Profile"}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">First Name *</label>
                                <Input
                                    value={profile.firstName}
                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Last Name *</label>
                                <Input
                                    value={profile.lastName}
                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    placeholder="Enter your last name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Email *</label>
                                <Input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Phone</label>
                                <Input
                                    value={profile.phone || ""}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Address</label>
                            <Input
                                value={profile.address || ""}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                placeholder="Enter your address"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">City</label>
                                <Input
                                    value={profile.city || ""}
                                    onChange={(e) => handleInputChange("city", e.target.value)}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">State</label>
                                <Input
                                    value={profile.state || ""}
                                    onChange={(e) => handleInputChange("state", e.target.value)}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Zip Code</label>
                                <Input
                                    value={profile.zipCode || ""}
                                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                                    placeholder="Zip code"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Country</label>
                                <Select value={profile.country || undefined} onValueChange={(value) => handleInputChange("country", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMMON_COUNTRIES.map((country) => (
                                            <SelectItem key={country} value={country}>
                                                {country}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Gender</label>
                                <Select value={profile.gender || undefined} onValueChange={(value) => handleInputChange("gender", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GENDER_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Links */}
                <Card>
                    <CardHeader>
                        <CardTitle>Professional Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">LinkedIn URL</label>
                            <Input
                                value={profile.linkedinUrl || ""}
                                onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">GitHub URL</label>
                            <Input
                                value={profile.githubUrl || ""}
                                onChange={(e) => handleInputChange("githubUrl", e.target.value)}
                                placeholder="https://github.com/yourusername"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Portfolio URL</label>
                            <Input
                                value={profile.portfolioUrl || ""}
                                onChange={(e) => handleInputChange("portfolioUrl", e.target.value)}
                                placeholder="https://yourportfolio.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Resume Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Resume
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Upload your resume for automatic form filling during job applications.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {resumeFile ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="font-medium">{resumeFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(resumeFile.size)} • {resumeFile.type.split('/')[1].toUpperCase()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Uploaded {new Date(resumeFile.lastModified).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleViewResume}
                                            className="text-blue-600 hover:text-blue-700"
                                            title={
                                                resumeFile.type === 'application/pdf' ? 'Open PDF in browser' :
                                                resumeFile.type === 'text/plain' ? 'Open text file in browser' :
                                                'Word documents will be downloaded (cannot preview)'
                                            }
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            {resumeFile.type === 'application/pdf' || resumeFile.type === 'text/plain' ? 'View' : 'Preview'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadResume}
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            Download
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleParseResume}
                                            disabled={isParsing}
                                            className="text-purple-600 hover:text-purple-700"
                                        >
                                            <Wand2 className="w-4 h-4 mr-1" />
                                            {isParsing ? "Parsing..." : "Parse"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="w-4 h-4 mr-1" />
                                            Replace
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRemoveResume}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    No resume uploaded yet
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Resume
                                </Button>
                            </div>
                        )}
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleResumeUpload}
                            className="hidden"
                        />
                        
                        {resumeError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-700 dark:text-red-300">{resumeError}</p>
                            </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                            <p>Supported formats: PDF, DOC, DOCX, TXT</p>
                            <p>Maximum file size: 5MB</p>
                            <p className="mt-1 text-blue-600">
                                🔒 Your resume is stored locally on your device for privacy
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                    <CardHeader>
                        <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add a skill"
                                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                            />
                            <Button onClick={handleAddSkill} variant="outline">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills?.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {skill}
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="ml-1 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Languages */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Languages</CardTitle>
                            <Button onClick={handleAddLanguage} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Language
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile.languages?.map((lang, index) => (
                            <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Language</label>
                                    <Select 
                                        value={lang.language || undefined} 
                                        onValueChange={(value) => handleLanguageChange(index, "language", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMON_LANGUAGES.map((language) => (
                                                <SelectItem key={language} value={language}>
                                                    {language}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Proficiency</label>
                                    <Select 
                                        value={lang.proficiency || undefined} 
                                        onValueChange={(value) => handleLanguageChange(index, "proficiency", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select proficiency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROFICIENCY_LEVELS.map((level) => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={() => handleRemoveLanguage(index)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Professional Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            value={profile.summary || ""}
                            onChange={(e) => handleInputChange("summary", e.target.value)}
                            placeholder="Write a brief summary about yourself, your experience, and career goals..."
                            className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </CardContent>
                </Card>

                {/* Application Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Browser Automation Instructions
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Provide specific instructions for how the browser should apply to jobs on your behalf.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={profile.applicationInstructions || ""}
                            onChange={(e) => handleInputChange("applicationInstructions", e.target.value)}
                            placeholder="Example: Always select 'Remote' for work location preference. If asked about salary, enter '$80,000 - $120,000'. For availability, select 'Available immediately'. Upload resume when prompted and fill cover letter with a brief introduction..."
                            rows={6}
                            className="resize-none"
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                            <p>💡 <strong>Tips:</strong></p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Be specific about form preferences (remote work, salary range, availability)</li>
                                <li>Include instructions for common questions (visa status, relocate willingness)</li>
                                <li>Mention if you want custom cover letters or standard ones</li>
                                <li>Specify any fields to skip or leave blank</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Credentials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Platform Credentials
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Store login credentials for automatic job applications. All data is stored locally and encrypted.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* LinkedIn */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">in</span>
                                </div>
                                <h4 className="font-medium">LinkedIn</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={profile.credentials?.linkedin?.email || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                linkedin: { ...prev.credentials?.linkedin, email: e.target.value, password: prev.credentials?.linkedin?.password || "" }
                                            }
                                        }))}
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        value={profile.credentials?.linkedin?.password || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                linkedin: { ...prev.credentials?.linkedin, password: e.target.value, email: prev.credentials?.linkedin?.email || "" }
                                            }
                                        }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Google */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">G</span>
                                </div>
                                <h4 className="font-medium">Google</h4>
                                <span className="text-xs text-muted-foreground">(for creating accounts)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={profile.credentials?.google?.email || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                google: { ...prev.credentials?.google, email: e.target.value, password: prev.credentials?.google?.password || "" }
                                            }
                                        }))}
                                        placeholder="your.email@gmail.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        value={profile.credentials?.google?.password || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                google: { ...prev.credentials?.google, password: e.target.value, email: prev.credentials?.google?.email || "" }
                                            }
                                        }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Indeed */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">i</span>
                                </div>
                                <h4 className="font-medium">Indeed</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={profile.credentials?.indeed?.email || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                indeed: { ...prev.credentials?.indeed, email: e.target.value, password: prev.credentials?.indeed?.password || "" }
                                            }
                                        }))}
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        value={profile.credentials?.indeed?.password || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                indeed: { ...prev.credentials?.indeed, password: e.target.value, email: prev.credentials?.indeed?.email || "" }
                                            }
                                        }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Glassdoor */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">G</span>
                                </div>
                                <h4 className="font-medium">Glassdoor</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={profile.credentials?.glassdoor?.email || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                glassdoor: { ...prev.credentials?.glassdoor, email: e.target.value, password: prev.credentials?.glassdoor?.password || "" }
                                            }
                                        }))}
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        value={profile.credentials?.glassdoor?.password || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                glassdoor: { ...prev.credentials?.glassdoor, password: e.target.value, email: prev.credentials?.glassdoor?.email || "" }
                                            }
                                        }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* GitHub */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">G</span>
                                </div>
                                <h4 className="font-medium">GitHub</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                <div>
                                    <label className="text-sm font-medium">Username</label>
                                    <Input
                                        value={profile.credentials?.github?.username || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                github: { ...prev.credentials?.github, username: e.target.value, password: prev.credentials?.github?.password || "" }
                                            }
                                        }))}
                                        placeholder="your-username"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        value={profile.credentials?.github?.password || ""}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            credentials: {
                                                ...prev.credentials,
                                                github: { ...prev.credentials?.github, password: e.target.value, username: prev.credentials?.github?.username || "" }
                                            }
                                        }))}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h5 className="font-medium text-blue-900 dark:text-blue-100">Security & Privacy</h5>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                        All credentials are stored locally on your device and never sent to our servers. 
                                        Consider using app-specific passwords where available for enhanced security.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {saveMessage && (
                <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-white ${
                    saveMessage.includes('successfully') || saveMessage.includes('uploaded') 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                }`}>
                    {saveMessage}
                </div>
            )}

            {/* Resume Parse Dialog */}
            <Dialog open={showParseDialog} onOpenChange={setShowParseDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-purple-600" />
                            Resume Parsed Successfully
                        </DialogTitle>
                        <DialogDescription>
                            Review the extracted information below and choose whether to apply it to your profile.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {parsedData && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {parsedData.firstName && (
                                    <div>
                                        <label className="font-medium text-gray-700 dark:text-gray-300">First Name:</label>
                                        <p className="text-gray-900 dark:text-gray-100">{parsedData.firstName}</p>
                                    </div>
                                )}
                                {parsedData.lastName && (
                                    <div>
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Last Name:</label>
                                        <p className="text-gray-900 dark:text-gray-100">{parsedData.lastName}</p>
                                    </div>
                                )}
                                {parsedData.email && (
                                    <div>
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Email:</label>
                                        <p className="text-gray-900 dark:text-gray-100">{parsedData.email}</p>
                                    </div>
                                )}
                                {parsedData.phone && (
                                    <div>
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Phone:</label>
                                        <p className="text-gray-900 dark:text-gray-100">{parsedData.phone}</p>
                                    </div>
                                )}
                                {parsedData.address && (
                                    <div className="md:col-span-2">
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Address:</label>
                                        <p className="text-gray-900 dark:text-gray-100">{parsedData.address}</p>
                                    </div>
                                )}
                            </div>

                            {parsedData.summary && (
                                <div>
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Summary:</label>
                                    <p className="text-gray-900 dark:text-gray-100 text-sm mt-1">{parsedData.summary}</p>
                                </div>
                            )}

                            {parsedData.skills && parsedData.skills.length > 0 && (
                                <div>
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Skills:</label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {parsedData.skills.map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedData.experience && parsedData.experience.length > 0 && (
                                <div>
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Experience:</label>
                                    <div className="space-y-2 mt-1">
                                        {parsedData.experience.map((exp, index) => (
                                            <div key={index} className="border rounded p-2 text-sm">
                                                <p className="font-medium">{exp.position} at {exp.company}</p>
                                                {exp.startDate && exp.endDate && (
                                                    <p className="text-gray-600 dark:text-gray-400">{exp.startDate} - {exp.endDate}</p>
                                                )}
                                                {exp.description && (
                                                    <p className="text-gray-800 dark:text-gray-200 mt-1">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedData.education && parsedData.education.length > 0 && (
                                <div>
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Education:</label>
                                    <div className="space-y-2 mt-1">
                                        {parsedData.education.map((edu, index) => (
                                            <div key={index} className="border rounded p-2 text-sm">
                                                <p className="font-medium">{edu.degree} - {edu.institution}</p>
                                                {edu.fieldOfStudy && (
                                                    <p className="text-gray-600 dark:text-gray-400">{edu.fieldOfStudy}</p>
                                                )}
                                                {edu.startDate && edu.endDate && (
                                                    <p className="text-gray-600 dark:text-gray-400">{edu.startDate} - {edu.endDate}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowParseDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApplyParsedData} className="bg-purple-600 hover:bg-purple-700">
                            Apply to Profile
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
