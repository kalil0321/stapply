import {
    boolean,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Minimalist jobs table
export const jobs = pgTable("jobs", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    link: text("link").notNull(),
    title: text("title").notNull(),
    location: text("location"),
    company: text("company").notNull(),
    description: text("description"),
    employmentType: text("employment_type"),
    industry: text("industry"),
    salaryMin: numeric("salary_min"),
    salaryMax: numeric("salary_max"),
    salaryCurrency: text("salary_currency"),
    postedAt: timestamp("posted_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    source: text("source"),
}).enableRLS();

// Table to store user's saved/bookmarked jobs
export const savedJobs = pgTable(
    "saved_jobs",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuid_generate_v4()`)
            .notNull(),
        userId: text("user_id").notNull(),
        jobId: uuid("job_id").notNull().references(() => jobs.id),
        notes: text("notes"),
        status: text("status").default("interested"),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    }
).enableRLS();

export const applications = pgTable("applications", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    userId: text("user_id").notNull(),
    jobId: uuid("job_id").notNull().references(() => jobs.id),
    taskId: text("task_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
        .defaultNow()
        .notNull(),
}).enableRLS();

// Table to track external API data fetching for rate limiting
export const apiCache = pgTable("api_cache", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    endpoint: text("endpoint").notNull(),
    lastFetchedAt: timestamp("last_fetched_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
}).enableRLS();

export const profiles = pgTable("profiles", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    userId: text("user_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    location: text("location"),
    nationality: text("nationality"),
    gender: text("gender"),
    linkedinUrl: text("linkedin_url"),
    websiteUrl: text("website_url"),
    githubUrl: text("github_url"),
    resumeUrl: text("resume_url"),
    resumeUploaded: boolean("resume_uploaded").notNull().default(false),
    summary: text("summary"),
    skills: text("skills").array(),
    experience: jsonb("experience"),
    education: jsonb("education"),
    languages: jsonb("languages"),
    willingToRelocate: boolean("willing_to_relocate").notNull().default(false),
    requiresEuVisa: boolean("requires_eu_visa").notNull().default(false),
    requiresUsVisa: boolean("requires_us_visa").notNull().default(false),
    requiresUkVisa: boolean("requires_uk_visa").notNull().default(false),
    requiresChVisa: boolean("requires_ch_visa").notNull().default(false),
    requiresCaVisa: boolean("requires_ca_visa").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
        .defaultNow()
        .notNull(),
}).enableRLS();
