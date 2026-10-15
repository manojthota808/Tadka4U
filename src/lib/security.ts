/**
 * Tadka4U Application Security Utilities
 * Provides input sanitization, safe URL validation, path traversal defense,
 * and subscription integrity verification.
 */

const DANGEROUS_PROTOCOLS = new Set([
  "javascript:",
  "vbscript:",
  "data:",
  "file:",
  "blob:",
]);

/**
 * Validates whether a given URL is safe for browser rendering (prevents XSS, SSRF, protocol injection).
 */
export function isSafeUrl(
  rawUrl: unknown,
  allowedProtocols: string[] = ["https:", "http:"],
): boolean {
  if (typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Block null bytes and carriage return/newline header injections
  if (
    trimmed.includes("\0") ||
    trimmed.includes("\r") ||
    trimmed.includes("\n")
  ) {
    return false;
  }

  // Allow safe relative paths
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (DANGEROUS_PROTOCOLS.has(protocol)) {
      return false;
    }

    return allowedProtocols.includes(protocol);
  } catch {
    return false;
  }
}

/**
 * Returns a safe URL or falls back to a safe default if invalid.
 */
export function sanitizeSafeUrl(
  url: string | null | undefined,
  fallback = "",
): string {
  if (!url) return fallback;
  return isSafeUrl(url) ? url.trim() : fallback;
}

/**
 * Sanitizes plain text input by stripping HTML markup, scripts, and null bytes.
 */
export function sanitizeText(
  input: string | null | undefined,
  maxLength = 1000,
): string {
  if (typeof input !== "string") return "";

  // Remove null bytes and non-printable control chars (keep standard printable text, tabs, newlines)
  let cleaned = input
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (
        (code >= 32 && code !== 127) || code === 9 || code === 10 || code === 13
      );
    })
    .join("");

  // Remove script and style tags along with their inner contents to eliminate executable XSS
  cleaned = cleaned.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // Strip remaining HTML tags (<...>) to prevent stored XSS
  cleaned = cleaned.replace(/<[^>]*>?/gm, "");

  // Trim to maximum length
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Sanitizes file slugs and storage directory names to defend against path traversal attacks.
 */
export function sanitizeStorageSlug(slug: string): string {
  if (!slug || typeof slug !== "string") return "item";
  return (
    slug
      .toLowerCase()
      .replace(/\.\.+/g, "") // Block directory traversal (../)
      .replace(/[^a-z0-9-_]/g, "-") // Allow only safe alphanumeric, dashes, and underscores
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "item"
  );
}

/**
 * Validates stored subscription data integrity to prevent arbitrary injection.
 */
export interface ValidatedSubscription {
  planId: "mobile" | "super" | "premium";
  subscribedAt: string;
  billing: "monthly" | "annual";
}

export function validateSubscriptionIntegrity(
  raw: unknown,
): ValidatedSubscription | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const allowedPlans = new Set(["mobile", "super", "premium"]);
  const allowedBilling = new Set(["monthly", "annual"]);

  const planId = String(data["planId"] || "");
  const billing = String(data["billing"] || "monthly");
  const subscribedAt = String(data["subscribedAt"] || "");

  if (!allowedPlans.has(planId)) return null;
  if (!allowedBilling.has(billing)) return null;

  // Validate subscribedAt date format
  const dateNum = Date.parse(subscribedAt);
  if (isNaN(dateNum)) return null;

  // Ensure subscription date isn't from the far future (+1 day leeway) or older than 2 years
  const now = Date.now();
  const maxFuture = now + 86400000;
  const maxPast = now - 2 * 365 * 86400000;
  if (dateNum > maxFuture || dateNum < maxPast) return null;

  return {
    planId: planId as "mobile" | "super" | "premium",
    billing: billing as "monthly" | "annual",
    subscribedAt: new Date(dateNum).toISOString(),
  };
}
