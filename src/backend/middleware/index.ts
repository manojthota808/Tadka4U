/**
 * Tadka4U Backend Server Middleware
 *
 * Houses SSR request lifecycle middlewares:
 * - attachSupabaseAuth: Attaches active session into TanStack Start server functions
 * - requireSupabaseAuth: Server-side token validation & claims extraction
 * - authenticateCronRequest: Authentication for cron / scheduled tasks
 */

export { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
export {
  requireSupabaseAuth,
  requireSupabaseAuth as createAuthMiddleware,
} from "@/integrations/supabase/auth-middleware";
export {
  authenticateCronRequest,
  authenticateCronRequest as verifyCronSecret,
} from "@/integrations/supabase/cron-auth";
