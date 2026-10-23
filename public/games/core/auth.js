// Sign-in for ROOTLINE accounts: email and password, plus Google / GitHub / Apple, over the Supabase Auth REST API.
// No library: it is a handful of requests. Everything outside the browser (storage, fetch, crypto, the page address)
// is passed in, so the whole flow can be tested without a browser.
//
// Notes on safety:
//  * The "Continue with ..." flow and the email links use PKCE: the address the browser comes back to carries a
//    one-time code, never a token, and the code is useless without a secret that never left this browser.
//  * The session (access and refresh token) is kept in localStorage, the same as the Supabase library does. The site
//    sends a strict content-security policy, but anything that could run script on this origin could read it.
//  * Passwords are only ever sent to the sign-in service over HTTPS. They are never stored here or logged.

export class AuthError extends Error {
  constructor(code, detail = '') {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

const SESSION_KEY = 'lixteam.rootline.session.v1';
const PKCE_KEY = 'lixteam.rootline.pkce.v1';
const SKEW_SECONDS = 60; // refresh a little before the token runs out

const b64url = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Turn a failed response from the sign-in service or the database into one of our short codes.
export function codeFromError(status, body) {
  const b = body && typeof body === 'object' ? body : {};
  const code = String(b.error_code || b.code || '');
  const text = String(b.msg || b.message || b.error_description || b.error || '').toLowerCase();
  if (status === 429 || /rate_limit/.test(code) || /rate limit|too many/.test(text)) return 'rate_limited';
  if (code === 'invalid_credentials' || /invalid login credentials|invalid_grant/.test(text)) return 'invalid_credentials';
  if (code === 'email_not_confirmed' || /email not confirmed/.test(text)) return 'email_not_confirmed';
  if (code === 'weak_password' || /password should be|weak password/.test(text)) return 'weak_password';
  if (code === 'user_already_exists' || /already registered|already exists/.test(text)) return 'user_exists';
  // Our own database functions raise their code as the message (for example "nickname_taken").
  if (/^[a-z][a-z_]{2,40}$/.test(String(b.message || ''))) return String(b.message);
  return 'unknown';
}

export function createAuth({ url, anonKey, providers = [], storage, session: sessionStore, fetchImpl, crypto: cryptoImpl, now = () => Date.now(), origin }) {
  const enabled = !!(url && anonKey);
  const base = String(url || '').replace(/\/+$/, '');
  const f = fetchImpl || ((...a) => fetch(...a));
  const cr = cryptoImpl || globalThis.crypto;
  const listeners = new Set();
  let inflight = null;

  const read = (store, key) => {
    try {
      return JSON.parse(store.getItem(key) || 'null');
    } catch {
      return null;
    }
  };
  const write = (store, key, value) => {
    try {
      if (value === null) store.removeItem(key);
      else store.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode: the session just does not outlive the page */
    }
  };

  let memory = null;
  const stored = () => {
    const s = read(storage, SESSION_KEY);
    return s && typeof s.access_token === 'string' && typeof s.refresh_token === 'string' ? s : null;
  };
  const current = () => memory || stored();
  const setSession = (s) => {
    memory = s;
    write(storage, SESSION_KEY, s);
    for (const fn of listeners) fn(publicView(s));
  };

  const publicView = (s) => (s ? { id: s.user.id, email: s.user.email || '', provider: s.user.provider || 'email', ageConfirmed: !!s.user.age_confirmed } : null);

  function toSession(body) {
    if (!body || typeof body.access_token !== 'string' || typeof body.refresh_token !== 'string' || !body.user) return null;
    const u = body.user;
    const seconds = Number(body.expires_in) || 3600;
    return {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: Number(body.expires_at) || Math.floor(now() / 1000) + seconds,
      user: {
        id: String(u.id),
        email: String(u.email || ''),
        provider: String((u.app_metadata && u.app_metadata.provider) || 'email'),
        age_confirmed: !!(u.user_metadata && u.user_metadata.age_confirmed),
      },
    };
  }

  async function request(path, { method = 'POST', body, token, query = '' } = {}) {
    if (!enabled) throw new AuthError('unavailable');
    let res;
    try {
      res = await f(`${base}${path}${query}`, {
        method,
        headers: { apikey: anonKey, Authorization: `Bearer ${token || anonKey}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new AuthError('network');
    }
    let json = null;
    try {
      const text = await res.text();
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) throw new AuthError(codeFromError(res.status, json), json && (json.msg || json.message || json.error_description) ? String(json.msg || json.message || json.error_description).slice(0, 200) : '');
    return json;
  }

  // ── PKCE ──────────────────────────────────────────────────────
  async function pkce(kind) {
    const raw = new Uint8Array(48);
    cr.getRandomValues(raw);
    const verifier = b64url(raw);
    const digest = new Uint8Array(await cr.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    write(sessionStore, PKCE_KEY, { verifier, kind, at: now() });
    return { challenge: b64url(digest), method: 's256' };
  }
  const callback = (flow) => `${origin}/games/levelup/account.html?flow=${flow}`;

  // ── The public API ────────────────────────────────────────────
  const api = {
    enabled,
    providers: providers.filter((p) => ['google', 'github', 'apple'].includes(p)),
    session: () => publicView(current()),
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async signUp({ email, password, ageConfirmed }) {
      if (ageConfirmed !== true) throw new AuthError('age_required');
      if (typeof password !== 'string' || password.length < 10) throw new AuthError('weak_password');
      const { challenge, method } = await pkce('confirm');
      const body = await request('/auth/v1/signup', {
        body: { email, password, data: { age_confirmed: true }, code_challenge: challenge, code_challenge_method: method },
        query: `?redirect_to=${encodeURIComponent(callback('confirm'))}`,
      });
      const s = toSession(body);
      if (s) {
        setSession(s);
        return { status: 'signed_in' };
      }
      return { status: 'confirm' }; // the same answer whether or not the address was already registered
    },

    async signIn({ email, password }) {
      const body = await request('/auth/v1/token', { query: '?grant_type=password', body: { email, password } });
      const s = toSession(body);
      if (!s) throw new AuthError('unknown');
      setSession(s);
      return publicView(s);
    },

    // Returns the address to send the browser to. The caller does location.assign(url).
    async providerUrl(provider) {
      if (!enabled) throw new AuthError('unavailable');
      if (!api.providers.includes(provider)) throw new AuthError('unavailable');
      const { challenge, method } = await pkce('oauth');
      return `${base}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(callback('oauth'))}&code_challenge=${challenge}&code_challenge_method=${method}`;
    },

    // Call on the account page when it loads. If the address carries a one-time code from a sign-in link, trade it for a session.
    async handleReturn(search) {
      const q = new URLSearchParams(search || '');
      const flow = q.get('flow') || '';
      if (q.get('error') || q.get('error_description')) return { handled: true, ok: false, flow, code: 'link_failed' };
      const code = q.get('code');
      if (!code) return { handled: false, ok: false, flow };
      const saved = read(sessionStore, PKCE_KEY);
      write(sessionStore, PKCE_KEY, null);
      if (!saved || !saved.verifier) return { handled: true, ok: false, flow, code: 'other_device' };
      let body;
      try {
        body = await request('/auth/v1/token', { query: '?grant_type=pkce', body: { auth_code: code, code_verifier: saved.verifier } });
      } catch (e) {
        return { handled: true, ok: false, flow, code: e.code || 'unknown' };
      }
      const s = toSession(body);
      if (!s) return { handled: true, ok: false, flow, code: 'unknown' };
      setSession(s);
      return { handled: true, ok: true, flow };
    },

    async requestReset(email) {
      const { challenge, method } = await pkce('recover');
      await request('/auth/v1/recover', {
        body: { email, code_challenge: challenge, code_challenge_method: method },
        query: `?redirect_to=${encodeURIComponent(callback('recover'))}`,
      });
    },

    async setPassword(password) {
      if (typeof password !== 'string' || password.length < 10) throw new AuthError('weak_password');
      const token = await api.accessToken();
      if (!token) throw new AuthError('not_signed_in');
      await request('/auth/v1/user', { method: 'PUT', token, body: { password } });
    },

    // A token that is good for at least another minute, refreshing it when needed. null when signed out.
    async accessToken() {
      const s = current();
      if (!s) return null;
      if (s.expires_at - SKEW_SECONDS > Math.floor(now() / 1000)) return s.access_token;
      if (!inflight) {
        inflight = (async () => {
          try {
            const body = await request('/auth/v1/token', { query: '?grant_type=refresh_token', body: { refresh_token: s.refresh_token } });
            const next = toSession(body);
            if (!next) throw new AuthError('unknown');
            setSession(next);
            return next.access_token;
          } catch (e) {
            // A refused refresh token means the session is over; a network blip does not.
            if (e.code !== 'network' && e.code !== 'rate_limited') setSession(null);
            if (e.code === 'network') throw e;
            return null;
          } finally {
            inflight = null;
          }
        })();
      }
      return inflight;
    },

    // Call a database function. Signed in: as the player. Signed out: as an anonymous reader (the public board only).
    async rpc(name, args = {}, { anonymous = false } = {}) {
      if (!/^[a-z_]+$/.test(name)) throw new AuthError('bad_request');
      let token = anonymous ? null : await api.accessToken();
      if (!anonymous && !token) throw new AuthError('not_signed_in');
      try {
        return await request(`/rest/v1/rpc/${name}`, { token, body: args });
      } catch (e) {
        if (!anonymous && /jwt|expired/i.test(e.detail || '')) {
          // The token was refused although it looked fresh: force one refresh and try again.
          const s = current();
          if (s) setSession({ ...s, expires_at: 0 });
          token = await api.accessToken();
          if (!token) throw new AuthError('not_signed_in');
          return request(`/rest/v1/rpc/${name}`, { token, body: args });
        }
        throw e;
      }
    },

    async signOut() {
      const s = current();
      setSession(null);
      if (s && enabled) {
        try {
          await request('/auth/v1/logout', { token: s.access_token, query: '?scope=local' });
        } catch {
          /* the session is already gone on this device */
        }
      }
    },

    // Used after an account has been deleted: forget the session without calling the service.
    forget() {
      setSession(null);
    },
  };

  // Another tab signed in or out.
  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('storage', (e) => {
      if (e.key !== SESSION_KEY) return;
      memory = null;
      for (const fn of listeners) fn(publicView(stored()));
    });
  }
  return api;
}
