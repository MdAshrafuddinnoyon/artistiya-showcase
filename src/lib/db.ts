/**
 * Dual-mode Database Client
 * 
 * When VITE_API_BASE_URL is set → uses PHP backend API
 * When not set → uses Supabase client directly
 * 
 * Provides Supabase-compatible chained query builder API so all existing
 * component code works with minimal import changes.
 * 
 * Usage: Replace `import { supabase } from "@/integrations/supabase/client"`
 *        with    `import { db } from "@/lib/db"`
 */

import { supabase as supabaseClient } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_PHP = Boolean(API_BASE);

// ─── Token Management ────────────────────────────────────────
const TOKEN_KEY = 'auth_token';

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

// ─── PHP API Request ─────────────────────────────────────────
async function phpRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { message: json.error || json.message || res.statusText, code: String(res.status) };
  }
  return json;
}

// ─── Query Builder (mimics Supabase's chained API) ───────────

type FilterEntry = { op: string; column: string; value: any };

class QueryBuilder {
  private _table: string;
  private _method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private _select: string = '*';
  private _filters: FilterEntry[] = [];
  private _order: { column: string; ascending: boolean }[] = [];
  private _limit: number | null = null;
  private _offset: number | null = null;
  private _single = false;
  private _maybeSingle = false;
  private _count: string | null = null;
  private _body: any = null;
  private _upsertConflict: string | null = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns?: string, options?: { count?: string }) {
    this._method = 'GET';
    this._select = columns || '*';
    if (options?.count) this._count = options.count;
    return this;
  }

  insert(data: any) {
    this._method = 'POST';
    this._body = data;
    return this;
  }

  update(data: any) {
    this._method = 'PATCH';
    this._body = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this._method = 'POST';
    this._body = data;
    this._upsertConflict = options?.onConflict || 'id';
    return this;
  }

  delete() {
    this._method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) { this._filters.push({ op: 'eq', column, value }); return this; }
  neq(column: string, value: any) { this._filters.push({ op: 'neq', column, value }); return this; }
  gt(column: string, value: any) { this._filters.push({ op: 'gt', column, value }); return this; }
  gte(column: string, value: any) { this._filters.push({ op: 'gte', column, value }); return this; }
  lt(column: string, value: any) { this._filters.push({ op: 'lt', column, value }); return this; }
  lte(column: string, value: any) { this._filters.push({ op: 'lte', column, value }); return this; }
  like(column: string, value: any) { this._filters.push({ op: 'like', column, value }); return this; }
  ilike(column: string, value: any) { this._filters.push({ op: 'ilike', column, value }); return this; }
  is(column: string, value: any) { this._filters.push({ op: 'is', column, value }); return this; }
  in(column: string, values: any[]) { this._filters.push({ op: 'in', column, value: values }); return this; }
  contains(column: string, value: any) { this._filters.push({ op: 'cs', column, value }); return this; }
  containedBy(column: string, value: any) { this._filters.push({ op: 'cd', column, value }); return this; }
  not(column: string, op: string, value: any) { this._filters.push({ op: `not.${op}`, column, value }); return this; }
  or(conditions: string, options?: { foreignTable?: string }) { this._filters.push({ op: 'or', column: '', value: conditions }); return this; }
  filter(column: string, op: string, value: any) { this._filters.push({ op, column, value }); return this; }
  textSearch(column: string, query: string, options?: any) { this._filters.push({ op: 'fts', column, value: query }); return this; }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this._order.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) { this._limit = count; return this; }
  range(from: number, to: number) { this._offset = from; this._limit = to - from + 1; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  // Execute and return { data, error, count? }
  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (e) {
      if (reject) reject(e);
      else resolve({ data: null, error: e, count: null });
    }
  }

  private async _execute(): Promise<{ data: any; error: any; count?: number | null }> {
    const params = new URLSearchParams();

    if (this._select !== '*') params.set('select', this._select);

    for (const f of this._filters) {
      if (f.op === 'in') {
        params.set(`in.${f.column}`, JSON.stringify(f.value));
      } else if (f.op === 'or') {
        params.set('or', String(f.value));
      } else {
        params.set(`${f.op}.${f.column}`, String(f.value));
      }
    }

    if (this._order.length > 0) {
      const orderStr = this._order.map(o => `${o.column}.${o.ascending ? 'asc' : 'desc'}`).join(',');
      params.set('order', orderStr);
    }

    if (this._limit !== null) params.set('limit', String(this._limit));
    if (this._offset !== null) params.set('offset', String(this._offset));
    if (this._single || this._maybeSingle) params.set('single', 'true');
    if (this._count) params.set('count', this._count);
    if (this._upsertConflict) params.set('upsert', this._upsertConflict);

    const qs = params.toString();
    const url = `/${this._table}${qs ? '?' + qs : ''}`;

    try {
      const result = await phpRequest(url, {
        method: this._method,
        ...(this._body ? { body: JSON.stringify(this._body) } : {}),
      });

      const data = result?.data !== undefined ? result.data : result;
      const count = result?.total ?? result?.count ?? null;

      if (this._single && Array.isArray(data)) {
        if (data.length === 0) {
          return { data: null, error: { message: 'No rows found', code: 'PGRST116' }, count };
        }
        return { data: data[0], error: null, count };
      }

      if (this._maybeSingle && Array.isArray(data)) {
        return { data: data.length > 0 ? data[0] : null, error: null, count };
      }

      return { data, error: null, count };
    } catch (err: any) {
      if (this._maybeSingle && err?.code === '404') {
        return { data: null, error: null, count: null };
      }
      return { data: null, error: err, count: null };
    }
  }
}

// ─── Auth Module (mimics supabase.auth) ──────────────────────

const authListeners: Array<(event: string, session: any) => void> = [];

const phpAuth = {
  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    try {
      const result = await phpRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          full_name: options?.data?.full_name || '',
        }),
      });
      if (result.token) {
        setToken(result.token);
        const session = { access_token: result.token, user: result.user || { id: result.user_id, email } };
        authListeners.forEach(cb => cb('SIGNED_IN', session));
      }
      return { data: { user: result.user || { id: result.user_id, email }, session: null }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message || 'Signup failed' } };
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const result = await phpRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.token) {
        setToken(result.token);
        const user = result.user || { id: result.user_id, email, user_metadata: {} };
        const session = { access_token: result.token, user };
        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      }
      return { data: { user: null, session: null }, error: { message: 'Login failed' } };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message || 'Login failed' } };
    }
  },

  async signOut() {
    try { await phpRequest('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setToken(null);
    authListeners.forEach(cb => cb('SIGNED_OUT', null));
    return { error: null };
  },

  async getSession() {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };
    try {
      const result = await phpRequest('/auth/session');
      const session = { access_token: token, user: result.user || result };
      return { data: { session }, error: null };
    } catch {
      setToken(null);
      return { data: { session: null }, error: null };
    }
  },

  async getUser() {
    const token = getToken();
    if (!token) return { data: { user: null }, error: null };
    try {
      const result = await phpRequest('/auth/profile');
      return { data: { user: result.user || result }, error: null };
    } catch {
      return { data: { user: null }, error: null };
    }
  },

  async resetPasswordForEmail(email: string, options?: any) {
    try {
      await phpRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { data: {}, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },

  async updateUser(updates: any) {
    try {
      const result = await phpRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return { data: { user: result.user || result }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.push(callback);
    
    // Check existing session
    const token = getToken();
    if (token) {
      phpAuth.getSession().then(({ data }) => {
        callback(data?.session ? 'SIGNED_IN' : 'SIGNED_OUT', data?.session || null);
      });
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 0);
    }

    // Cross-tab sync
    const handler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (e.newValue) {
          phpAuth.getSession().then(({ data }) => {
            callback('SIGNED_IN', data?.session || null);
          });
        } else {
          callback('SIGNED_OUT', null);
        }
      }
    };
    window.addEventListener('storage', handler);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx >= 0) authListeners.splice(idx, 1);
            window.removeEventListener('storage', handler);
          },
        },
      },
    };
  },
};

// ─── Storage Module (mimics supabase.storage) ────────────────

function createPhpStorageBucket(bucketName: string) {
  return {
    async upload(path: string, file: File, options?: any) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        const res = await fetch(`${API_BASE}/storage/${bucketName}/upload`, {
          method: 'POST', headers, body: formData,
        });
        const json = await res.json();
        if (!res.ok) return { data: null, error: { message: json.error || 'Upload failed' } };
        return { data: { path: json.path || path }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    async remove(paths: string[]) {
      try {
        await phpRequest(`/storage/${bucketName}/delete`, {
          method: 'POST',
          body: JSON.stringify({ paths }),
        });
        return { data: paths, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    async list(folder?: string, options?: any) {
      try {
        const params = new URLSearchParams();
        if (folder) params.set('folder', folder);
        const data = await phpRequest(`/storage/${bucketName}/list?${params.toString()}`);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: `${API_BASE}/storage/${bucketName}/${path}` } };
    },
  };
}

const phpStorage = {
  from(bucketName: string) {
    return createPhpStorageBucket(bucketName);
  },
};

// ─── Functions Module (mimics supabase.functions.invoke) ─────

const phpFunctions = {
  async invoke(functionName: string, options?: { body?: any }) {
    try {
      const data = await phpRequest(`/functions/${functionName}`, {
        method: 'POST',
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

// ─── RPC (mimics supabase.rpc) ───────────────────────────────

async function phpRpc(functionName: string, params?: Record<string, any>) {
  try {
    const data = await phpRequest(`/functions/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
    return { data: data?.result !== undefined ? data.result : data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message } };
  }
}

// ─── Channel (mimics supabase.channel for realtime — stub for PHP) ──

function phpChannel(name: string) {
  return {
    on(_type: string, _filter: any, _callback: any) { return this; },
    subscribe(_callback?: any) { return this; },
    unsubscribe() { return this; },
  };
}

// ─── Main Export ─────────────────────────────────────────────

interface DbClient {
  from: (table: string) => QueryBuilder;
  auth: typeof phpAuth;
  storage: typeof phpStorage;
  functions: typeof phpFunctions;
  rpc: typeof phpRpc;
  channel: typeof phpChannel;
}

const phpClient: DbClient = {
  from: (table: string) => new QueryBuilder(table),
  auth: phpAuth,
  storage: phpStorage,
  functions: phpFunctions,
  rpc: phpRpc,
  channel: phpChannel,
};

// Export: use PHP client when API_BASE is set, otherwise Supabase
export const db: any = USE_PHP ? phpClient : supabaseClient;

// Convenience alias — so files can do: import { supabase } from "@/lib/db"
export const supabase = db;
