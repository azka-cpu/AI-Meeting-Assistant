

import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface FastAPIValidationError {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

function extractErrorMessage(errorBody: unknown, status: number): string {
  if (!errorBody || typeof errorBody !== 'object') {
    return `HTTP ${status}`;
  }

  const detail = (errorBody as { detail?: unknown }).detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((d: FastAPIValidationError) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        const msg = d.msg || 'Invalid value';
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean);
    return messages.length ? messages.join(', ') : `HTTP ${status}`;
  }

  if (detail && typeof detail === 'object') {
    const msg = (detail as FastAPIValidationError).msg;
    if (msg) return msg;
    try {
      return JSON.stringify(detail);
    } catch {
      return `HTTP ${status}`;
    }
  }

  return `HTTP ${status}`;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...auth.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      auth.redirectToLogin();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = extractErrorMessage(errorBody, response.status);
      throw new Error(message);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

interface TokenResponse {
  access_token: string;
  token_type: string;
}

function saveTokenFromResponse(response: TokenResponse): TokenResponse {
  if (response && response.access_token) {
    auth.setToken(response.access_token);
  } else {
    console.error(
      '[auth] Login/register response did not contain access_token. Received:',
      response
    );
  }
  return response;
}

export const authApi = {
  register: async (email: string, name: string, password: string) => {
    const response = await api.post<TokenResponse>('/api/auth/register', {
      email,
      name,
      password,
    });
    return saveTokenFromResponse(response);
  },

  login: async (email: string, password: string) => {
    const response = await api.post<TokenResponse>('/api/auth/login', {
      email,
      password,
    });
    return saveTokenFromResponse(response);
  },

  me: () =>
    api.get<{ id: string; name: string; email: string }>('/api/auth/me'),

  logout: () => {
    auth.removeToken();
  },
};

export const meetingApi = {
  create: (
    title: string,
    description: string,
    scheduledAt?: string,
    durationMinutes?: number
  ) =>
    api.post('/api/meetings', {
      title,
      description,
      scheduled_at: scheduledAt || null,
      duration_minutes: durationMinutes || 30,
    }),

  list: () => api.get('/api/meetings'),

  get: (id: string) => api.get(`/api/meetings/${id}`),

  join: (id: string) => api.post(`/api/meetings/${id}/join`, {}),

  leave: (id: string) => api.post(`/api/meetings/${id}/leave`, {}),
};

// Matches AISummaryResponse from schemas.py exactly — real JSON
// arrays, not comma/newline-joined strings.
export interface MeetingSummaryData {
  summary: string;
  key_topics: string[];
  decisions: string[];
  action_items: string[];
}

export const aiApi = {
  chat: (meetingId: string, message: string) =>
    api.post(`/api/meetings/${meetingId}/ai/chat`, { message }),

  // This is the REAL endpoint. Backend behavior: if a summary
  // already exists for this meeting, returns it as-is UNLESS
  // regenerate=true is passed, in which case it re-generates from
  // the transcript and updates the existing row. If no summary
  // exists yet, it always generates one regardless of this flag.
  // Throws (400) if there's no transcript yet to summarize.
  summary: (meetingId: string, regenerate = false) =>
    api.get<MeetingSummaryData>(
      `/api/meetings/${meetingId}/ai/summary${regenerate ? '?regenerate=true' : ''}`
    ),

  speak: (meetingId: string, text: string) =>
    api.post<{ audio_url: string }>(`/api/meetings/${meetingId}/ai/speak`, { text }),
};

export interface WeeklyActivity {
  week_label: string;
  meetings: number;
}

export interface DashboardStatsResponse {
  time_saved_hours: number;
  time_saved_change: number;
  completed_rate: number;
  completed_change: number;
  total_participants: number;
  participants_change: number;
  total_meetings: number;
  weekly_activity: WeeklyActivity[];
}

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStatsResponse>('/api/dashboard/stats'),
};

export interface FullProfile {
  id: string;
  name: string;
  email: string;
  job_title?: string | null;
  company?: string | null;
}

export interface Preferences {
  notify_email: boolean;
  notify_reminders: boolean;
  notify_weekly_digest: boolean;
  notify_product_updates: boolean;
  pref_language: string;
  pref_timezone: string;
}

export const profileApi = {
  updateProfile: (data: Partial<Pick<FullProfile, 'name' | 'email' | 'job_title' | 'company'>>) =>
    api.put<FullProfile>('/api/auth/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ success: boolean }>('/api/auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  getPreferences: () => api.get<Preferences>('/api/auth/me/preferences'),

  updatePreferences: (data: Partial<Preferences>) =>
    api.put<Preferences>('/api/auth/me/preferences', data),

  deleteAccount: () => api.delete<{ success: boolean }>('/api/auth/me'),
};
