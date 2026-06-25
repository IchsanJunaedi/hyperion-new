import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { getSupabaseToken, getHeaders } from '../utils/helpers.js';

// Targets
const TARGET_URL = __ENV.K6_TARGET_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = __ENV.K6_TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.K6_TEST_USER_PASSWORD;

// Ramping up options for stress testing
export const options = {
  stages: [
    { duration: '45s', target: 100 }, // Aggressive ramp up to 100 VUs
    { duration: '1m', target: 100 },  // Maintain 100 VUs
    { duration: '45s', target: 200 }, // Push system to 200 VUs
    { duration: '1m', target: 200 },  // Maintain peak load to observe degradation
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'], // Under 10% errors even at stress peaks
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
  },
};

export default function stressTest() {
  group('Public Pages (Stress)', function () {
    const homeRes = http.get(TARGET_URL);
    check(homeRes, {
      'home status is 200': (r) => r.status === 200,
    });
    sleep(1);

    const contactRes = http.get(`${TARGET_URL}/contact`);
    check(contactRes, {
      'contact status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(1);

  if (SUPABASE_URL && SUPABASE_ANON_KEY && TEST_USER_EMAIL && TEST_USER_PASSWORD) {
    group('Authenticated User (Stress)', function () {
      const token = getSupabaseToken(SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      
      if (token) {
        const headers = getHeaders(SUPABASE_ANON_KEY, token);

        const profileRes = http.get(`${SUPABASE_URL}/auth/v1/user`, { headers });
        check(profileRes, {
          'fetch user profile successful': (r) => r.status === 200,
        });
      }
    });
  }

  sleep(2);
}
