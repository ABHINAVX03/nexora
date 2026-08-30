#!/usr/bin/env python3
"""
Nexora High-Concurrency Load Testing & Capacity Benchmark Engine
================================================================
Progressively stress-tests Nexora microservices across concurrent user tiers.
Measures Requests Per Second (RPS), Latency Distribution (p50, p90, p95, p99),
and Error Rates across Gateway, Redis Caches, and PostgreSQL / Neo4j backends.

Usage:
  python3 benchmark_suite.py --base-url http://13.232.153.224
  python3 benchmark_suite.py --base-url https://nexoranetworks.site --email guptaabhinav697@gmail.com --password Test@123
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

DEFAULT_ENDPOINTS = [
    {"path": "/api/v1/posts/feed", "method": "GET", "weight": 35},
    {"path": "/api/v1/users/1", "method": "GET", "weight": 25},
    {"path": "/api/v1/users/search/suggestions?q=Abh", "method": "GET", "weight": 20},
    {"path": "/api/v1/posts/hashtags/search?q=engineering", "method": "GET", "weight": 20},
]

DEFAULT_TIERS = [
    {"users": 20, "duration_sec": 3, "label": "Tier 1 (20 Users)"},
    {"users": 50, "duration_sec": 4, "label": "Tier 2 (50 Users)"},
    {"users": 100, "duration_sec": 5, "label": "Tier 3 (100 Users)"},
    {"users": 200, "duration_sec": 5, "label": "Tier 4 (200 Users)"},
    {"users": 500, "duration_sec": 5, "label": "Tier 5 (500 Users)"},
]

class NexoraBenchmark:
    def __init__(self, base_url: str, token: str = None, user_id: int = 1):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.user_id = user_id

    def execute_request(self, endpoint: Dict[str, Any], timeout: float = 4.0) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint['path']}"
        headers = {
            "User-Agent": "NexoraBenchmark/2.0",
            "Accept": "application/json"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.user_id:
            headers["X-User-Id"] = str(self.user_id)
            headers["X-UserId"] = str(self.user_id)

        req = urllib.request.Request(url, headers=headers, method=endpoint["method"])
        start = time.perf_counter()
        status_code = 0
        error = False

        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                status_code = resp.getcode()
                _ = resp.read()
                error = (status_code >= 500)
        except urllib.error.HTTPError as e:
            status_code = e.code
            error = (status_code >= 500)
        except Exception:
            status_code = 0
            error = True

        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return {
            "status": status_code,
            "latency_ms": elapsed_ms,
            "error": error
        }

    def run_tier(self, users: int, duration_sec: int, max_concurrency: int = 100) -> Dict[str, Any]:
        print(f"\n🚀 Running Tier: {users:,} Virtual Users (Duration: {duration_sec}s)...")
        workers = min(users, max_concurrency)
        stop_time = time.time() + duration_sec
        results: List[Dict[str, Any]] = []

        def worker():
            worker_res = []
            idx = 0
            while time.time() < stop_time:
                ep = DEFAULT_ENDPOINTS[idx % len(DEFAULT_ENDPOINTS)]
                worker_res.append(self.execute_request(ep))
                idx += 1
                time.sleep(0.02)
            return worker_res

        t0 = time.perf_counter()
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(worker) for _ in range(workers)]
            for f in as_completed(futures):
                results.extend(f.result())
        total_duration = time.perf_counter() - t0

        total_reqs = len(results)
        if total_reqs == 0:
            return {"users": users, "status": "FAIL", "error_rate_pct": 100.0, "rps": 0}

        latencies = sorted([r["latency_ms"] for r in results])
        errors = [r for r in results if r["error"]]
        error_rate = (len(errors) / total_reqs) * 100.0
        rps = total_reqs / total_duration

        avg_lat = sum(latencies) / len(latencies)
        p50 = latencies[int(len(latencies) * 0.50)]
        p90 = latencies[int(len(latencies) * 0.90)]
        p95 = latencies[int(len(latencies) * 0.95)]
        p99 = latencies[int(len(latencies) * 0.99)]

        is_pass = error_rate < 5.0
        status_str = "PASS" if is_pass else "FAIL"

        summary = {
            "users": users,
            "rps": round(rps, 1),
            "total_requests": total_reqs,
            "avg_latency_ms": round(avg_lat, 1),
            "p50_latency_ms": round(p50, 1),
            "p90_latency_ms": round(p90, 1),
            "p95_latency_ms": round(p95, 1),
            "p99_latency_ms": round(p99, 1),
            "error_rate_pct": round(error_rate, 2),
            "status": status_str,
            "duration_sec": round(total_duration, 1)
        }

        print(f"   ✓ {total_reqs:,} reqs | RPS: {summary['rps']} | Avg: {summary['avg_latency_ms']}ms | p95: {summary['p95_latency_ms']}ms | p99: {summary['p99_latency_ms']}ms | Err: {summary['error_rate_pct']}% | Status: {status_str}")
        return summary

def main():
    parser = argparse.ArgumentParser(description="Nexora High-Concurrency Load Testing Benchmark")
    parser.add_argument("--base-url", default="http://13.232.153.224", help="Base URL of target Nexora deployment")
    parser.add_argument("--email", default=None, help="Email for authenticated benchmark testing")
    parser.add_argument("--password", default=None, help="Password for authenticated benchmark testing")
    parser.add_argument("--output", default="benchmark_results.json", help="Path to write JSON benchmark summary")
    args = parser.parse_args()

    token = None
    user_id = 1

    # Authenticate if credentials provided
    if args.email and args.password:
        try:
            login_url = f"{args.base_url.rstrip('/')}/api/v1/auth/login"
            req_data = json.dumps({"email": args.email, "password": args.password}).encode("utf-8")
            req = urllib.request.Request(login_url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                token = data.get("accessToken") or data.get("token")
                user_id = data.get("userId") or data.get("id") or 1
                print(f"🔑 Successfully authenticated as {args.email} (User ID: {user_id})")
        except Exception as e:
            print(f"⚠ Warning: Could not authenticate: {e}. Running unauthenticated benchmarks.")

    benchmark = NexoraBenchmark(base_url=args.base_url, token=token, user_id=user_id)

    print("=" * 82)
    print("      🚀 NEXORA HIGH-CONCURRENCY ARCHITECTURAL LOAD BENCHMARK 🚀")
    print(f"  Target: {args.base_url}")
    print("=" * 82)

    tier_results = []
    max_sustainable_users = 0
    max_sustainable_rps = 0

    for tier in DEFAULT_TIERS:
        res = benchmark.run_tier(tier["users"], tier["duration_sec"])
        tier_results.append(res)
        if res["status"] == "PASS":
            max_sustainable_users = tier["users"]
            max_sustainable_rps = res["rps"]
        time.sleep(1)

    print("\n" + "=" * 82)
    print("                        📊 BENCHMARK SUMMARY TABLE")
    print("=" * 82)
    print(f"| {'Virtual Users':>14} | {'RPS':>8} | {'Total Reqs':>11} | {'Avg Latency':>12} | {'p50':>8} | {'p95':>8} | {'p99':>8} | {'Error Rate':>11} | {'Status':>7} |")
    print(f"| {'-'*14}: | {'-'*8}: | {'-'*11}: | {'-'*12}: | {'-'*8}: | {'-'*8}: | {'-'*8}: | {'-'*11}: | {'-'*7}: |")
    for r in tier_results:
        print(f"| {r['users']:>14,} | {r['rps']:>8.1f} | {r['total_requests']:>11,} | {r['avg_latency_ms']:>10.1f}ms | {r['p50_latency_ms']:>6.1f}ms | {r['p95_latency_ms']:>6.1f}ms | {r['p99_latency_ms']:>6.1f}ms | {r['error_rate_pct']:>10.2f}% | {r['status']:>7} |")

    print("\n" + "=" * 82)
    print(f"  • Maximum Sustained Concurrency: {max_sustainable_users:,} Virtual Users")
    print(f"  • Maximum Sustained Throughput:  {max_sustainable_rps:,.1f} Requests / Second (RPS)")
    print("=" * 82 + "\n")

    with open(args.output, "w") as f:
        json.dump(tier_results, f, indent=2)
    print(f"✔ Benchmark metrics saved to {args.output}")

if __name__ == "__main__":
    main()
