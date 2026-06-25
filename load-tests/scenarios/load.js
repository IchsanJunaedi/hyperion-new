import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { getSupabaseToken, getHeaders } from '../utils/helpers.js';

// Targets
const TARGET_URL = __ENV.K6_TARGET_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = __ENV.K6_TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.K6_TEST_USER_PASSWORD;

// Ramping up options for standard load test
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 VUs
    { duration: '1m', target: 20 },  // Steady state at 20 VUs
    { duration: '30s', target: 50 }, // Ramp up to 50 VUs (peak)
    { duration: '1m', target: 50 },  // Stay at 50 VUs
    { duration: '30s', target: 0 },  // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
    http_req_duration: ['p(90)<2000'], // 90% of requests should be under 2s
  },
};

export default function loadTest() {
  // 1. Public Visitor Journey
  group('Public Pages', function () {
    const homeRes = http.get(TARGET_URL);
    check(homeRes, {
      'home status is 200': (r) => r.status === 200,
    });
    sleep(1);

    const aboutRes = http.get(`${TARGET_URL}/about`);
    check(aboutRes, {
      'about status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    sleep(1);

    const divisionsRes = http.get(`${TARGET_URL}/divisions`);
    check(divisionsRes, {
      'divisions status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(2);

  // 2. Member Authenticated Journey
  if (SUPABASE_URL && SUPABASE_ANON_KEY && TEST_USER_EMAIL && TEST_USER_PASSWORD) {
    group('Authenticated Member', function () {
      const token = getSupabaseToken(SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      
      if (token) {
        const headers = getHeaders(SUPABASE_ANON_KEY, token);

        // Fetch Supabase user profile
        const profileRes = http.get(`${SUPABASE_URL}/auth/v1/user`, { headers });
        check(profileRes, {
          'fetch user profile successful': (r) => r.status === 200,
        });
        sleep(2);

        // Access team page if workspace settings are provided
        const teamSlug = __ENV.K6_TEST_TEAM_SLUG || 'hyperion';
        const teamWorkspaceRes = http.get(`${TARGET_URL}/${teamSlug}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        check(teamWorkspaceRes, {
          'team workspace loads or redirects': (r) => [200, 302, 307, 404].includes(r.status),
        });
      }
    });
  }

  sleep(3);
}
