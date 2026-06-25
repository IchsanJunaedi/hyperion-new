import http from 'k6/http';
import { check } from 'k6';

/**
 * Authenticates a test user with Supabase Auth and returns the JWT access token.
 * 
 * @param {string} supabaseUrl - The Supabase URL
 * @param {string} supabaseAnonKey - The Supabase Anon Key
 * @param {string} email - Test user email
 * @param {string} password - Test user password
 * @returns {string|null} The access token, or null if login fails
 */
export function getSupabaseToken(supabaseUrl, supabaseAnonKey, email, password) {
  if (!supabaseUrl || !supabaseAnonKey || !email || !password) {
    console.warn('Supabase credentials or login details missing. Skipping authentication.');
    return null;
  }

  const url = `${supabaseUrl}/auth/v1/token?grant_type=password`;
  const payload = JSON.stringify({ email, password });
  const params = {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  const success = check(res, {
    'auth login status is 200': (r) => r.status === 200,
    'auth response contains access_token': (r) => r.json('access_token') !== undefined,
  });

  if (!success) {
    console.error(`Login failed for ${email}. Status: ${res.status}, Body: ${res.body}`);
    return null;
  }

  return res.json('access_token');
}

/**
 * Builds standard headers including optional Supabase auth token and API key.
 * 
 * @param {string} supabaseAnonKey - Supabase anon key
 * @param {string|null} authToken - Supabase JWT access token
 * @returns {object} Headers object
 */
export function getHeaders(supabaseAnonKey, authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (supabaseAnonKey) {
    headers['apikey'] = supabaseAnonKey;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}
