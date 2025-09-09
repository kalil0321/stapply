import {
    boolean,
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    numeric,
    foreignKey,
    jsonb,
} from "drizzle-orm/pg-core";

export const searches = pgTable("searches", {
    id: uuid("id")
        .primaryKey()
        .defaultRandom()
        .notNull(),
    userId: text("user_id").notNull(),
    query: text("query").notNull(),
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
}).enableRLS();

// Junction table to store which jobs were returned for each search
export const searchResults = pgTable(
    "search_results",
    {
        id: uuid("id")
            .primaryKey()
            .defaultRandom()
            .notNull(),
        searchId: uuid("search_id").notNull(),
        link: text("link").notNull(),
        title: text("title").notNull(),
        location: text("location"),
        company: text("company").notNull(),
        description: text("description"),
        postedAt: timestamp("posted_at", { mode: "string" }),
        createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
        source: text("source"),
        similarityScore: numeric("similarity_score"),
        relevanceScore: integer("relevance_score"),
        status: text("status")
            .notNull()
            .default("pending")
            .$type<"pending" | "valid" | "invalid" | "partial">(),
        reason: text("reason"),
    },
    (table) => [
        foreignKey({
            columns: [table.searchId],
            foreignColumns: [searches.id],
            name: "search_results_search_id_fkey",
        })
            .onUpdate("cascade")
            .onDelete("cascade"),
    ]
).enableRLS();

export const profiles = pgTable("user_profiles", {
    id: uuid("id")
        .primaryKey()
        .defaultRandom()
        .notNull(),
    userId: text("user_id").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
    country: text("country"),
    dateOfBirth: text("date_of_birth"),
    gender: text("gender"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    portfolioUrl: text("portfolio_url"),
    summary: text("summary"),
    skills: jsonb("skills"),
    languages: jsonb("languages"),
    education: jsonb("education"),
    experience: jsonb("experience"),
    createdAt: timestamp("created_at", { mode: "string" })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
        .defaultNow()
        .notNull(),
}).enableRLS();