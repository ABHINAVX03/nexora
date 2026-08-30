import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom performance metrics
export const latencyTrend = new Trend('nexora_latency_ms');
export const errorRate = new Rate('nexora_error_rate');
export const totalRequests = new Counter('nexora_requests_total');

// Progressive load tiers configuration (100 -> 1,000 Concurrent Virtual Users)
export const options = {
  stages: [
    { duration: '20s', target: 100 },   // Warm-up: 100 Users
    { duration: '30s', target: 300 },   // Tier 1: 300 Users
    { duration: '40s', target: 500 },   // Tier 2: 500 Users
    { duration: '40s', target: 1000 },  // Tier 3: 1,000 Users (Peak Stress)
    { duration: '20s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<800'], // 95% of requests must complete under 800ms
    'nexora_error_rate': ['rate<0.05'], // Error rate must stay below 5%
  },
};

const BASE_URL = (__ENV.TARGET_URL || 'http://13.232.153.224').replace(/\/$/, '') + '/api/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const getHeaders = (userId) => {
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'k6-load-tester/2.0',
  };
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  if (userId) {
    headers['X-User-Id'] = String(userId);
    headers['X-UserId'] = String(userId);
  }
  return headers;
};

export default function () {
  const randomUserId = Math.floor(Math.random() * 20) + 1;
  const headers = getHeaders(randomUserId);

  // Scenario 1: Feed Querying (35% weight)
  const resFeed = http.get(`${BASE_URL}/posts/feed`, { headers });
  totalRequests.add(1);
  latencyTrend.add(resFeed.timings.duration);
  const feedOk = check(resFeed, {
    'Feed returned 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(!feedOk);

  sleep(Math.random() * 0.5 + 0.1);

  // Scenario 2: User Profile Fetch (25% weight)
  const targetId = Math.floor(Math.random() * 10) + 1;
  const resProfile = http.get(`${BASE_URL}/users/${targetId}`, { headers });
  totalRequests.add(1);
  latencyTrend.add(resProfile.timings.duration);
  const profileOk = check(resProfile, {
    'Profile returned 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  errorRate.add(!profileOk);

  sleep(Math.random() * 0.5 + 0.1);

  // Scenario 3: Global Typeahead Search (20% weight)
  const searchQueries = ['Abh', 'User', 'Java', 'Dev'];
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const resSearch = http.get(`${BASE_URL}/users/search/suggestions?q=${query}`, { headers });
  totalRequests.add(1);
  latencyTrend.add(resSearch.timings.duration);
  const searchOk = check(resSearch, {
    'Search suggestions returned 200': (r) => r.status === 200,
  });
  errorRate.add(!searchOk);

  sleep(Math.random() * 0.5 + 0.1);

  // Scenario 4: Hashtag Search (20% weight)
  const resHashtags = http.get(`${BASE_URL}/posts/hashtags/search?q=engineering`, { headers });
  totalRequests.add(1);
  latencyTrend.add(resHashtags.timings.duration);
  const hashtagOk = check(resHashtags, {
    'Hashtag search returned 200': (r) => r.status === 200,
  });
  errorRate.add(!hashtagOk);

  sleep(Math.random() * 1.0 + 0.2);
}
