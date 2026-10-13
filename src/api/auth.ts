import { supabase, lovable } from "./client";
import type { User, Session } from "./types";

export const authApi = {
  /**
   * Retrieves the current user's active session.
   */
  getSession: async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },

  /**
   * Subscribes to authentication state changes.
   */
  onAuthStateChange: (
    callback: (user: User | null, session: Session | null) => void,
  ) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null, session ?? null);
    });
    return () => data.subscription.unsubscribe();
  },

  /**
   * Signs in an existing user with email and password.
   */
  signInWithEmail: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Signs up a new user with email and password.
   */
  signUpWithEmail: async (
    email: string,
    password: string,
    redirectUrl?: string,
  ) => {
    const emailRedirectTo =
      redirectUrl ??
      (typeof window !== "undefined" ? window.location.origin : undefined);
    return supabase.auth.signUp({
      email,
      password,
      ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
    });
  },

  /**
   * Initiates Google OAuth sign in via Lovable Auth integration.
   */
  signInWithGoogle: async (redirectUri?: string) => {
    const targetOrigin =
      redirectUri ??
      (typeof window !== "undefined" ? window.location.origin : "");
    return lovable.auth.signInWithOAuth("google", {
      redirect_uri: targetOrigin,
    });
  },

  /**
   * Sends a password reset email.
   */
  resetPasswordForEmail: async (email: string, redirectTo?: string) => {
    const defaultRedirect =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;
    const target = redirectTo ?? defaultRedirect;
    return supabase.auth.resetPasswordForEmail(
      email,
      target ? { redirectTo: target } : {},
    );
  },

  /**
   * Updates user's password once authenticated or during reset flow.
   */
  updatePassword: async (password: string) => {
    return supabase.auth.updateUser({ password });
  },

  /**
   * Signs out the currently authenticated user.
   */
  signOut: async () => {
    return supabase.auth.signOut();
  },
};
