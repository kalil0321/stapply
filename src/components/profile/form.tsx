"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2 } from "lucide-react";
import { SkillInput } from "./skill-input";
import { Experience } from "./experience";
import { Education } from "./education";
import { Language } from "./language";
import { PersonalInfo } from "./personal-info";
import { ProfessionalLinks } from "./professional-links";
import { VisaPreferences } from "./visa-preferences";
import { Button } from "@/components/ui/button";
import { ResumeStatus, ResumeStatusRef } from "./resume-status";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface FormValues {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
    gender?: string;
    summary?: string;
    skills: string[];
    experiences: any[];
    education: any[];
    languages: any[];
    linkedinUrl?: string;
    portfolioUrl?: string;
    githubUrl?: string;
    otherUrl?: string;
    willingToRelocate?: boolean;
    requiresEuVisa?: boolean;
    requiresUkVisa?: boolean;
    requiresChVisa?: boolean;
    requiresOtherVisa?: boolean;
    otherVisaDetails?: string;
    resumeUrl?: string;
    resumeUploaded?: boolean;
}

async function fetchProfile() {
    const res = await fetch("/api/profile");
    if (!res.ok) {
        if (res.status === 404) return {} as FormValues;
        throw new Error("Failed to fetch profile");
    }
    const data = await res.json();
    return data.profile as FormValues;
}

function ProfileFormSkeleton() {
    return (
        <div className="space-y-8">
            {/* Personal Information Section */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Summary Section */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-24 w-full" />
            </section>

            {/* Skills Section */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-full" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-20" />
                    ))}
                </div>
            </section>

            {/* Experience Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Education Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <Skeleton className="h-5 w-28" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Languages Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </section>

            {/* Professional Links Section */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Visa Preferences Section */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-56" />
                <div className="space-y-4">
                    <Skeleton className="h-4 w-40" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-32" />
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            </section>

            {/* Resume Section */}
            <Skeleton className="h-8 w-32" />

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-20" />
            </div>
        </div>
    );
}

export function ProfileForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const resumeStatusRef = useRef<ResumeStatusRef>(null);

    const { data: initialData, isLoading } = useQuery<FormValues>({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    });

    const {
        register,
        handleSubmit,
        control,
        setValue,
        getValues,
        watch,
        formState: { errors },
        reset,
    } = useForm<FormValues>({
        defaultValues: {},
    });

    // Reset form when initial data loads
    useEffect(() => {
        if (initialData && !isLoading) {
            reset(initialData);
        }
    }, [initialData, isLoading, reset]);

    const {
        fields: experienceFields,
        append: appendExperience,
        remove: removeExperience,
    } = useFieldArray({ control, name: "experiences" as const });

    const {
        fields: educationFields,
        append: appendEducation,
        remove: removeEducation,
    } = useFieldArray({ control, name: "education" as const });

    const {
        fields: languageFields,
        append: appendLanguage,
        remove: removeLanguage,
    } = useFieldArray({ control, name: "languages" as const });

    // Handle skill addition
    const addSkill = (skill: string) => {
        const currentSkills = getValues("skills") || [];
        if (!currentSkills.includes(skill)) {
            setValue("skills", [...currentSkills, skill]);
        }
    };

    const removeSkill = (skill: string) => {
        const currentSkills = getValues("skills") || [];
        setValue(
            "skills",
            currentSkills.filter((s: string) => s !== skill)
        );
    };

    // Handle resume data parsing and form auto-fill
    const handleResumeDataParsed = (parsedData: any) => {
        const { data } = parsedData;
        if (!data) return;

        // Create a complete form data object
        const formData: Partial<FormValues> = {};

        // Process each field from parsed data
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "experience" && Array.isArray(value)) {
                    formData.experiences = value.map((exp: any) => exp || {});
                } else if (key === "education" && Array.isArray(value)) {
                    formData.education = value.map((edu: any) => edu || {});
                } else if (key === "skills" && Array.isArray(value)) {
                    formData.skills = value;
                } else {
                    // Handle other form fields
                    if (key !== "experience" && key !== "education") {
                        (formData as any)[key] = value;
                    }
                }
            }
        });

        // Reset the entire form with the parsed data
        reset(formData);
    };

    const saveMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            // First handle resume upload if there's a selected file
            let resumeUrl = data.resumeUrl;

            if (resumeStatusRef.current?.hasFileSelected()) {
                try {
                    const uploadedUrl =
                        await resumeStatusRef.current.uploadResume();
                    resumeUrl = uploadedUrl || undefined;
                } catch (error) {
                    throw new Error("Failed to upload resume");
                }
            }

            // Include the resume URL in the profile data
            const profileData = {
                ...data,
                resumeUrl,
                resumeUploaded: !!resumeUrl,
            };

            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save profile");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            router.replace("/profile");
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            await saveMutation.mutateAsync(data);
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return <ProfileFormSkeleton />;
    }

    return (
        <TooltipProvider>
            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                {/* Personal info */}
                <PersonalInfo register={register} errors={errors} />

                {/* Summary */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium">
                        Professional Summary
                    </h3>
                    <textarea
                        {...register("summary")}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief summary about yourself"
                    />
                </section>

                {/* Skills */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium">Skills</h3>
                    <SkillInput onAddSkill={addSkill} />
                    <div className="flex flex-wrap gap-2">
                        {(watch("skills") || []).map((skill) => (
                            <span
                                key={skill}
                                onClick={() => removeSkill(skill)}
                                className="px-2 py-1 text-xs bg-muted rounded cursor-pointer"
                                title="Remove"
                            >
                                {skill} <X className="inline w-3 h-3 ml-1" />
                            </span>
                        ))}
                    </div>
                </section>

                {/* Experience */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Experience</h3>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => appendExperience({})}
                        >
                            <Plus className="w-4 h-4" /> Add experience
                        </Button>
                    </div>
                    <div className="space-y-6">
                        {experienceFields.map((field: any, index: number) => (
                            <Experience
                                key={field.id}
                                index={index}
                                register={register}
                                onRemove={() => removeExperience(index)}
                                canRemove={experienceFields.length > 1}
                                errors={errors?.experiences?.[index]}
                            />
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Education</h3>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => appendEducation({})}
                        >
                            <Plus className="w-4 h-4" /> Add education
                        </Button>
                    </div>
                    <div className="space-y-6">
                        {educationFields.map((field: any, index: number) => (
                            <Education
                                key={field.id}
                                index={index}
                                register={register}
                                onRemove={() => removeEducation(index)}
                                canRemove={educationFields.length > 1}
                                errors={errors?.education?.[index]}
                            />
                        ))}
                    </div>
                </section>

                {/* Languages */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Languages</h3>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => appendLanguage({})}
                        >
                            <Plus className="w-4 h-4" /> Add language
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {languageFields.map((field: any, index: number) => (
                            <Language
                                key={field.id}
                                index={index}
                                register={register}
                                onRemove={() => removeLanguage(index)}
                                canRemove={languageFields.length > 1}
                                errors={errors?.languages?.[index]}
                            />
                        ))}
                    </div>
                </section>

                {/* Professional links */}
                <ProfessionalLinks register={register} errors={errors} />

                {/* Visa preferences */}
                <VisaPreferences register={register} errors={errors} />

                {/* Resume upload */}
                <ResumeStatus
                    ref={resumeStatusRef}
                    resumeUrl={initialData?.resumeUrl}
                    onResumeDataParsed={handleResumeDataParsed}
                />

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t">
                    <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending && (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        )}
                        Save Profile
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.replace("/profile")}
                    >
                        Cancel
                    </Button>
                </div>

                {/* Save status */}
                {saveMutation.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                            <strong>Save failed:</strong>{" "}
                            {saveMutation.error?.message || "An error occurred"}
                        </p>
                    </div>
                )}
            </form>
        </TooltipProvider>
    );
}
