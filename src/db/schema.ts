import {
    boolean,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
    vector,
    integer,
    numeric,
    foreignKey,
    pgSchema,
    index,
    bigint,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { SearchMetadata } from "@/lib/types";

export const searches = pgTable("searches", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    userId: text("user_id").notNull(),
    query: text("query").notNull(),
    metadata: jsonb("metadata").$type<SearchMetadata>(),
    description: text("description"),
    status: text("status")
        .notNull()
        .default("in-progress")
        .$type<
            "in-progress" | "validating" | "query" | "data_validation" | "done"
        >(),
    createdAt: timestamp("created_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    valid: boolean("valid").notNull().default(true),
    enhancedQuery: text("enhanced_query"),
    embedding: vector("embedding", { dimensions: 1536 }),
    sqlQuery: text("sql_query"),
    privateMetadata: jsonb("private_metadata"), // for internal use and metrics (price, time, etc.)
}).enableRLS();

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
    addedByUser: boolean("added_by_user").default(false),
    isActive: boolean("is_active").notNull().default(true),
    embedding: vector("embedding", { dimensions: 1536 }),
    postedAt: timestamp("posted_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    source: text("source"),
    // Additional fields from existing database
    remote: boolean("remote"),
    wfh: boolean("wfh"),
    applicationUrl: text("application_url"),
    language: text("language"),
    titleVec: vector("title_vec", { dimensions: 1536 }),
    verifiedAt: timestamp("verified_at", { mode: "string" }),
    lon: numeric("lon"),
    lat: numeric("lat"),
    country: text("country"),
    point: text("point"), // Could be a geometry type if using PostGIS
    salaryMin: numeric("salary_min"),
    salaryMax: numeric("salary_max"),
    salaryCurrency: text("salary_currency"),
    salaryPeriod: text("salary_period"),
}).enableRLS();

// Junction table to store which jobs were returned for each search
export const searchResults = pgTable(
    "search_results",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuid_generate_v4()`)
            .notNull(),
        searchId: uuid("search_id").notNull(),
        jobId: uuid("job_id").notNull(),
        similarityScore: numeric("similarity_score"),
        relevanceScore: integer("relevance_score"),
        status: text("status")
            .notNull()
            .default("pending")
            .$type<"pending" | "valid" | "invalid" | "partial">(),
        reason: text("reason"),
        source: text("source"),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.searchId],
            foreignColumns: [searches.id],
            name: "search_results_search_id_fkey",
        })
            .onUpdate("cascade")
            .onDelete("cascade"),
        foreignKey({
            columns: [table.jobId],
            foreignColumns: [jobs.id],
            name: "search_results_job_id_fkey",
        })
            .onUpdate("cascade")
            .onDelete("cascade"),
    ]
).enableRLS();

// Table to store user's saved/bookmarked jobs
export const savedJobs = pgTable(
    "saved_jobs",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuid_generate_v4()`)
            .notNull(),
        userId: text("user_id").notNull(),
        jobId: uuid("job_id").notNull(),
        notes: text("notes"),
        status: text("status").default("interested"),
        createdAt: timestamp("created_at", { mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.jobId],
            foreignColumns: [jobs.id],
            name: "saved_jobs_job_id_fkey",
        })
            .onUpdate("cascade")
            .onDelete("cascade"),
    ]
).enableRLS();

// Table for live search tasks using BrowserUse
export const liveSearches = pgTable("live_searches", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    userId: text("user_id").notNull(),
    query: text("query").notNull(),
    status: text("status")
        .notNull()
        .default("pending")
        .$type<"pending" | "in_progress" | "completed" | "failed" | "stopped">(),
    browserTaskId: text("browser_task_id"), // BrowserUse task ID
    agentLogs: jsonb("agent_logs").$type<string[]>().default([]),
    results: jsonb("results").$type<any[]>().default([]),
    error: text("error"), // Error message if failed
    createdAt: timestamp("created_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    completedAt: timestamp("completed_at", { mode: "string" }),
}).enableRLS();

export const applications = pgTable("applications", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`)
        .notNull(),
    userId: text("user_id").notNull(),
    jobId: uuid("job_id")
        .notNull()
        .references(() => jobs.id),
    taskId: text("task_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
        .defaultNow()
        .notNull(),
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

/* BetterAuth Schema */
export const betterAuth = pgSchema("better_auth");

export const users = betterAuth
    .table("users", {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        email: text("email").notNull().unique(),
        emailVerified: boolean("email_verified")
            .$defaultFn(() => false)
            .notNull(),
        image: text("image"),
        createdAt: timestamp("created_at")
            .$defaultFn(() => /* @__PURE__ */ new Date())
            .notNull(),
        updatedAt: timestamp("updated_at")
            .$defaultFn(() => /* @__PURE__ */ new Date())
            .notNull(),
        isAnonymous: boolean("is_anonymous"),
        role: text("role"),
        banned: boolean("banned"),
        banReason: text("ban_reason"),
        banExpires: timestamp("ban_expires"),
    })
    .enableRLS();

export const sessions = betterAuth
    .table("sessions", {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").notNull(),
        updatedAt: timestamp("updated_at").notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        impersonatedBy: text("impersonated_by"),
    })
    .enableRLS();

export const accounts = betterAuth
    .table("accounts", {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").notNull(),
        updatedAt: timestamp("updated_at").notNull(),
    })
    .enableRLS();

export const verifications = betterAuth
    .table("verifications", {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").$defaultFn(
            () => /* @__PURE__ */ new Date()
        ),
        updatedAt: timestamp("updated_at").$defaultFn(
            () => /* @__PURE__ */ new Date()
        ),
    })
    .enableRLS();

export const apikeys = betterAuth
    .table("apikeys", {
        id: text("id").primaryKey(),
        name: text("name"),
        start: text("start"),
        prefix: text("prefix"),
        key: text("key").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        refillInterval: integer("refill_interval"),
        refillAmount: integer("refill_amount"),
        lastRefillAt: timestamp("last_refill_at"),
        enabled: boolean("enabled").default(true),
        rateLimitEnabled: boolean("rate_limit_enabled").default(true),
        rateLimitTimeWindow: bigint("rate_limit_time_window", {
            mode: "number",
        }).default(86400000),
        rateLimitMax: integer("rate_limit_max").default(3),
        requestCount: integer("request_count"),
        remaining: integer("remaining"),
        lastRequest: timestamp("last_request"),
        expiresAt: timestamp("expires_at"),
        createdAt: timestamp("created_at").notNull(),
        updatedAt: timestamp("updated_at").notNull(),
        permissions: text("permissions"),
        metadata: text("metadata"),
    })
    .enableRLS();
