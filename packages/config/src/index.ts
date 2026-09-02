/**
 * @vepari/config — shared configuration for mobile and backend.
 *
 * Server-only values (API keys, DB URLs, secrets) are NEVER exported from
 * this package. They live in backend environment variables only.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  env: AppEnvironment;
  apiBaseUrl: string;
  features: FeatureFlags;
}

export interface FeatureFlags {
  voiceEnabled: boolean;
  aiActionsEnabled: boolean;
  offlineModeEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  voiceEnabled: true,
  aiActionsEnabled: true,
  offlineModeEnabled: true,
};

/** Supported locales (BCP-47). */
export const SUPPORTED_LOCALES = ['en', 'hi', 'ta', 'te', 'kn', 'mr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Supported currency — INR only in v1. */
export const CURRENCY = 'INR' as const;

/** API version prefix. */
export const API_VERSION = 'v1' as const;

/** Max offline queue depth before forcing sync. */
export const OFFLINE_QUEUE_MAX = 500;

/** JWT access token expiry (seconds) — kept consistent mobile ↔ backend. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min

/** Refresh token expiry (days). */
export const REFRESH_TOKEN_TTL_DAYS = 90;
