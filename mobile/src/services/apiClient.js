import { supabase } from './supabaseClient';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const normalizedBaseUrl = rawBaseUrl?.replace(/\/+$/, '');
const apiBaseUrl = normalizedBaseUrl
  ? /\/api$/i.test(normalizedBaseUrl)
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`
  : null;
const DEFAULT_TIMEOUT = 15_000;

export class ApiError extends Error {
  constructor(message, { kind = 'backend', status = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

function extractMessage(payload, fallback) {
  if (Array.isArray(payload?.message)) return payload.message.join('\n');
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
}

export async function apiRequest(path, options = {}) {
  if (!apiBaseUrl) {
    throw new ApiError(
      'API adresi tanımlı değil. .env dosyasına EXPO_PUBLIC_API_BASE_URL değerini ekleyin.',
      { kind: 'configuration' },
    );
  }

  const requiresAuth = options.auth !== false;
  let accessToken;

  if (requiresAuth) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new ApiError('Oturum bilgisi alınamadı. Lütfen yeniden giriş yapın.', {
        kind: 'authentication',
      });
    }
    accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new ApiError('Oturumunuz bulunamadı veya süresi doldu. Lütfen yeniden giriş yapın.', {
        kind: 'authentication',
        status: 401,
      });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);

  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 204) return null;

    const responseText = await response.text();
    let payload = null;
    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        throw new ApiError('Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.', {
          kind: 'authentication',
          status: 401,
        });
      }
      throw new ApiError(
        extractMessage(payload, `İşlem tamamlanamadı (HTTP ${response.status}).`),
        { kind: 'backend', status: response.status },
      );
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new ApiError(
        'İstek zaman aşımına uğradı. Lütfen bağlantınızı kontrol edip tekrar deneyin.',
        { kind: 'timeout' },
      );
      if (__DEV__) console.warn(`[API timeout] ${options.method ?? 'GET'} ${path}`);
      throw timeoutError;
    }
    if (error instanceof TypeError) {
      const networkError = new ApiError(
        'Sunucuya ulaşılamadı. İnternet bağlantınızı ve API adresini kontrol edin.',
        { kind: 'network' },
      );
      if (__DEV__) console.warn(`[API network] ${options.method ?? 'GET'} ${path}`);
      throw networkError;
    }
    if (__DEV__) {
      console.warn(`[API ${error.kind ?? 'unknown'}] ${options.method ?? 'GET'} ${path}`, {
        status: error.status ?? null,
        message: error.message,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
