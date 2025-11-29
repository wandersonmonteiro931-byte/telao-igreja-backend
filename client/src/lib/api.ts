// Em desenvolvimento usa servidor local, em produção usa Render (Supabase)
const API_BASE_URL = import.meta.env.DEV 
  ? '' // Servidor local em desenvolvimento
  : (import.meta.env.VITE_API_URL || 'https://telao-igreja-backend.onrender.com');

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number | string;
  email: string;
  username: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  securityQuestion3: string;
  securityAnswer3: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    // Validate that the user object has required fields
    if (user && user.id && user.email && user.role) {
      return user;
    }
    // Invalid user data, clear it
    localStorage.removeItem(USER_KEY);
    return null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('rememberedEmail');
  localStorage.removeItem('rememberedPassword');
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        isRefreshing = false;
        return false;
      }

      const data: RefreshResponse & { token?: string } = await response.json();
      const newAccessToken = data.accessToken || data.token;
      if (newAccessToken) {
        setTokens(newAccessToken, data.refreshToken || refreshToken);
      }
      isRefreshing = false;
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearAuth();
      isRefreshing = false;
      return false;
    }
  })();

  return refreshPromise;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getAccessToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        return {
          success: false,
          error: 'Sessão expirada. Por favor, faça login novamente.',
        };
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Erro ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API Request error:', error);
    return {
      success: false,
      error: 'Erro de conexão. Verifique sua internet.',
    };
  }
}

export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse & { token?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (result.success && result.data) {
    const accessToken = result.data.accessToken || result.data.token;
    if (accessToken) {
      setTokens(accessToken, result.data.refreshToken);
      setUser(result.data.user);
    }
  }

  return result;
}

export async function register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse & { token?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (result.success && result.data) {
    const accessToken = result.data.accessToken || result.data.token;
    if (accessToken) {
      setTokens(accessToken, result.data.refreshToken);
      setUser(result.data.user);
    }
  }

  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuth();
  }
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest<User>('/api/auth/me');
}

export async function verifyToken(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;

  const result = await getCurrentUser();
  if (result.success && result.data) {
    setUser(result.data);
    return true;
  }

  const refreshed = await refreshAccessToken();
  if (refreshed) {
    const retryResult = await getCurrentUser();
    if (retryResult.success && retryResult.data) {
      setUser(retryResult.data);
      return true;
    }
  }

  clearAuth();
  return false;
}

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && accessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return response;
}

export function clearAuthTokens(): void {
  clearAuth();
}

export { apiRequest, API_BASE_URL };
