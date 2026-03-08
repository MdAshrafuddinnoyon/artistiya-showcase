/**
 * PHP API Client — Drop-in replacement for Supabase SDK
 * 
 * Usage (PHP backend mode):
 *   import { api } from "@/lib/api";
 *   const { data, error } = await api.select("products", { eq: { is_active: true }, limit: 12 });
 * 
 * Currently this project uses Supabase (Lovable Cloud). 
 * When migrating to PHP, replace imports:
 *   - FROM: import { supabase } from "@/integrations/supabase/client";
 *   - TO:   import { api } from "@/lib/api";
 * 
 * See docs/migration/FRONTEND_MIGRATION_GUIDE.md for full mapping.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

type RequestOptions = RequestInit & { headers?: Record<string, string> };

class ApiClient {
  private token: string | null = null;

  // ── Token Management ──────────────────────────────────────

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  // ── Core Request ──────────────────────────────────────────

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error: new Error(err.message || err.error || res.statusText) };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // ── CRUD (replaces supabase.from().select/insert/update/delete) ──

  async select<T = any>(
    table: string,
    params?: {
      columns?: string;
      eq?: Record<string, any>;
      in?: Record<string, any[]>;
      filters?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
      single?: boolean;
    }
  ): Promise<{ data: T | null; error: Error | null }> {
    const query = new URLSearchParams();
    if (params?.columns) query.set('select', params.columns);
    if (params?.order) {
      query.set('order', `${params.order.column}.${params.order.ascending !== false ? 'asc' : 'desc'}`);
    }
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.single) query.set('single', 'true');
    if (params?.eq) {
      Object.entries(params.eq).forEach(([k, v]) => query.set(`eq.${k}`, String(v)));
    }
    if (params?.in) {
      Object.entries(params.in).forEach(([k, v]) => query.set(`in.${k}`, JSON.stringify(v)));
    }
    if (params?.filters) {
      Object.entries(params.filters).forEach(([k, v]) => query.set(k, String(v)));
    }
    return this.request<T>(`/${table}?${query.toString()}`);
  }

  async insert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<{ data: T | null; error: Error | null }> {
    return this.request<T>(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T = any>(
    table: string,
    data: Record<string, any>,
    filters: Record<string, any>
  ): Promise<{ data: T | null; error: Error | null }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => query.set(`eq.${k}`, String(v)));
    return this.request<T>(`/${table}?${query.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: null; error: Error | null }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => query.set(`eq.${k}`, String(v)));
    return this.request(`/${table}?${query.toString()}`, { method: 'DELETE' });
  }

  // ── Authentication (replaces supabase.auth.*) ──────────────

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...metadata }),
    });
  }

  async signIn(email: string, password: string) {
    const result = await this.request<{ user: any; token: string; user_id: string; is_admin: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.token) this.setToken(result.data.token);
    return result;
  }

  async signOut() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
    return { error: null };
  }

  async getSession() {
    const token = this.getToken();
    if (!token) return { data: { session: null }, error: null };
    return this.request<{ session: any }>('/auth/session');
  }

  async resetPassword(email: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // ── Storage (replaces supabase.storage.*) ──────────────────

  async uploadFile(bucket: string, path: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/storage/${bucket}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: new Error(data.message || 'Upload failed') };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    return `${API_BASE}/storage/${bucket}/${path}`;
  }

  async removeFiles(bucket: string, paths: string[]) {
    return this.request(`/storage/${bucket}/delete`, {
      method: 'POST',
      body: JSON.stringify({ paths }),
    });
  }

  // ── Edge Functions → PHP API (replaces supabase.functions.invoke) ──

  async invoke<T = any>(functionName: string, options?: { body?: any }) {
    return this.request<T>(`/functions/${functionName}`, {
      method: 'POST',
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  }
}

export const api = new ApiClient();
