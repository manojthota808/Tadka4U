import { describe, it, expect } from "vitest";
import {
  isSafeUrl,
  sanitizeSafeUrl,
  sanitizeText,
  sanitizeStorageSlug,
  validateSubscriptionIntegrity,
} from "@/lib/security";

describe("Security Layer - Input Sanitization & URL Defense", () => {
  it("allows valid https and relative URLs", () => {
    expect(
      isSafeUrl("https://storage.googleapis.com/test-bucket/ep1.mp4"),
    ).toBe(true);
    expect(isSafeUrl("https://images.unsplash.com/photo-123")).toBe(true);
    expect(isSafeUrl("/posters/show-1.jpg")).toBe(true);
    expect(isSafeUrl("http://localhost:8081/video.mp4")).toBe(true);
  });

  it("blocks dangerous javascript, data, and file protocols", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox('hack')")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("blob:http://evil.com/1234")).toBe(false);
  });

  it("blocks null bytes, newlines, and protocol injection", () => {
    expect(isSafeUrl("https://example.com/\0evil")).toBe(false);
    expect(isSafeUrl("https://example.com/\r\nSet-Cookie:evil")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
  });

  it("falls back safely in sanitizeSafeUrl", () => {
    expect(sanitizeSafeUrl("javascript:evil", "https://default.com")).toBe(
      "https://default.com",
    );
    expect(sanitizeSafeUrl("https://trusted.com", "https://default.com")).toBe(
      "https://trusted.com",
    );
  });

  it("strips HTML tags and controls characters in sanitizeText", () => {
    expect(sanitizeText("<script>alert('xss')</script>Hello")).toBe("Hello");
    expect(sanitizeText("<b>Bold Drama</b> <img src=x onerror=alert(1)>")).toBe(
      "Bold Drama",
    );
    expect(sanitizeText("Drama with\0 null bytes")).toBe(
      "Drama with null bytes",
    );
  });

  it("sanitizes slugs and prevents path traversal", () => {
    expect(sanitizeStorageSlug("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeStorageSlug("Royal & Romance: Special")).toBe(
      "royal-romance-special",
    );
    expect(sanitizeStorageSlug("")).toBe("item");
  });

  it("validates subscription data and rejects tampered plans", () => {
    const valid = {
      planId: "super",
      billing: "monthly",
      subscribedAt: new Date().toISOString(),
    };
    expect(validateSubscriptionIntegrity(valid)).not.toBeNull();
    expect(validateSubscriptionIntegrity(valid)?.planId).toBe("super");

    // Rejects invalid plan ID
    expect(
      validateSubscriptionIntegrity({
        planId: "free_hacked_tier",
        billing: "monthly",
        subscribedAt: new Date().toISOString(),
      }),
    ).toBeNull();

    // Rejects far-future subscription date tampering
    expect(
      validateSubscriptionIntegrity({
        planId: "premium",
        billing: "annual",
        subscribedAt: "2099-01-01T00:00:00.000Z",
      }),
    ).toBeNull();
  });
});
