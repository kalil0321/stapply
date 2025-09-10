import { OPENAI, GEMINI } from "@/components/icons";
export interface AIModel {
    name: string;
    id: string;
    provider: string;
    icon: React.ReactNode;
    description: string;
    throughput: number;
    price: {
        in: number;
        out: number;
    };
}

export const AI_MODELS: AIModel[] = [
    {
        name: "Gemini 2.5 Flash",
        id: "gemini-2-5-flash-lite",
        provider: "google",
        icon: GEMINI,
        description: "Best ratio of speed and quality",
        throughput: 135.0,
        price: {
            in: 0.1,
            out: 0.4,
        },
    },
    {
        name: "GPT-4-1 Mini",
        id: "gpt-4-1-mini",
        provider: "openai",
        icon: OPENAI,
        description: "Default model",
        throughput: 68.0,
        price: {
            in: 0.4,
            out: 1.6,
        },
    },
    {
        name: "o4 Mini High",
        id: "o4-mini-high",
        provider: "openai",
        icon: OPENAI,
        description: "Smartest model for complex queries",
        throughput: 69.0,
        price: {
            in: 1.1,
            out: 4.4,
        },
    },
    {
        name: "GPT-4.1 Nano",
        id: "gpt-4.1-nano",
        provider: "openai",
        icon: OPENAI,
        description: "Fastest, most cost-effective model",
        throughput: 90.0,
        price: {
            in: 0.1,
            out: 0.4,
        },
    },
    {
        name: "Groq Qwen 3",
        id: "groq-qwen-3",
        provider: "groq",
        icon: null,
        description: "Fastest model. Good for easy queries.",
        throughput: 1000.0,
        price: {
            in: 0.3,
            out: 0.6,
        },
    },
];
