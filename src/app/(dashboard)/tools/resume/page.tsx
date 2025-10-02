"use client";

import { useMemo, useRef, useState } from "react";
import { DownloadIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EducationItem {
    institution: string;
    location: string;
    degree: string;
    gpa: string;
    startDate: string;
    endDate: string;
    highlights: string;
}

interface ExperienceItem {
    organization: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string;
}

interface ProjectItem {
    name: string;
    role: string;
    startDate: string;
    endDate: string;
    highlights: string;
}

interface SkillGroup {
    category: string;
    details: string;
}

interface CustomSection {
    title: string;
    content: string;
}

interface ResumeData {
    basics: {
        name: string;
        headline: string;
        email: string;
        phone: string;
        location: string;
        linkedin: string;
        website: string;
    };
    summary: string;
    education: EducationItem[];
    experience: ExperienceItem[];
    projects: ProjectItem[];
    skills: SkillGroup[];
    customSections: CustomSection[];
}

const createEmptyEducation = (): EducationItem => ({
    institution: "",
    location: "",
    degree: "",
    gpa: "",
    startDate: "",
    endDate: "",
    highlights: "",
});

const createEmptyExperience = (): ExperienceItem => ({
    organization: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    highlights: "",
});

const createEmptyProject = (): ProjectItem => ({
    name: "",
    role: "",
    startDate: "",
    endDate: "",
    highlights: "",
});

const createEmptySkillGroup = (): SkillGroup => ({
    category: "",
    details: "",
});

const createEmptyCustomSection = (): CustomSection => ({
    title: "",
    content: "",
});

const createDefaultResume = (): ResumeData => ({
    basics: {
        name: "Alex Johnson",
        headline: "Product-Focused Software Engineer",
        email: "alex.johnson@email.com",
        phone: "(617) 555-0123",
        location: "Cambridge, MA",
        linkedin: "linkedin.com/in/alexjohnson",
        website: "alexjohnson.dev",
    },
    summary:
        "Analytical and collaborative software engineer with experience shipping user-facing products and leading cross-functional teams. Skilled at translating business requirements into resilient, scalable solutions.",
    education: [
        {
            institution: "Harvard University",
            location: "Cambridge, MA",
            degree: "Bachelor of Arts in Computer Science",
            gpa: "GPA: 3.8/4.0 | Dean's List (4 semesters)",
            startDate: "Sept 2019",
            endDate: "May 2023",
            highlights:
                "Honors Thesis on human-centered AI design\nHarvard College Consulting Group — Tech Lead",
        },
    ],
    experience: [
        {
            organization: "Nimbus Labs",
            role: "Software Engineer Intern",
            location: "Boston, MA",
            startDate: "Jun 2022",
            endDate: "Aug 2022",
            highlights:
                "Built a resume parsing microservice with 98% accuracy using NLP and Supabase\nReduced candidate search latency by 35% by optimizing Postgres queries and indexes\nPartnered with Design to launch an analytics dashboard adopted by 8 enterprise clients",
        },
        {
            organization: "Stapply",
            role: "Student Product Manager",
            location: "Cambridge, MA",
            startDate: "Jan 2021",
            endDate: "May 2022",
            highlights:
                "Led a 6-person student team to deliver an interview prep tool for 1,200+ users\nDefined MVP scope, built Figma prototypes, and coordinated usability testing\nImplemented key product metrics and presented roadmap recommendations to leadership",
        },
    ],
    projects: [
        {
            name: "Job Search Copilot",
            role: "Lead Engineer",
            startDate: "2023",
            endDate: "Present",
            highlights:
                "Full-stack web platform helping job seekers automate search workflows\nIntegrated AI copilot to draft tailored outreach emails and resume variants\nImplemented PostgreSQL + Drizzle ORM data model with automated testing pipeline",
        },
    ],
    skills: [
        {
            category: "Technical Skills",
            details:
                "Languages: TypeScript, Python, SQL | Frameworks: Next.js, React, Node.js | Tools: Supabase, AWS, Git, Figma",
        },
        {
            category: "Leadership & Activities",
            details:
                "Harvard Computer Society (President, 2022-23) | Women in Tech (Mentor) | HackHarvard (Operations Lead)",
        },
    ],
    customSections: [
        {
            title: "Awards",
            content:
                "Harvard College Innovation Award (2022)\nFacebook SWE Fellow (2021)\nGrace Hopper Celebration Scholar (2020)",
        },
    ],
});

const printStyles = `
  :root {
    color-scheme: light;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: "Times New Roman", "Times", serif;
    font-size: 11pt;
    color: #111827;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
  }
  .resume-page {
    width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 0.6in 0.75in;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .resume-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .resume-name {
    font-size: 20pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .resume-headline {
    font-weight: 500;
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .resume-contact {
    font-size: 10pt;
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .resume-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .resume-section-title {
    font-weight: 700;
    letter-spacing: 0.14em;
    font-size: 11pt;
    text-transform: uppercase;
    border-bottom: 1px solid #111827;
    padding-bottom: 0.2rem;
  }
  .resume-entry {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .resume-entry-row {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    width: 100%;
  }
  .resume-entry-label {
    font-weight: 600;
  }
  .resume-entry-meta {
    font-style: italic;
  }
  .resume-text {
    line-height: 1.45;
  }
  .resume-list {
    margin: 0;
    padding-left: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .resume-list li::marker {
    font-size: 0.9em;
  }
  .resume-list li {
    line-height: 1.4;
  }
  .resume-skills {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .resume-skill-line {
    line-height: 1.4;
  }
  @media print {
    body {
      margin: 0;
    }
    .resume-page {
      box-shadow: none;
    }
  }
`;

const parseLines = (value: string) =>
    value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

const formatDateRange = (start: string, end: string) => {
    if (!start && !end) return "";
    if (start && !end) return start;
    if (!start && end) return end;
    if (start === end) return start;
    return `${start} – ${end}`;
};

export default function ResumeBuilderPage() {
    const [resume, setResume] = useState<ResumeData>(() => createDefaultResume());
    const resumeRef = useRef<HTMLDivElement>(null);

    const contactItems = useMemo(() => {
        const { email, phone, location, linkedin, website } = resume.basics;
        return [email, phone, location, linkedin, website].filter(Boolean);
    }, [resume.basics]);

    const handleDownload = () => {
        if (!resumeRef.current) return;
        const printWindow = window.open("", "_blank", "width=900,height=1200");
        if (!printWindow) {
            return;
        }
        const resumeMarkup = resumeRef.current.outerHTML;
        printWindow.document.write(`<!DOCTYPE html><html><head><title>${resume.basics.name} — Resume</title><style>${printStyles}</style></head><body>`);
        printWindow.document.write(resumeMarkup);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const resetResume = () => {
        setResume(createDefaultResume());
    };

    const updateBasics = (field: keyof ResumeData["basics"], value: string) => {
        setResume((prev) => ({
            ...prev,
            basics: {
                ...prev.basics,
                [field]: value,
            },
        }));
    };

    const updateEducation = (
        index: number,
        field: keyof EducationItem,
        value: string,
    ) => {
        setResume((prev) => ({
            ...prev,
            education: prev.education.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const updateExperience = (
        index: number,
        field: keyof ExperienceItem,
        value: string,
    ) => {
        setResume((prev) => ({
            ...prev,
            experience: prev.experience.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const updateProject = (
        index: number,
        field: keyof ProjectItem,
        value: string,
    ) => {
        setResume((prev) => ({
            ...prev,
            projects: prev.projects.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const updateSkillGroup = (
        index: number,
        field: keyof SkillGroup,
        value: string,
    ) => {
        setResume((prev) => ({
            ...prev,
            skills: prev.skills.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const updateCustomSection = (
        index: number,
        field: keyof CustomSection,
        value: string,
    ) => {
        setResume((prev) => ({
            ...prev,
            customSections: prev.customSections.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const addEducation = () => {
        setResume((prev) => ({
            ...prev,
            education: [...prev.education, createEmptyEducation()],
        }));
    };

    const removeEducation = (index: number) => {
        setResume((prev) => {
            if (prev.education.length === 1) {
                const next = createEmptyEducation();
                return { ...prev, education: [next] };
            }
            return {
                ...prev,
                education: prev.education.filter((_, i) => i !== index),
            };
        });
    };

    const addExperience = () => {
        setResume((prev) => ({
            ...prev,
            experience: [...prev.experience, createEmptyExperience()],
        }));
    };

    const removeExperience = (index: number) => {
        setResume((prev) => {
            if (prev.experience.length === 1) {
                const next = createEmptyExperience();
                return { ...prev, experience: [next] };
            }
            return {
                ...prev,
                experience: prev.experience.filter((_, i) => i !== index),
            };
        });
    };

    const addProject = () => {
        setResume((prev) => ({
            ...prev,
            projects: [...prev.projects, createEmptyProject()],
        }));
    };

    const removeProject = (index: number) => {
        setResume((prev) => {
            if (prev.projects.length === 1) {
                const next = createEmptyProject();
                return { ...prev, projects: [next] };
            }
            return {
                ...prev,
                projects: prev.projects.filter((_, i) => i !== index),
            };
        });
    };

    const addSkillGroup = () => {
        setResume((prev) => ({
            ...prev,
            skills: [...prev.skills, createEmptySkillGroup()],
        }));
    };

    const removeSkillGroup = (index: number) => {
        setResume((prev) => {
            if (prev.skills.length === 1) {
                const next = createEmptySkillGroup();
                return { ...prev, skills: [next] };
            }
            return {
                ...prev,
                skills: prev.skills.filter((_, i) => i !== index),
            };
        });
    };

    const addCustomSection = () => {
        setResume((prev) => ({
            ...prev,
            customSections: [...prev.customSections, createEmptyCustomSection()],
        }));
    };

    const removeCustomSection = (index: number) => {
        setResume((prev) => ({
            ...prev,
            customSections: prev.customSections.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="flex flex-col gap-6 py-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Resume Builder
                </h1>
                <p className="text-muted-foreground max-w-3xl">
                    Craft a Harvard-style resume that you can customize and export to PDF. Adjust your content on the left and preview the final document on the right before downloading.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact</CardTitle>
                            <CardDescription>
                                Update the headline and contact details that appear at the top of your resume.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        value={resume.basics.name}
                                        onChange={(event) =>
                                            updateBasics("name", event.target.value)
                                        }
                                        placeholder="Jordan Rivera"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="headline">Headline</Label>
                                    <Input
                                        id="headline"
                                        value={resume.basics.headline}
                                        onChange={(event) =>
                                            updateBasics("headline", event.target.value)
                                        }
                                        placeholder="Strategic Operations Leader"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        value={resume.basics.email}
                                        onChange={(event) =>
                                            updateBasics("email", event.target.value)
                                        }
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={resume.basics.phone}
                                        onChange={(event) =>
                                            updateBasics("phone", event.target.value)
                                        }
                                        placeholder="(555) 555-5555"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={resume.basics.location}
                                        onChange={(event) =>
                                            updateBasics("location", event.target.value)
                                        }
                                        placeholder="Boston, MA"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        value={resume.basics.linkedin}
                                        onChange={(event) =>
                                            updateBasics("linkedin", event.target.value)
                                        }
                                        placeholder="linkedin.com/in/you"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="website">Website or portfolio</Label>
                                <Input
                                    id="website"
                                    value={resume.basics.website}
                                    onChange={(event) =>
                                        updateBasics("website", event.target.value)
                                    }
                                    placeholder="yourdomain.com"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>
                                Share a concise professional summary to orient the reader.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Textarea
                                value={resume.summary}
                                onChange={(event) =>
                                    setResume((prev) => ({
                                        ...prev,
                                        summary: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder="Highlight what makes you a unique candidate in 2-3 sentences."
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-2">
                            <CardTitle>Education</CardTitle>
                            <CardDescription>
                                Capture your education history and notable academic achievements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {resume.education.map((education, index) => (
                                <div
                                    key={`education-${index}`}
                                    className="rounded-lg border border-dashed border-border/60 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Entry {index + 1}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeEducation(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                            aria-label="Remove education entry"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`education-institution-${index}`}>
                                                Institution
                                            </Label>
                                            <Input
                                                id={`education-institution-${index}`}
                                                value={education.institution}
                                                onChange={(event) =>
                                                    updateEducation(
                                                        index,
                                                        "institution",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Harvard University"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`education-location-${index}`}>
                                                Location
                                            </Label>
                                            <Input
                                                id={`education-location-${index}`}
                                                value={education.location}
                                                onChange={(event) =>
                                                    updateEducation(
                                                        index,
                                                        "location",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Cambridge, MA"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 mt-3">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`education-degree-${index}`}>
                                                Degree or concentration
                                            </Label>
                                            <Input
                                                id={`education-degree-${index}`}
                                                value={education.degree}
                                                onChange={(event) =>
                                                    updateEducation(
                                                        index,
                                                        "degree",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="B.A. in Computer Science"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`education-gpa-${index}`}>
                                                Honors, GPA, or recognitions
                                            </Label>
                                            <Input
                                                id={`education-gpa-${index}`}
                                                value={education.gpa}
                                                onChange={(event) =>
                                                    updateEducation(
                                                        index,
                                                        "gpa",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="GPA: 3.9/4.0"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 mt-3">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`education-start-${index}`}>
                                                Start date
                                            </Label>
                                            <Input
                                                id={`education-start-${index}`}
                                                value={education.startDate}
                                                onChange={(event) =>
                                                    updateEducation(
                                                        index,
                                                        "startDate",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Sept 2019"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`education-end-${index}`}>
                                                End date
                                            </Label>
                                            <Input
                                                id={`education-end-${index}`}
                                                value={education.endDate}
                                                onChange={(event) =>
                                                    updateEducation(
                                                        index,
                                                        "endDate",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="May 2023"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-col gap-2">
                                        <Label htmlFor={`education-highlights-${index}`}>
                                            Highlights (one per line)
                                        </Label>
                                        <Textarea
                                            id={`education-highlights-${index}`}
                                            value={education.highlights}
                                            onChange={(event) =>
                                                updateEducation(
                                                    index,
                                                    "highlights",
                                                    event.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Dean's List (2020-2023)\nTeaching Fellow, CS50"
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addEducation}>
                                <PlusIcon className="mr-2 size-4" /> Add education
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Experience</CardTitle>
                            <CardDescription>
                                Capture internships, full-time roles, and leadership experience.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {resume.experience.map((experience, index) => (
                                <div
                                    key={`experience-${index}`}
                                    className="rounded-lg border border-dashed border-border/60 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Entry {index + 1}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeExperience(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                            aria-label="Remove experience entry"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`experience-organization-${index}`}>
                                                Organization
                                            </Label>
                                            <Input
                                                id={`experience-organization-${index}`}
                                                value={experience.organization}
                                                onChange={(event) =>
                                                    updateExperience(
                                                        index,
                                                        "organization",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Nimbus Labs"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`experience-role-${index}`}>
                                                Role
                                            </Label>
                                            <Input
                                                id={`experience-role-${index}`}
                                                value={experience.role}
                                                onChange={(event) =>
                                                    updateExperience(
                                                        index,
                                                        "role",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Product Manager"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 mt-3">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`experience-location-${index}`}>
                                                Location
                                            </Label>
                                            <Input
                                                id={`experience-location-${index}`}
                                                value={experience.location}
                                                onChange={(event) =>
                                                    updateExperience(
                                                        index,
                                                        "location",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Boston, MA"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`experience-dates-${index}-start`}>
                                                Start date
                                            </Label>
                                            <Input
                                                id={`experience-dates-${index}-start`}
                                                value={experience.startDate}
                                                onChange={(event) =>
                                                    updateExperience(
                                                        index,
                                                        "startDate",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Jun 2023"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 mt-3">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`experience-dates-${index}-end`}>
                                                End date
                                            </Label>
                                            <Input
                                                id={`experience-dates-${index}-end`}
                                                value={experience.endDate}
                                                onChange={(event) =>
                                                    updateExperience(
                                                        index,
                                                        "endDate",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Aug 2023 or Present"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-col gap-2">
                                        <Label htmlFor={`experience-highlights-${index}`}>
                                            Highlights (one per line)
                                        </Label>
                                        <Textarea
                                            id={`experience-highlights-${index}`}
                                            value={experience.highlights}
                                            onChange={(event) =>
                                                updateExperience(
                                                    index,
                                                    "highlights",
                                                    event.target.value,
                                                )
                                            }
                                            rows={4}
                                            placeholder="Quantify your impact and responsibilities."
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addExperience}>
                                <PlusIcon className="mr-2 size-4" /> Add experience
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Projects</CardTitle>
                            <CardDescription>
                                Showcase independent or academic projects that support your story.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {resume.projects.map((project, index) => (
                                <div
                                    key={`project-${index}`}
                                    className="rounded-lg border border-dashed border-border/60 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Entry {index + 1}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeProject(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                            aria-label="Remove project entry"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`project-name-${index}`}>
                                                Project name
                                            </Label>
                                            <Input
                                                id={`project-name-${index}`}
                                                value={project.name}
                                                onChange={(event) =>
                                                    updateProject(
                                                        index,
                                                        "name",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="AI Career Copilot"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`project-role-${index}`}>
                                                Role or context
                                            </Label>
                                            <Input
                                                id={`project-role-${index}`}
                                                value={project.role}
                                                onChange={(event) =>
                                                    updateProject(
                                                        index,
                                                        "role",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Lead Engineer"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 mt-3">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`project-start-${index}`}>
                                                Start date
                                            </Label>
                                            <Input
                                                id={`project-start-${index}`}
                                                value={project.startDate}
                                                onChange={(event) =>
                                                    updateProject(
                                                        index,
                                                        "startDate",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="2023"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`project-end-${index}`}>
                                                End date
                                            </Label>
                                            <Input
                                                id={`project-end-${index}`}
                                                value={project.endDate}
                                                onChange={(event) =>
                                                    updateProject(
                                                        index,
                                                        "endDate",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Present"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-col gap-2">
                                        <Label htmlFor={`project-highlights-${index}`}>
                                            Highlights (one per line)
                                        </Label>
                                        <Textarea
                                            id={`project-highlights-${index}`}
                                            value={project.highlights}
                                            onChange={(event) =>
                                                updateProject(
                                                    index,
                                                    "highlights",
                                                    event.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Focus on outcomes, metrics, and standout features."
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addProject}>
                                <PlusIcon className="mr-2 size-4" /> Add project
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Skills & Activities</CardTitle>
                            <CardDescription>
                                Group skills, certifications, and leadership activities into concise lines.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {resume.skills.map((skill, index) => (
                                <div
                                    key={`skill-${index}`}
                                    className="rounded-lg border border-dashed border-border/60 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Group {index + 1}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeSkillGroup(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                            aria-label="Remove skill group"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={`skill-category-${index}`}>
                                            Category label
                                        </Label>
                                        <Input
                                            id={`skill-category-${index}`}
                                            value={skill.category}
                                            onChange={(event) =>
                                                updateSkillGroup(
                                                    index,
                                                    "category",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Technical Skills"
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-col gap-2">
                                        <Label htmlFor={`skill-details-${index}`}>
                                            Details
                                        </Label>
                                        <Textarea
                                            id={`skill-details-${index}`}
                                            value={skill.details}
                                            onChange={(event) =>
                                                updateSkillGroup(
                                                    index,
                                                    "details",
                                                    event.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Languages: Python, TypeScript | Tools: AWS, Supabase"
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addSkillGroup}>
                                <PlusIcon className="mr-2 size-4" /> Add skill group
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Sections</CardTitle>
                            <CardDescription>
                                Create optional sections such as awards, volunteer work, or interests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {resume.customSections.map((section, index) => (
                                <div
                                    key={`custom-${index}`}
                                    className="rounded-lg border border-dashed border-border/60 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Section {index + 1}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeCustomSection(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                            aria-label="Remove custom section"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={`custom-title-${index}`}>
                                            Section title
                                        </Label>
                                        <Input
                                            id={`custom-title-${index}`}
                                            value={section.title}
                                            onChange={(event) =>
                                                updateCustomSection(
                                                    index,
                                                    "title",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Awards"
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-col gap-2">
                                        <Label htmlFor={`custom-content-${index}`}>
                                            Content (one per line)
                                        </Label>
                                        <Textarea
                                            id={`custom-content-${index}`}
                                            value={section.content}
                                            onChange={(event) =>
                                                updateCustomSection(
                                                    index,
                                                    "content",
                                                    event.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Hackathon Winner (2022)\nGHC Scholar (2021)"
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addCustomSection}>
                                <PlusIcon className="mr-2 size-4" /> Add custom section
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-4 xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
                    <Card className="flex-1 overflow-hidden">
                        <CardHeader className="flex flex-col gap-3">
                            <CardTitle>Preview</CardTitle>
                            <CardDescription>
                                Review the Harvard-style layout before downloading.
                            </CardDescription>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" onClick={handleDownload}>
                                    <DownloadIcon className="mr-2 size-4" /> Download PDF
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={resetResume}
                                >
                                    <RotateCcwIcon className="mr-2 size-4" /> Reset sample data
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border bg-white shadow-sm">
                                <div
                                    ref={resumeRef}
                                    className="resume-page"
                                    style={{
                                        width: "8.5in",
                                        minHeight: "11in",
                                        margin: "0 auto",
                                        padding: "0.6in 0.75in",
                                        backgroundColor: "white",
                                        color: "#111827",
                                    }}
                                >
                                    <style>{printStyles}</style>
                                    <header className="resume-header">
                                        <div className="resume-name">{resume.basics.name}</div>
                                        {resume.basics.headline && (
                                            <div className="resume-headline">
                                                {resume.basics.headline}
                                            </div>
                                        )}
                                        {contactItems.length > 0 && (
                                            <div className="resume-contact">
                                                {contactItems.map((item, index) => (
                                                    <span key={`${item}-${index}`}>
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </header>

                                    {resume.summary && (
                                        <section className="resume-section">
                                            <h2 className="resume-section-title">
                                                Professional Summary
                                            </h2>
                                            <p className="resume-text">
                                                {resume.summary}
                                            </p>
                                        </section>
                                    )}

                                    {resume.education.some(
                                        (item) =>
                                            item.institution ||
                                            item.degree ||
                                            item.highlights,
                                    ) && (
                                            <section className="resume-section">
                                                <h2 className="resume-section-title">Education</h2>
                                                {resume.education.map((item, index) => {
                                                    const highlights = parseLines(
                                                        item.highlights,
                                                    );
                                                    const dateRange = formatDateRange(
                                                        item.startDate,
                                                        item.endDate,
                                                    );
                                                    if (
                                                        !item.institution &&
                                                        !item.degree &&
                                                        highlights.length === 0
                                                    ) {
                                                        return null;
                                                    }
                                                    return (
                                                        <div
                                                            className="resume-entry"
                                                            key={`education-preview-${index}`}
                                                        >
                                                            <div className="resume-entry-row">
                                                                <span className="resume-entry-label">
                                                                    {item.institution || "Institution"}
                                                                </span>
                                                                <span className="resume-entry-meta">
                                                                    {item.location}
                                                                </span>
                                                            </div>
                                                            <div className="resume-entry-row">
                                                                <span>
                                                                    {item.degree || "Degree"}
                                                                    {item.gpa ? ` | ${item.gpa}` : ""}
                                                                </span>
                                                                <span className="resume-entry-meta">
                                                                    {dateRange}
                                                                </span>
                                                            </div>
                                                            {highlights.length > 0 && (
                                                                <ul className="resume-list">
                                                                    {highlights.map((line, highlightIndex) => (
                                                                        <li key={`education-highlight-${index}-${highlightIndex}`}>
                                                                            {line}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </section>
                                        )}

                                    {resume.experience.some(
                                        (item) =>
                                            item.organization ||
                                            item.role ||
                                            item.highlights,
                                    ) && (
                                            <section className="resume-section">
                                                <h2 className="resume-section-title">Experience</h2>
                                                {resume.experience.map((item, index) => {
                                                    const highlights = parseLines(
                                                        item.highlights,
                                                    );
                                                    const dateRange = formatDateRange(
                                                        item.startDate,
                                                        item.endDate,
                                                    );
                                                    if (
                                                        !item.organization &&
                                                        !item.role &&
                                                        highlights.length === 0
                                                    ) {
                                                        return null;
                                                    }
                                                    return (
                                                        <div
                                                            className="resume-entry"
                                                            key={`experience-preview-${index}`}
                                                        >
                                                            <div className="resume-entry-row">
                                                                <span className="resume-entry-label">
                                                                    {item.organization || "Company"}
                                                                </span>
                                                                <span className="resume-entry-meta">
                                                                    {item.location}
                                                                </span>
                                                            </div>
                                                            <div className="resume-entry-row">
                                                                <span>{item.role || "Role"}</span>
                                                                <span className="resume-entry-meta">
                                                                    {dateRange}
                                                                </span>
                                                            </div>
                                                            {highlights.length > 0 && (
                                                                <ul className="resume-list">
                                                                    {highlights.map((line, highlightIndex) => (
                                                                        <li key={`experience-highlight-${index}-${highlightIndex}`}>
                                                                            {line}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </section>
                                        )}

                                    {resume.projects.some(
                                        (item) =>
                                            item.name ||
                                            item.role ||
                                            item.highlights,
                                    ) && (
                                            <section className="resume-section">
                                                <h2 className="resume-section-title">Projects</h2>
                                                {resume.projects.map((item, index) => {
                                                    const highlights = parseLines(
                                                        item.highlights,
                                                    );
                                                    const dateRange = formatDateRange(
                                                        item.startDate,
                                                        item.endDate,
                                                    );
                                                    if (
                                                        !item.name &&
                                                        highlights.length === 0
                                                    ) {
                                                        return null;
                                                    }
                                                    return (
                                                        <div
                                                            className="resume-entry"
                                                            key={`project-preview-${index}`}
                                                        >
                                                            <div className="resume-entry-row">
                                                                <span className="resume-entry-label">
                                                                    {item.name || "Project"}
                                                                </span>
                                                                <span className="resume-entry-meta">
                                                                    {dateRange}
                                                                </span>
                                                            </div>
                                                            <div className="resume-entry-row">
                                                                <span>{item.role}</span>
                                                            </div>
                                                            {highlights.length > 0 && (
                                                                <ul className="resume-list">
                                                                    {highlights.map((line, highlightIndex) => (
                                                                        <li key={`project-highlight-${index}-${highlightIndex}`}>
                                                                            {line}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </section>
                                        )}

                                    {resume.skills.some(
                                        (item) => item.category || item.details,
                                    ) && (
                                            <section className="resume-section">
                                                <h2 className="resume-section-title">Skills & Activities</h2>
                                                <div className="resume-skills">
                                                    {resume.skills.map((item, index) => {
                                                        if (!item.category && !item.details) {
                                                            return null;
                                                        }
                                                        return (
                                                            <div
                                                                key={`skill-preview-${index}`}
                                                                className="resume-skill-line"
                                                            >
                                                                <span className="resume-entry-label">
                                                                    {item.category}
                                                                </span>
                                                                {item.details && ` — ${item.details}`}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        )}

                                    {resume.customSections.map((section, index) => {
                                        const lines = parseLines(section.content);
                                        if (!section.title && lines.length === 0) {
                                            return null;
                                        }
                                        return (
                                            <section
                                                className="resume-section"
                                                key={`custom-preview-${index}`}
                                            >
                                                <h2 className="resume-section-title">
                                                    {section.title || "Section"}
                                                </h2>
                                                {lines.length > 0 ? (
                                                    <ul className="resume-list">
                                                        {lines.map((line, lineIndex) => (
                                                            <li key={`custom-line-${index}-${lineIndex}`}>
                                                                {line}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="resume-text">
                                                        Add details to this section using the editor.
                                                    </p>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
