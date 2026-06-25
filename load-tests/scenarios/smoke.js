import http from 'k6/http';
import { check, sleep } from 'k6';
import { getSupabaseToken, getHeaders } from '../utils/helpers.js';

// Targets
const TARGET_URL = __ENV.K6_TARGET_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = __ENV.K6_TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.K6_TEST_USER_PASSWORD;

// Options for a quick smoke test
export const options = {
  vus: 1, // 1 user
  duration: '10s', // 10 seconds only
  thresholds: {
    http_req_failed: ['rate<0.01'], // less than 1% errors
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete below 1.5s
  },
};

export default function smokeTest() {
  // Scenario 1: Access public pages
  const homeRes = http.get(TARGET_URL);
  check(homeRes, {
    'home status is 200': (r) => r.status === 200,
    'home content contains Hyperion': (r) => r.body.includes('Hyperion'),
  });
  sleep(1);

  const aboutRes = http.get(`${TARGET_URL}/about`);
  check(aboutRes, {
    'about page status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(1);

  // Scenario 2: Attempt auth flow if credentials are provided
  if (SUPABASE_URL && SUPABASE_ANON_KEY && TEST_USER_EMAIL && TEST_USER_PASSWORD) {
    const token = getSupabaseToken(SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    
    if (token) {
      const headers = getHeaders(SUPABASE_ANON_KEY, token);
      
      // Access profile API or a protected resource (e.g., request user metadata)
      const userRes = http.get(`${SUPABASE_URL}/auth/v1/user`, { headers });
      check(userRes, {
        'supabase auth user status is 200': (r) => r.status === 200,
        'user email matches': (r) => r.json('email') === TEST_USER_EMAIL,
      });
    }
  }

  sleep(1);
}
