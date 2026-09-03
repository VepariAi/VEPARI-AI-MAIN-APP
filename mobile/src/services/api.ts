import { VepariApiClient } from '@vepari/api-client';
import { secureRead, secureWrite, secureDelete, StorageKey } from '@/security';
import { BACKEND_API_URL } from './env';

let _client: VepariApiClient | null = null;

export function getApiClient(): VepariApiClient {
  if (_client) return _client;
  _client = new VepariApiClient({
    baseUrl: BACKEND_API_URL,
    getAccessToken: () => {
      // Synchronous reads are not available from Keychain; token cached in memory.
      // App bootstraps token cache at startup via initSession().
      return _tokenCache;
    },
    onUnauthorized: () => {
      _tokenCache = null;
      void clearSession();
    },
  });
  return _client;
}

let _tokenCache: string | null = null;

export async function initSession(): Promise<boolean> {
  const token = await secureRead(StorageKey.ACCESS_TOKEN);
  _tokenCache = token;
  return token !== null;
}

export async function saveSession(accessToken: string, refreshToken: string): Promise<void> {
  _tokenCache = accessToken;
  await secureWrite(StorageKey.ACCESS_TOKEN, accessToken);
  await secureWrite(StorageKey.REFRESH_TOKEN, refreshToken);
}

export async function clearSession(): Promise<void> {
  _tokenCache = null;
  await secureDelete(StorageKey.ACCESS_TOKEN);
  await secureDelete(StorageKey.REFRESH_TOKEN);
}
