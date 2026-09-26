/**
 * Runtime environment resolution for mobile.
 *
 * Values come from react-native-config (or equivalent build-time injection).
 * NOTHING secret (API keys, JWT secrets, DB passwords) belongs here — those
 * stay server-side. This file only exposes public, non-secret config that the
 * app needs to connect to the right backend environment.
 */

type Env = 'development' | 'staging' | 'production';

function resolveEnv(): Env {
  const raw = (globalThis as Record<string, unknown>)['__ENV__'] ?? 'development';
  if (raw === 'staging' || raw === 'production') return raw;
  return 'development';
}

export const APP_ENV: Env = resolveEnv();

const BACKEND_URLS: Record<Env, string> = {
  development: 'https://api.dev.vepari.ai',
  staging: 'https://api.staging.vepari.ai',
  production: 'https://api.vepari.ai',
};

export const BACKEND_API_URL = BACKEND_URLS[APP_ENV];

export const IS_DEV = APP_ENV === 'development';
export const IS_PROD = APP_ENV === 'production';
