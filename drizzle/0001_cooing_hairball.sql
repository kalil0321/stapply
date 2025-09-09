CREATE TABLE "saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text,
	"description" text,
	"link" text NOT NULL,
	"posted_at" text,
	"source" text,
	"similarity_score" numeric,
	"relevance_score" integer,
	"applied_at" timestamp,
	"application_status" text DEFAULT 'saved',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"date_of_birth" text,
	"gender" text,
	"linkedin_url" text,
	"github_url" text,
	"portfolio_url" text,
	"summary" text,
	"skills" jsonb,
	"languages" jsonb,
	"education" jsonb,
	"experience" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "better_auth"."accounts" CASCADE;--> statement-breakpoint
DROP TABLE "better_auth"."sessions" CASCADE;--> statement-breakpoint
DROP TABLE "better_auth"."users" CASCADE;--> statement-breakpoint
DROP TABLE "better_auth"."verifications" CASCADE;--> statement-breakpoint
ALTER TABLE "search_results" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "searches" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "searches" DROP COLUMN "embedding";--> statement-breakpoint
DROP SCHEMA "better_auth";
