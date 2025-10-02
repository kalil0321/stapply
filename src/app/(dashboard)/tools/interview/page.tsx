"use client";

import { useMemo, useState } from "react";
import {
    BrainIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    MessageSquareIcon,
    SparklesIcon,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ChecklistItem {
    id: string;
    title: string;
    helper: string;
    completed: boolean;
}

interface SessionFormState {
    date: string;
    focus: string;
    notes: string;
}

interface PracticeSession extends SessionFormState {
    id: string;
}

const initialChecklist: ChecklistItem[] = [
    {
        id: "story",
        title: "Refresh your personal narrative",
        helper: "Draft a 60-90 second elevator pitch that highlights your impact.",
        completed: false,
    },
    {
        id: "research",
        title: "Research the company and role",
        helper: "Capture 3 product insights, recent news, and why the team excites you.",
        completed: false,
    },
    {
        id: "examples",
        title: "Curate STAR stories",
        helper: "Select 4-5 achievements with measurable outcomes.",
        completed: false,
    },
    {
        id: "questions",
        title: "Prepare thoughtful questions",
        helper: "Draft questions for your interviewer about strategy, team, and success metrics.",
        completed: false,
    },
];

const questionCategories = [
    {
        id: "behavioral",
        label: "Behavioral",
        icon: <MessageSquareIcon className="size-4" />,
        description: "Focus on stories that demonstrate leadership, collaboration, and resilience.",
        questions: [
            {
                prompt: "Tell me about a time you had to influence without authority.",
                guidance:
                    "Set the scene quickly, emphasize the stakeholders involved, outline your actions, and quantify the impact.",
            },
            {
                prompt: "Describe a project that challenged you recently.",
                guidance:
                    "Highlight the complexity, how you structured the problem, and what changed because of your contribution.",
            },
            {
                prompt: "How do you handle competing priorities?",
                guidance:
                    "Share a specific example where you triaged requests, aligned stakeholders, and delivered results.",
            },
        ],
    },
    {
        id: "product",
        label: "Product Sense",
        icon: <SparklesIcon className="size-4" />,
        description: "Demonstrate structured thinking, user empathy, and analytical rigor.",
        questions: [
            {
                prompt: "How would you improve our onboarding experience?",
                guidance:
                    "Frame the problem, define success metrics, propose hypotheses, and recommend experiments.",
            },
            {
                prompt: "Walk me through launching a new feature for power users.",
                guidance:
                    "Discuss discovery, prioritization, measurement, and go-to-market coordination.",
            },
            {
                prompt: "What metric would you monitor first if sign-ups dropped 20%?",
                guidance:
                    "Explain your diagnostic approach, data sources, and how you'd align with stakeholders.",
            },
        ],
    },
    {
        id: "technical",
        label: "Technical",
        icon: <BrainIcon className="size-4" />,
        description: "Clarify requirements, articulate trade-offs, and communicate your solution path.",
        questions: [
            {
                prompt: "Design a service to ingest resumes and expose a search API.",
                guidance:
                    "Discuss data models, ingestion pipelines, indexing strategy, and latency considerations.",
            },
            {
                prompt: "Explain an architecture decision you're proud of.",
                guidance:
                    "Share constraints, the options you explored, and what performance gains you achieved.",
            },
            {
                prompt: "Walk me through debugging a production incident you led.",
                guidance:
                    "Highlight detection, triage, communication, resolution, and long-term remediation.",
            },
        ],
    },
];

const resources = [
    {
        title: "Interview question log",
        description:
            "Capture new questions after each conversation to refine your stories and follow-ups.",
        link: "https://docs.google.com/spreadsheets/",
    },
    {
        title: "Story mapping template",
        description: "Map each STAR example to the competencies interviewers will assess.",
        link: "https://miro.com/",
    },
    {
        title: "Peer mock interview network",
        description: "Share availability and pair with peers for weekly practice sessions.",
        link: "https://www.pramp.com/",
    },
];

const createEmptySession = (): SessionFormState => ({
    date: "",
    focus: "",
    notes: "",
});

const generateSessionId = () =>
    `session-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

export default function InterviewToolsPage() {
    const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
    const [sessions, setSessions] = useState<PracticeSession[]>([]);
    const [sessionForm, setSessionForm] = useState<SessionFormState>(createEmptySession);

    const completedCount = useMemo(
        () => checklist.filter((item) => item.completed).length,
        [checklist],
    );

    const toggleChecklistItem = (id: string) => {
        setChecklist((previous) =>
            previous.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item,
            ),
        );
    };

    const updateSessionForm = (field: keyof SessionFormState, value: string) => {
        setSessionForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const addPracticeSession = () => {
        if (!sessionForm.date || !sessionForm.focus) {
            return;
        }
        setSessions((prev) => [
            ...prev,
            {
                id: generateSessionId(),
                ...sessionForm,
            },
        ]);
        setSessionForm(createEmptySession());
    };

    const removeSession = (id: string) => {
        setSessions((prev) => prev.filter((session) => session.id !== id));
    };

    return (
        <div className="flex flex-col gap-6 py-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Interview Prep Studio
                </h1>
                <p className="text-muted-foreground max-w-3xl">
                    Plan your practice loops, organize stories, and walk into every conversation with confidence. These tools pair well with the resume builder and will evolve into a full interview workspace.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="flex flex-col gap-3">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <CheckCircleIcon className="size-5 text-primary" />
                                Interview prep checklist
                            </CardTitle>
                            <CardDescription>
                                Progress through the core preparation steps. Customize or duplicate tasks as needed.
                            </CardDescription>
                            <div className="text-sm font-medium text-muted-foreground">
                                {completedCount} of {checklist.length} complete
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {checklist.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-1 rounded-lg border border-border/60 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id={`check-${item.id}`}
                                            checked={item.completed}
                                            onCheckedChange={() => toggleChecklistItem(item.id)}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor={`check-${item.id}`} className="text-base font-semibold">
                                                {item.title}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {item.helper}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-3">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <SparklesIcon className="size-5 text-primary" />
                                Question workshop
                            </CardTitle>
                            <CardDescription>
                                Practice with curated prompts. Use the guidance column to keep your answers concise and outcome-driven.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Tabs defaultValue={questionCategories[0].id}>
                                <TabsList>
                                    {questionCategories.map((category) => (
                                        <TabsTrigger key={category.id} value={category.id}>
                                            {category.icon}
                                            {category.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {questionCategories.map((category) => (
                                    <TabsContent key={category.id} value={category.id}>
                                        <div className="rounded-xl border border-dashed border-border/60 p-4">
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                            <div className="flex flex-col gap-4">
                                                {category.questions.map((question, index) => (
                                                    <div
                                                        key={`${category.id}-${index}`}
                                                        className="rounded-lg bg-muted/50 p-4"
                                                    >
                                                        <p className="font-medium">
                                                            {question.prompt}
                                                        </p>
                                                        <p className="mt-2 text-sm text-muted-foreground">
                                                            {question.guidance}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-6 xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
                    <Card className="flex-1">
                        <CardHeader className="flex flex-col gap-3">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <CalendarDaysIcon className="size-5 text-primary" />
                                Practice sessions
                            </CardTitle>
                            <CardDescription>
                                Book time with yourself or a partner. Tracking your reps keeps momentum high.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid gap-3">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="session-date">Date</Label>
                                    <Input
                                        id="session-date"
                                        type="date"
                                        value={sessionForm.date}
                                        onChange={(event) =>
                                            updateSessionForm("date", event.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="session-focus">Focus area</Label>
                                    <Input
                                        id="session-focus"
                                        value={sessionForm.focus}
                                        onChange={(event) =>
                                            updateSessionForm("focus", event.target.value)
                                        }
                                        placeholder="Mock interview with Sarah"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="session-notes">Notes</Label>
                                    <Textarea
                                        id="session-notes"
                                        value={sessionForm.notes}
                                        onChange={(event) =>
                                            updateSessionForm("notes", event.target.value)
                                        }
                                        rows={3}
                                        placeholder="Goals, question types, feedback to collect"
                                    />
                                </div>
                            </div>
                            <Button type="button" onClick={addPracticeSession}>
                                Schedule session
                            </Button>

                            {sessions.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                                        Upcoming practice
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="rounded-lg border border-border/60 p-4"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                            {new Date(session.date).toLocaleDateString(undefined, {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                        <span className="text-base font-medium">
                                                            {session.focus}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeSession(session.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                {session.notes && (
                                                    <p className="mt-3 text-sm text-muted-foreground">
                                                        {session.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Add your first session to keep track of practice reps and commitments.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-3">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <BrainIcon className="size-5 text-primary" />
                                Go-to resources
                            </CardTitle>
                            <CardDescription>
                                Curated tools to accelerate your prep. Share your favorites with the team and we can add them here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {resources.map((resource) => (
                                <div
                                    key={resource.title}
                                    className="rounded-lg border border-border/60 p-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-base font-semibold">
                                                {resource.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {resource.description}
                                            </p>
                                        </div>
                                        <Button asChild variant="outline">
                                            <a href={resource.link} target="_blank" rel="noreferrer">
                                                Open
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
