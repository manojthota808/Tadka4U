/**
 * Tadka4U Backend Server Database Client
 *
 * Provides privileged server-side database access using Supabase service role key.
 * Only import and use this within server handlers or server functions.
 */

export { supabaseAdmin } from "@/integrations/supabase/client.server";
