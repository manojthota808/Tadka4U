/**
 * Tadka4U Backend Layer
 *
 * Encapsulates server runtimes, server middlewares, privileged database operations,
 * and SSR error handling.
 */

// Database client, ORM models, and schemas
export * from "./db";

// SSR and server function middlewares
export * from "./middleware";

// Server runtime error handling & SSR normalizers
export {
  normalizeCatastrophicSsrResponse,
  isH3SwallowedErrorBody,
} from "./server-error";
