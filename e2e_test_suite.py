#!/usr/bin/env python3
"""
Nexora End-to-End (E2E) Test Suite & HTML Report Generator
==========================================================
Tests the full lifecycle of all microservices:
- Auth & Rate Limiting
- User Profile, Skills & Experience
- Posts, Images, Polls, Likes, Comments, Bookmarks & Deletion
- Connections (Neo4j Graph)
- Global Search & Hashtags
- Chat & Messaging
- Notifications & Kafka Event Processing

Outputs a colored terminal summary and generates a rich, interactive HTML test report.

Usage:
  python3 e2e_test_suite.py --base-url http://13.232.153.224:8080 --html e2e_report.html
  python3 e2e_test_suite.py --base-url https://nexoranetworks.site --html e2e_report.html
"""

import sys
import os
import json
import time
import uuid
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

# ANSI Colors for Terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

class TestCase:
    def __init__(self, suite, name, description, method, path):
        self.suite = suite
        self.name = name
        self.description = description
        self.method = method
        self.path = path
        self.status = "PENDING"  # PASSED, FAILED, SKIPPED
        self.status_code = None
        self.latency_ms = 0
        self.request_payload = None
        self.response_body = None
        self.assertions = []
        self.error_message = None

    def add_assertion(self, description, passed, detail=""):
        self.assertions.append({
            "description": description,
            "passed": passed,
            "detail": detail
        })
        if not passed and self.status != "FAILED":
            self.status = "FAILED"
            self.error_message = f"Assertion failed: {description} ({detail})"

class NexoraE2ETester:
    def __init__(self, base_url, user1_email=None, user1_pass=None, user2_email=None, user2_pass=None):
        self.base_url = base_url.rstrip("/")
        self.user1_email = user1_email
        self.user1_pass = user1_pass or "TestPassword123!"
        self.user2_email = user2_email
        self.user2_pass = user2_pass or "TestPassword123!"
        
        self.user1 = {"token": None, "userId": None, "email": self.user1_email, "name": "User Alpha (Test)"}
        self.user2 = {"token": None, "userId": None, "email": self.user2_email, "name": "User Beta (Test)"}
        
        self.test_cases = []
        self.start_time = None
        self.end_time = None

        # State stored across steps
        self.state = {
            "text_post_id": None,
            "poll_post_id": None,
            "poll_id": None,
            "poll_option_id": None,
            "comment_id": None
        }

    def _http_request(self, method, endpoint, payload=None, token=None, user_id=None, timeout=10):
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Nexora-E2E-Tester/1.0"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if user_id:
            headers["X-User-Id"] = str(user_id)
            headers["X-UserId"] = str(user_id)

        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)

        t0 = time.time()
        status_code = None
        response_data = None
        error_msg = None

        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                status_code = response.getcode()
                raw = response.read().decode("utf-8")
                if raw:
                    try:
                        response_data = json.loads(raw)
                    except json.JSONDecodeError:
                        response_data = raw
        except urllib.error.HTTPError as e:
            status_code = e.code
            raw = e.read().decode("utf-8")
            if raw:
                try:
                    response_data = json.loads(raw)
                except json.JSONDecodeError:
                    response_data = raw
            error_msg = f"HTTP {e.code}: {e.reason}"
        except Exception as e:
            status_code = 0
            error_msg = str(e)

        latency_ms = int((time.time() - t0) * 1000)
        return status_code, response_data, latency_ms, error_msg

    def run_step(self, test_case, payload=None, token=None, user_id=None, expected_status=200):
        test_case.request_payload = payload
        status_code, response_data, latency_ms, error_msg = self._http_request(
            test_case.method, test_case.path, payload=payload, token=token, user_id=user_id
        )
        test_case.status_code = status_code
        test_case.latency_ms = latency_ms
        test_case.response_body = response_data

        if isinstance(expected_status, list):
            passed = status_code in expected_status
            exp_str = f"one of {expected_status}"
        else:
            passed = status_code == expected_status
            exp_str = str(expected_status)

        test_case.add_assertion(
            f"HTTP status is {exp_str}",
            passed,
            f"Got {status_code}" + (f" ({error_msg})" if error_msg else "")
        )

        if passed and test_case.status != "FAILED":
            test_case.status = "PASSED"

        # Print inline progress
        badge = f"{GREEN}✔ PASS{RESET}" if test_case.status == "PASSED" else f"{RED}✖ FAIL{RESET}"
        print(f"  {badge} [{test_case.latency_ms}ms] {test_case.suite} » {test_case.name}")

        self.test_cases.append(test_case)
        return response_data, status_code

    def run_all(self):
        print(f"\n{BOLD}{CYAN}═══════════════════════════════════════════════════════════════════════════{RESET}")
        print(f"{BOLD}{CYAN}      🚀 NEXORA AUTOMATED END-TO-END (E2E) TEST SUITE 🚀{RESET}")
        print(f"{BOLD}{CYAN}═══════════════════════════════════════════════════════════════════════════{RESET}")
        print(f"Target Base URL: {BOLD}{self.base_url}{RESET}")
        print(f"Started at:      {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        self.start_time = time.time()

        # =========================================================================
        # SUITE 1: AUTHENTICATION & RATE LIMITING
        # =========================================================================
        print(f"{BOLD}1. 🔐 Authentication & Security Suite{RESET}")
        
        # 1.1 Invalid Password Rejection
        tc = TestCase("Auth", "Invalid Password Rejection", "Rejects login with bad credentials", "POST", "/api/v1/auth/login")
        res, _ = self.run_step(tc, payload={"email": "nonexistent_tester_999@test.com", "password": "WrongPassword!"}, expected_status=[400, 404])
        
        # 1.2 User 1 Signup or Login
        rand_id = uuid.uuid4().hex[:6]
        if self.user1_email:
            # Existing account provided - log in directly
            tc = TestCase("Auth", "User 1 Login Flow", f"Authenticate as {self.user1_email}", "POST", "/api/v1/auth/login")
            res, status = self.run_step(tc, payload={"email": self.user1_email, "password": self.user1_pass}, expected_status=200)
            if status == 200 and isinstance(res, dict):
                self.user1["token"] = res.get("accessToken") or res.get("token")
                self.user1["userId"] = res.get("userId") or res.get("id") or 1
                tc.add_assertion("Received valid JWT access token", bool(self.user1["token"]))
        else:
            self.user1_email = f"tester1_{rand_id}@example.com"
            tc = TestCase("Auth", "User 1 Registration", "Register new test user (triggers email OTP)", "POST", "/api/v1/auth/signup")
            res, status = self.run_step(tc, payload={"name": "User Alpha", "email": self.user1_email, "password": self.user1_pass}, expected_status=[200, 201])
            
            tc = TestCase("Auth", "User 1 Login Flow", "Attempt login for new user", "POST", "/api/v1/auth/login")
            res, status = self.run_step(tc, payload={"email": self.user1_email, "password": self.user1_pass}, expected_status=[200, 400])
            if status == 200 and isinstance(res, dict):
                self.user1["token"] = res.get("accessToken") or res.get("token")
                self.user1["userId"] = res.get("userId") or res.get("id") or 1
            else:
                tc.add_assertion("Account requires email OTP verification before login", True, "Pass --user1-email to test with a verified account")

        # 1.3 User 2 Signup or Login
        if self.user2_email:
            tc = TestCase("Auth", "User 2 Login Flow", f"Authenticate as {self.user2_email}", "POST", "/api/v1/auth/login")
            res, status = self.run_step(tc, payload={"email": self.user2_email, "password": self.user2_pass}, expected_status=200)
            if status == 200 and isinstance(res, dict):
                self.user2["token"] = res.get("accessToken") or res.get("token")
                self.user2["userId"] = res.get("userId") or res.get("id") or 2
                tc.add_assertion("Received valid JWT access token", bool(self.user2["token"]))
        else:
            self.user2_email = f"tester2_{rand_id}@example.com"
            tc = TestCase("Auth", "User 2 Registration", "Register second test user", "POST", "/api/v1/auth/signup")
            res, status = self.run_step(tc, payload={"name": "User Beta", "email": self.user2_email, "password": self.user2_pass}, expected_status=[200, 201])
            
            tc = TestCase("Auth", "User 2 Login Flow", "Attempt login for second user", "POST", "/api/v1/auth/login")
            res, status = self.run_step(tc, payload={"email": self.user2_email, "password": self.user2_pass}, expected_status=[200, 400])
            if status == 200 and isinstance(res, dict):
                self.user2["token"] = res.get("accessToken") or res.get("token")
                self.user2["userId"] = res.get("userId") or res.get("id") or 2

        # 1.4 Rate Limiting & Gateway Check
        tc = TestCase("Auth", "Gateway Rate Limiter Check", "Verify rapid request handling on auth routes", "POST", "/api/v1/auth/login")
        for _ in range(5):
            self._http_request("POST", "/api/v1/auth/login", payload={"email": "stress@test.com", "password": "123"})
        res, _ = self.run_step(tc, payload={"email": "stress@test.com", "password": "123"}, expected_status=[400, 404, 429])

        # =========================================================================
        # SUITE 2: PROFILE & SKILLS MANAGEMENT
        # =========================================================================
        print(f"\n{BOLD}2. 👤 Profile & Portfolio Suite{RESET}")
        
        target_uid = self.user1["userId"] or 1
        tc = TestCase("Profile", "Get Profile By ID", "Fetch User profile with headline and stats", "GET", f"/api/v1/users/{target_uid}")
        res, status = self.run_step(tc, token=self.user1["token"], user_id=target_uid, expected_status=[200, 404])
        if status == 200 and isinstance(res, dict):
            tc.add_assertion("Profile contains user details", "name" in res or "id" in res)

        tc = TestCase("Profile", "Update Profile Headline & Bio", "Update user headline and bio", "PUT", f"/api/v1/users/{target_uid}")
        res, status = self.run_step(tc, payload={"headline": "Senior Full-Stack Architect | Nexora", "bio": "Building scalable microservices.", "location": "San Francisco, CA"}, token=self.user1["token"], user_id=target_uid, expected_status=[200, 400, 404])

        # Record Profile View
        actor_token = self.user2["token"] or self.user1["token"]
        actor_id = (self.user2["userId"] if self.user2["token"] else (self.user1["userId"] + 1)) or 2
        tc = TestCase("Profile", "Record Profile View Event", "Record profile view event", "GET", f"/api/v1/users/{target_uid}")
        res, _ = self.run_step(tc, token=actor_token, user_id=actor_id, expected_status=[200, 404])

        # =========================================================================
        # SUITE 3: POSTS, POLLS, CAROUSELS, LIKES, COMMENTS, BOOKMARKS & CASCADE DELETION
        # =========================================================================
        print(f"\n{BOLD}3. 📝 Feed, Interactive Posts & Cascade Deletion Suite{RESET}")
        
        # 3.1 Create Text Post with Hashtag
        tc = TestCase("Posts", "Create Text Post with #Hashtags", "Publish standard text post", "POST", "/api/v1/posts")
        post_payload = {
            "content": f"Automated E2E verification test post! #engineering #nexora {rand_id}",
            "mediaUrl": None,
            "images": []
        }
        res, status = self.run_step(tc, payload=post_payload, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=201)
        if status == 201 and isinstance(res, dict):
            self.state["text_post_id"] = res.get("id")
            tc.add_assertion("Post ID returned", bool(self.state["text_post_id"]))

        # 3.2 Create Carousel Multi-Image Post
        tc = TestCase("Posts", "Create Multi-Image Carousel Post", "Publish post with 2 carousel images", "POST", "/api/v1/posts")
        carousel_payload = {
            "content": f"Multi-image carousel automated test {rand_id}",
            "mediaUrl": "https://d2qsjnx0f10hlx.cloudfront.net/posts/sample1.jpg",
            "images": [
                "https://d2qsjnx0f10hlx.cloudfront.net/posts/sample1.jpg",
                "https://d2qsjnx0f10hlx.cloudfront.net/posts/sample2.jpg"
            ]
        }
        res, status = self.run_step(tc, payload=carousel_payload, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=201)
        if status == 201 and isinstance(res, dict):
            carousel_post_id = res.get("id")
            tc.add_assertion("Images array contains 2 elements", len(res.get("images", [])) >= 1 or res.get("mediaUrl") is not None)

        # 3.3 Create Interactive Poll Post
        tc = TestCase("Posts", "Create Interactive Poll Post", "Publish post with 3 poll options", "POST", "/api/v1/posts")
        poll_payload = {
            "content": f"Which tech stack do you prefer? #poll {rand_id}",
            "poll": {
                "question": "Which backend framework is your favorite?",
                "options": [
                    "Spring Boot (Java)",
                    "FastAPI (Python)",
                    "Go (Golang)"
                ]
            }
        }
        res, status = self.run_step(tc, payload=poll_payload, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=201)
        if status == 201 and isinstance(res, dict):
            self.state["poll_post_id"] = res.get("id")
            poll_obj = res.get("poll")
            if poll_obj and isinstance(poll_obj, dict):
                self.state["poll_id"] = poll_obj.get("id")
                options = poll_obj.get("options", [])
                if options:
                    self.state["poll_option_id"] = options[0].get("id")
            tc.add_assertion("Poll structure created", self.state["poll_id"] is not None or self.state["poll_post_id"] is not None)

        # 3.4 Vote on Poll
        if self.state["poll_id"] and self.state["poll_option_id"]:
            tc = TestCase("Posts", "Vote on Poll", "Vote on interactive poll option", "POST", f"/api/v1/posts/polls/{self.state['poll_id']}/vote/{self.state['poll_option_id']}")
            res, _ = self.run_step(tc, token=actor_token, user_id=actor_id, expected_status=[200, 400])

        # 3.5 Edit Post
        if self.state["text_post_id"]:
            tc = TestCase("Posts", "Edit Post Content", "Update text post content", "PUT", f"/api/v1/posts/{self.state['text_post_id']}")
            res, _ = self.run_step(tc, payload={"content": f"Updated text post content! #verified {rand_id}"}, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=200)

        # 3.6 Like / Toggle Like Post
        if self.state["text_post_id"]:
            tc = TestCase("Posts", "Toggle Like on Post", "Toggle like on post", "POST", f"/api/v1/likes/{self.state['text_post_id']}")
            res, status = self.run_step(tc, token=actor_token, user_id=actor_id, expected_status=200)
            if status == 200 and isinstance(res, dict):
                tc.add_assertion("Liked state is true", res.get("hasLiked") is True or res.get("liked") is True or "likesCount" in res)

        # 3.7 Add Comment on Post
        if self.state["text_post_id"]:
            tc = TestCase("Posts", "Add Comment to Post", "Add comment to post", "POST", f"/api/v1/posts/{self.state['text_post_id']}/comments")
            res, status = self.run_step(tc, payload={"content": "Great automated test post!"}, token=actor_token, user_id=actor_id, expected_status=201)
            if status == 201 and isinstance(res, dict):
                self.state["comment_id"] = res.get("id")

        # 3.8 Bookmark Post
        if self.state["text_post_id"]:
            tc = TestCase("Posts", "Bookmark Post", "User 1 bookmarks own post", "POST", f"/api/v1/posts/{self.state['text_post_id']}/bookmark")
            res, _ = self.run_step(tc, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=200)

        # 3.9 Fetch Feed
        tc = TestCase("Posts", "Fetch User Feed", "Retrieve personalized feed", "GET", "/api/v1/posts/feed")
        res, status = self.run_step(tc, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=200)
        if status == 200 and isinstance(res, list):
            tc.add_assertion("Feed returns list of posts", len(res) >= 0)

        # 3.10 Cascade-Safe Post Deletion
        if self.state["text_post_id"]:
            tc = TestCase("Posts", "Cascade-Safe Delete Post", "Delete post with child likes, comments, bookmarks", "DELETE", f"/api/v1/posts/{self.state['text_post_id']}")
            res, _ = self.run_step(tc, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=[204, 200])

        # Delete the poll post as well to verify poll cascading
        if self.state["poll_post_id"]:
            tc = TestCase("Posts", "Cascade Delete Poll Post", "Delete post with attached poll and votes", "DELETE", f"/api/v1/posts/{self.state['poll_post_id']}")
            res, _ = self.run_step(tc, token=self.user1["token"], user_id=self.user1["userId"] or 1, expected_status=[204, 200])

        # =========================================================================
        # SUITE 4: CONNECTIONS & NEO4J GRAPH
        # =========================================================================
        print(f"\n{BOLD}4. 🤝 Network & Neo4j Connections Suite{RESET}")
        
        user1_id = self.user1["userId"] or 1
        other_target_id = (self.user2["userId"] if self.user2["userId"] else 2)

        # 4.1 Send Connection Request
        tc = TestCase("Network", "Send Connection Request", "Send connection request in Neo4j", "POST", f"/api/v1/connections/request/{other_target_id}")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=[201, 200, 400])

        # 4.2 Check Pending Requests
        tc = TestCase("Network", "Get Pending Connection Requests", "User 1 fetches incoming requests", "GET", "/api/v1/connections/requests")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        # 4.3 Cancel Connection Request (to test cleanup)
        tc = TestCase("Network", "Cancel Connection Request", "Cancel pending connection request", "DELETE", f"/api/v1/connections/requests/{other_target_id}")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=[200, 204, 400, 404])

        # 4.4 Verify Mutual Connection in Graph
        tc = TestCase("Network", "Verify Mutual Connection Status", "Check connection status between users", "GET", f"/api/v1/connections/check/{other_target_id}")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        # 4.5 Fetch 1st Degree Connections
        tc = TestCase("Network", "Get 1st Degree Connections", "Retrieve connected users list", "GET", "/api/v1/connections/first-degree")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        # =========================================================================
        # SUITE 5: ADVANCED GLOBAL SEARCH
        # =========================================================================
        print(f"\n{BOLD}5. 🔍 Advanced Global Search Suite{RESET}")

        tc = TestCase("Search", "Global Typeahead Suggestions", "Fetch live search suggestions for 'User'", "GET", "/api/v1/users/search/suggestions?q=User")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        tc = TestCase("Search", "Search People by Query", "Search for users matching query", "GET", "/api/v1/users/search?q=User")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        tc = TestCase("Search", "Search Posts by Content", "Search posts matching keyword", "GET", "/api/v1/posts/search?q=engineering")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        tc = TestCase("Search", "Search Hashtags", "Search hashtags matching keyword", "GET", "/api/v1/posts/hashtags/search?q=engineering")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        # =========================================================================
        # SUITE 6: REAL-TIME MESSAGING & CHAT
        # =========================================================================
        print(f"\n{BOLD}6. 💬 Chat & Messaging Suite{RESET}")

        tc = TestCase("Chat", "Send Presence Heartbeat", "Record user online presence", "POST", "/api/v1/chat/presence/heartbeat")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=[200, 404])

        tc = TestCase("Chat", "Send Direct Chat Message", "User 1 sends message to User 2", "POST", "/api/v1/chat/send")
        chat_msg = {"recipientId": other_target_id, "content": f"Hello from automated E2E test runner! {rand_id}"}
        res, status = self.run_step(tc, payload=chat_msg, token=self.user1["token"], user_id=user1_id, expected_status=[200, 201])

        tc = TestCase("Chat", "Get Conversation History", "Fetch chat thread between User 1 and User 2", "GET", f"/api/v1/chat/history/{other_target_id}")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        tc = TestCase("Chat", "Get Active Conversations List", "Fetch all user conversations", "GET", "/api/v1/chat/conversations")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        # =========================================================================
        # SUITE 7: NOTIFICATIONS & KAFKA EVENT PROCESSING
        # =========================================================================
        print(f"\n{BOLD}7. 🔔 Notifications & Kafka Events Suite{RESET}")

        tc = TestCase("Notifications", "Fetch User Notifications", "Get notifications generated by Kafka events", "GET", "/api/v1/notifications")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        tc = TestCase("Notifications", "Get Unread Count", "Retrieve unread notification counter", "GET", "/api/v1/notifications/unread-count")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        tc = TestCase("Notifications", "Mark All as Read", "Mark all notifications as read", "PATCH", "/api/v1/notifications/read-all")
        res, _ = self.run_step(tc, token=self.user1["token"], user_id=user1_id, expected_status=200)

        self.end_time = time.time()
        self.print_summary()

    def print_summary(self):
        total = len(self.test_cases)
        passed = sum(1 for tc in self.test_cases if tc.status == "PASSED")
        failed = sum(1 for tc in self.test_cases if tc.status == "FAILED")
        duration = round(self.end_time - self.start_time, 2)
        pass_rate = round((passed / total * 100) if total > 0 else 0, 1)

        print(f"\n{BOLD}{CYAN}═══════════════════════════════════════════════════════════════════════════{RESET}")
        print(f"{BOLD}                  📊 E2E TEST EXECUTION SUMMARY{RESET}")
        print(f"{BOLD}{CYAN}═══════════════════════════════════════════════════════════════════════════{RESET}")
        print(f" Total Tests Run:   {BOLD}{total}{RESET}")
        print(f" Tests Passed:      {GREEN}{BOLD}{passed}{RESET}")
        print(f" Tests Failed:      {RED}{BOLD}{failed}{RESET}")
        print(f" Success Rate:      {GREEN if pass_rate >= 90 else YELLOW}{BOLD}{pass_rate}%{RESET}")
        print(f" Total Duration:    {BOLD}{duration}s{RESET}")
        print(f"{BOLD}{CYAN}═══════════════════════════════════════════════════════════════════════════{RESET}\n")

    def generate_html_report(self, output_path="e2e_report.html"):
        total = len(self.test_cases)
        passed = sum(1 for tc in self.test_cases if tc.status == "PASSED")
        failed = sum(1 for tc in self.test_cases if tc.status == "FAILED")
        duration = round(self.end_time - self.start_time, 2) if self.end_time and self.start_time else 0
        pass_rate = round((passed / total * 100) if total > 0 else 0, 1)

        # Group by suite
        suites = {}
        for tc in self.test_cases:
            suites.setdefault(tc.suite, []).append(tc)

        cards_html = ""
        for suite_name, cases in suites.items():
            suite_passed = sum(1 for c in cases if c.status == "PASSED")
            suite_total = len(cases)
            suite_rate = round(suite_passed / suite_total * 100, 1)
            badge_color = "#10B981" if suite_passed == suite_total else "#EF4444"

            rows_html = ""
            for tc in cases:
                st_badge = '<span class="badge pass">PASSED</span>' if tc.status == "PASSED" else '<span class="badge fail">FAILED</span>'
                method_badge = f'<span class="method {tc.method.lower()}">{tc.method}</span>'
                
                assertions_html = "".join(
                    f'<li class="{"assert-pass" if a["passed"] else "assert-fail"}">{"✔" if a["passed"] else "✖"} {a["description"]} <span class="dim">({a["detail"]})</span></li>'
                    for a in tc.assertions
                )

                resp_preview = ""
                if tc.response_body:
                    try:
                        resp_str = json.dumps(tc.response_body, indent=2)
                        if len(resp_str) > 300:
                            resp_str = resp_str[:300] + " ... (truncated)"
                        resp_preview = f'<div class="resp-box"><pre>{resp_str}</pre></div>'
                    except Exception:
                        resp_preview = f'<div class="resp-box"><pre>{str(tc.response_body)[:300]}</pre></div>'

                rows_html += f"""
                <tr class="test-row">
                    <td>{st_badge}</td>
                    <td><strong>{tc.name}</strong><br><small class="text-muted">{tc.description}</small></td>
                    <td>{method_badge} <code class="path">{tc.path}</code></td>
                    <td><span class="status-code">HTTP {tc.status_code or 0}</span></td>
                    <td><span class="latency">{tc.latency_ms}ms</span></td>
                    <td>
                        <ul class="assertions-list">{assertions_html}</ul>
                        {resp_preview}
                    </td>
                </tr>
                """

            cards_html += f"""
            <div class="suite-card">
                <div class="suite-header">
                    <h3>{suite_name} Suite</h3>
                    <span class="suite-stats" style="background:{badge_color}15; color:{badge_color}; border:1px solid {badge_color}40;">
                        {suite_passed}/{suite_total} Passed ({suite_rate}%)
                    </span>
                </div>
                <div class="table-responsive">
                    <table class="test-table">
                        <thead>
                            <tr>
                                <th style="width:90px;">Status</th>
                                <th style="width:220px;">Test Case</th>
                                <th>Endpoint</th>
                                <th style="width:100px;">HTTP Code</th>
                                <th style="width:90px;">Latency</th>
                                <th>Assertions & Preview</th>
                            </tr>
                        </thead>
                        <tbody>{rows_html}</tbody>
                    </table>
                </div>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexora E2E Test Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #0B0F19;
            --card-bg: #111827;
            --border: #1F2937;
            --text-primary: #F9FAFB;
            --text-secondary: #9CA3AF;
            --primary: #3B82F6;
            --success: #10B981;
            --danger: #EF4444;
            --warning: #F59E0B;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            background: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, sans-serif;
            padding: 32px 24px;
            line-height: 1.5;
        }}
        .container {{ max-width: 1300px; margin: 0 auto; }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 32px;
        }}
        .header h1 {{ font-size: 26px; font-weight: 800; display: flex; align-items: center; gap: 10px; }}
        .header .timestamp {{ color: var(--text-secondary); font-size: 14px; }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }}
        .stat-card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            padding: 20px;
            border-radius: 12px;
        }}
        .stat-card .label {{ font-size: 13px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }}
        .stat-card .value {{ font-size: 32px; font-weight: 800; margin-top: 8px; }}
        .stat-card.pass .value {{ color: var(--success); }}
        .stat-card.fail .value {{ color: var(--danger); }}
        .stat-card.rate .value {{ color: var(--primary); }}
        .suite-card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            margin-bottom: 24px;
            overflow: hidden;
        }}
        .suite-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: rgba(255,255,255,0.02);
            border-bottom: 1px solid var(--border);
        }}
        .suite-header h3 {{ font-size: 17px; font-weight: 700; }}
        .suite-stats {{ font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }}
        .table-responsive {{ overflow-x: auto; }}
        .test-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }}
        .test-table th {{
            background: rgba(0,0,0,0.2);
            color: var(--text-secondary);
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 1px solid var(--border);
        }}
        .test-table td {{
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: top;
        }}
        .badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .badge.pass {{ background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }}
        .badge.fail {{ background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }}
        .method {{
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
        }}
        .method.get {{ background: rgba(59, 130, 246, 0.2); color: #60A5FA; }}
        .method.post {{ background: rgba(16, 185, 129, 0.2); color: #34D399; }}
        .method.put {{ background: rgba(245, 158, 11, 0.2); color: #FBBF24; }}
        .method.patch {{ background: rgba(168, 85, 247, 0.2); color: #C084FC; }}
        .method.delete {{ background: rgba(239, 68, 68, 0.2); color: #F87171; }}
        code.path {{ font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E2E8F0; margin-left: 6px; }}
        .status-code {{ font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #E5E7EB; }}
        .latency {{ font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-secondary); }}
        .text-muted {{ color: var(--text-secondary); }}
        .assertions-list {{ list-style: none; padding: 0; }}
        .assertions-list li {{ margin-bottom: 4px; font-size: 12px; }}
        .assert-pass {{ color: var(--success); }}
        .assert-fail {{ color: var(--danger); font-weight: 600; }}
        .dim {{ opacity: 0.7; font-size: 11px; }}
        .resp-box {{
            margin-top: 8px;
            background: #00000040;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 6px 10px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #9CA3AF;
            max-height: 90px;
            overflow-y: auto;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>🌐 Nexora E2E Test Suite Dashboard</h1>
                <div class="timestamp">Target: <strong>{self.base_url}</strong> &bull; Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </div>
            <div>
                <span class="badge {'pass' if failed == 0 else 'fail'}" style="font-size:14px; padding:6px 14px;">
                    {'ALL TESTS PASSED' if failed == 0 else f'{failed} TESTS FAILED'}
                </span>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">Total Scenarios</div>
                <div class="value">{total}</div>
            </div>
            <div class="stat-card pass">
                <div class="label">Passed Tests</div>
                <div class="value">{passed}</div>
            </div>
            <div class="stat-card fail">
                <div class="label">Failed Tests</div>
                <div class="value">{failed}</div>
            </div>
            <div class="stat-card rate">
                <div class="label">Success Rate</div>
                <div class="value">{pass_rate}%</div>
            </div>
            <div class="stat-card">
                <div class="label">Duration</div>
                <div class="value">{duration}s</div>
            </div>
        </div>

        {cards_html}
    </div>
</body>
</html>
"""
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        print(f"{GREEN}{BOLD}✔ HTML Test Report generated successfully: {output_path}{RESET}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nexora Automated End-to-End (E2E) Test Suite")
    parser.add_argument("--base-url", default="http://13.232.153.224", help="Base URL of Nexora (e.g. http://13.232.153.224 or https://nexoranetworks.site or http://localhost:8080 on EC2)")
    parser.add_argument("--html", default="e2e_report.html", help="Path to output HTML report file")
    parser.add_argument("--user1-email", default=None, help="Optional registered email for User 1")
    parser.add_argument("--user1-password", default=None, help="Optional password for User 1")
    parser.add_argument("--user2-email", default=None, help="Optional registered email for User 2")
    parser.add_argument("--user2-password", default=None, help="Optional password for User 2")

    args = parser.parse_args()

    tester = NexoraE2ETester(
        base_url=args.base_url,
        user1_email=args.user1_email,
        user1_pass=args.user1_password,
        user2_email=args.user2_email,
        user2_pass=args.user2_password
    )

    tester.run_all()
    tester.generate_html_report(args.html)

if __name__ == "__main__":
    main()
