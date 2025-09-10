import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key
// Only use this on the server side (API routes, server components)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
