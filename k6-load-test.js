import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
export const latencyTrend = new Trend('nexora_latency_ms');
export const errorRate = new Rate('nexora_error_rate');
export const totalRequests = new Counter('nexora_requests_total');

// Progressive load tiers configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 },    // Tier 1: 100 Users
    { duration: '30s', target: 500 },    // Tier 2: 500 Users
    { duration: '45s', target: 1000 },   // Tier 3: 1,000 Users
    { duration: '45s', target: 5000 },   // Tier 4: 5,000 Users
    { duration: '1m',  target: 10000 },  // Tier 5: 10,000 Users
    { duration: '1m',  target: 25000 },  // Tier 6: 25,000 Users
    { duration: '1m',  target: 50000 },  // Tier 7: 50,000 Users
    { duration: '1m',  target: 100000 }, // Tier 8: 100,000 Users
    { duration: '30s', target: 0 },      // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'nexora_error_rate': ['rate<0.01'],  // Error rate must be < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://nexoranetwork.site/api/v1';

export default function () {
  // Scenario 1: Public Feed & Discovery Request
  const resFeed = http.get(`${BASE_URL}/posts?page=0&size=10`);
  totalRequests.add(1);
  latencyTrend.add(resFeed.timings.duration);
  const feedSuccess = check(resFeed, {
    'Feed status is 200': (r) => r.status === 200,
  });
  errorRate.add(!feedSuccess);

  sleep(Math.random() * 2 + 1);

  // Scenario 2: User Profile Lookup
  const userId = Math.floor(Math.random() * 15) + 1;
  const resProfile = http.get(`${BASE_URL}/users/${userId}`);
  totalRequests.add(1);
  latencyTrend.add(resProfile.timings.duration);
  const profileSuccess = check(resProfile, {
    'Profile status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  errorRate.add(!profileSuccess);

  sleep(Math.random() * 2 + 1);

  // Scenario 3: Discover Directory Search
  const resSearch = http.get(`${BASE_URL}/users?query=eng`);
  totalRequests.add(1);
  latencyTrend.add(resSearch.timings.duration);
  const searchSuccess = check(resSearch, {
    'Search status is 200': (r) => r.status === 200,
  });
  errorRate.add(!searchSuccess);

  sleep(Math.random() * 3 + 1);
}
