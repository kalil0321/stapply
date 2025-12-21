import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const CSV_URL = "https://map.stapply.ai/ai.csv";
const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedJobs: {
    data: ReturnType<typeof buildJobs>;
    fetchedAt: number;
} | null = null;

type CsvRow = Record<string, string>;

const parseCSV = (csvText: string): CsvRow[] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i += 1) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === "\"") {
            if (inQuotes && nextChar === "\"") {
                field += "\"";
                i += 1;
                continue;
            }
            inQuotes = !inQuotes;
            continue;
        }

        if (!inQuotes && (char === "\n" || char === "\r")) {
            if (char === "\r" && nextChar === "\n") {
                i += 1;
            }
            row.push(field);
            field = "";
            if (row.some((cell) => cell.trim().length > 0)) {
                rows.push(row);
            }
            row = [];
            continue;
        }

        if (!inQuotes && char === ",") {
            row.push(field);
            field = "";
            continue;
        }

        field += char;
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        if (row.some((cell) => cell.trim().length > 0)) {
            rows.push(row);
        }
    }

    if (rows.length === 0) {
        return [];
    }

    const headers = rows[0].map((header) =>
        header.trim().replace(/^"|"$/g, "")
    );

    return rows.slice(1).map((line) => {
        const record: CsvRow = {};
        headers.forEach((header, index) => {
            record[header] = (line[index] || "").trim().replace(/^"|"$/g, "");
        });
        return record;
    });
};

const parseSalaryRange = (
    salaryStr: string
): { min: number | null; max: number | null } => {
    const match = salaryStr.match(
        /\$?(\d+(?:\.\d+)?)K?\s*-\s*\$?(\d+(?:\.\d+)?)K?/i
    );
    if (!match) {
        return { min: null, max: null };
    }
    const min = parseFloat(match[1]) * (salaryStr.includes("K") ? 1000 : 1);
    const max = parseFloat(match[2]) * (salaryStr.includes("K") ? 1000 : 1);
    return { min, max };
};

const buildJobs = (rows: CsvRow[]) =>
    rows
        .filter((row) => row.title && row.company && row.url)
        .map((row, index) => {
            const salary = row.salary_summary
                ? parseSalaryRange(row.salary_summary)
                : { min: null, max: null };

            return {
                id: `${row.url}-${index}`,
                link: row.url,
                title: row.title,
                location: row.location || undefined,
                company: row.company,
                description: row.salary_summary || undefined,
                employmentType: "Full-time",
                industry: "AI/ML",
                postedAt: row.posted_at || undefined,
                salaryMin: salary.min,
                salaryMax: salary.max,
                salaryCurrency: row.salary_currency || "USD",
                source: "local",
            };
        });

const normalize = (value: string | undefined) =>
    (value || "").trim().toLowerCase();

const matchesQuery = (value: string | undefined, query: string) =>
    normalize(value).includes(query);

const filterJobs = (
    jobs: ReturnType<typeof buildJobs>,
    query: string,
    location: string,
    company: string
) => {
    const normalizedQuery = normalize(query);
    const normalizedLocation = normalize(location);
    const normalizedCompany = normalize(company);

    if (!normalizedQuery && !normalizedLocation && !normalizedCompany) {
        return jobs;
    }

    return jobs.filter((job) => {
        if (normalizedQuery) {
            const queryMatch =
                matchesQuery(job.title, normalizedQuery) ||
                matchesQuery(job.company, normalizedQuery) ||
                matchesQuery(job.location, normalizedQuery) ||
                matchesQuery(job.description, normalizedQuery);
            if (!queryMatch) {
                return false;
            }
        }

        if (normalizedLocation && !matchesQuery(job.location, normalizedLocation)) {
            return false;
        }

        if (normalizedCompany && !matchesQuery(job.company, normalizedCompany)) {
            return false;
        }

        return true;
    });
};

const getCachedJobs = async () => {
    const now = Date.now();
    if (cachedJobs && now - cachedJobs.fetchedAt < CACHE_TTL_MS) {
        return cachedJobs.data;
    }

    const filePath = resolve(process.cwd(), "data", "ai.csv");
    const csvText = await readFile(filePath, "utf-8");
    const rows = parseCSV(csvText);
    const data = buildJobs(rows);

    cachedJobs = { data, fetchedAt: now };
    return data;
};

export const GET = async (request: Request) => {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get("q") || "";
        const location = url.searchParams.get("location") || "";
        const company = url.searchParams.get("company") || "";
        const pageParam = Number(url.searchParams.get("page") || "0");
        const limitParam = url.searchParams.get("limit");
        const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;

        // If limit is "all" or not provided and page is 0, return all jobs
        const returnAll = limitParam === "all" || (!limitParam && page === 0);
        const limit = returnAll
            ? Infinity
            : Number.isFinite(Number(limitParam)) && Number(limitParam) > 0
                ? Math.min(Number(limitParam), 50000)
                : 60;
        const offset = returnAll ? 0 : page * limit;

        const jobs = await getCachedJobs();
        const filteredJobs = filterJobs(jobs, query, location, company);
        const slice = returnAll
            ? filteredJobs
            : filteredJobs.slice(offset, offset + limit);

        return NextResponse.json({
            jobs: slice,
            total: filteredJobs.length,
            page: returnAll ? 0 : page,
            pageSize: returnAll ? filteredJobs.length : limit,
            cached: true,
        });
    } catch (error) {
        console.error("Error fetching external jobs:", error);
        return NextResponse.json(
            { error: "Failed to fetch jobs" },
            { status: 500 }
        );
    }
};
