"""
SynkHub - Load Test API HTTP (v2)
Usage: python -m tests.load.test_api_load
"""
import requests
import time
import statistics
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field

BASE_URL = "http://localhost:8000"
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

THRESHOLD_P95_MS = 5000
THRESHOLD_ERROR_RATE = 0.10


@dataclass
class TestResult:
    name: str
    status_codes: list = field(default_factory=list)
    response_times: list = field(default_factory=list)
    errors: int = 0

    @property
    def avg_ms(self):
        return statistics.mean(self.response_times) * 1000 if self.response_times else 0

    @property
    def p50_ms(self):
        s = sorted(self.response_times)
        idx = len(s) // 2
        return s[idx] * 1000 if s else 0

    @property
    def p95_ms(self):
        s = sorted(self.response_times)
        idx = int(len(s) * 0.95)
        return s[idx] * 1000 if s else 0

    @property
    def p99_ms(self):
        s = sorted(self.response_times)
        idx = int(len(s) * 0.99)
        return s[min(idx, len(s) - 1)] * 1000 if s else 0

    @property
    def rps(self):
        if not self.response_times:
            return 0
        total_time = max(self.response_times)
        return len(self.response_times) / total_time if total_time > 0 else 0

    @property
    def error_rate(self):
        return self.errors / len(self.status_codes) if self.status_codes else 0

    def passes_thresholds(self):
        if self.p95_ms > THRESHOLD_P95_MS:
            return False, f"p95={self.p95_ms:.0f}ms > {THRESHOLD_P95_MS}ms"
        if self.error_rate > THRESHOLD_ERROR_RATE:
            return False, f"error_rate={self.error_rate:.1%} > {THRESHOLD_ERROR_RATE:.0%}"
        return True, "OK"

    def summary(self):
        success = sum(1 for s in self.status_codes if 200 <= s < 400)
        return {
            "name": self.name,
            "total_requests": len(self.status_codes),
            "success": success,
            "errors": self.errors,
            "avg_ms": round(self.avg_ms, 1),
            "p50_ms": round(self.p50_ms, 1),
            "p95_ms": round(self.p95_ms, 1),
            "p99_ms": round(self.p99_ms, 1),
            "rps": round(self.rps, 1),
            "error_rate": round(self.error_rate * 100, 2),
        }


def timed_request(method, url, **kwargs):
    start = time.time()
    try:
        resp = requests.request(method, url, timeout=10, **kwargs)
        elapsed = time.time() - start
        return resp.status_code, elapsed, None
    except Exception as e:
        elapsed = time.time() - start
        return 0, elapsed, str(e)


def get_auth_token():
    ts = int(time.time())
    email = f"loadtest_{ts}@test.com"
    payload = {"email": email, "password": "Test1234!", "username": f"loadtest_{ts}"}

    for attempt in range(3):
        try:
            resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=5)
            if resp.status_code == 200:
                return resp.json().get("access_token")
            if resp.status_code == 400:
                break
        except requests.exceptions.ConnectionError:
            print(f"      Serveur pas encore pret (tentative {attempt+1}/3)...")
            time.sleep(2)

    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login",
                             json={"email": email, "password": "Test1234!"}, timeout=5)
        if resp.status_code == 200:
            return resp.json().get("access_token")
    except requests.exceptions.ConnectionError:
        pass
    return None


def run_endpoint_test(name, method, url, token=None, json_data=None, count=50, concurrency=10):
    result = TestResult(name=name)
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    def worker(_):
        status, elapsed, err = timed_request(method, url, headers=headers, json=json_data)
        return status, elapsed, err

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker, i) for i in range(count)]
        for future in as_completed(futures):
            status, elapsed, err = future.result()
            result.status_codes.append(status)
            result.response_times.append(elapsed)
            if err:
                result.errors += 1

    return result


def print_result(result):
    s = result.summary()
    passed, msg = result.passes_thresholds()
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {s['name']:35s} | {s['total_requests']:4d} req | "
          f"{s['avg_ms']:7.1f}ms avg | {s['p50_ms']:7.1f}ms p50 | "
          f"{s['p95_ms']:7.1f}ms p95 | {s['p99_ms']:7.1f}ms p99 | "
          f"{s['rps']:6.1f} rps | {s['errors']} errors")
    return passed


def run_all_tests():
    print("=" * 90)
    print("SynkHub - Load Test API HTTP (v2)")
    print("=" * 90)

    all_results = []
    token = get_auth_token()
    if not token:
        print("ERREUR: Impossible d'obtenir un token. Le serveur est-il lance?")
        return

    headers = {"Authorization": f"Bearer {token}"}

    ws_id = None
    board_id = None
    try:
        r = requests.post(f"{BASE_URL}/api/workspaces/", json={"name": "LoadTestWS"}, headers=headers, timeout=5)
        if r.status_code == 200:
            ws_id = r.json()["id"]
        r = requests.post(f"{BASE_URL}/api/workspaces/{ws_id}/boards", json={"title": "LoadTestBoard"}, headers=headers, timeout=5)
        if r.status_code == 200:
            board_id = r.json()["id"]
    except Exception:
        pass

    email = f"loadtest_{int(time.time())}@test.com"

    tests = [
        ("[1/9] Auth - Register", "POST", f"{BASE_URL}/api/auth/register",
         {"email": email, "password": "Test1234!", "username": f"lt_{int(time.time())}"}, 20, 5),
        ("[2/9] Auth - Login", "POST", f"{BASE_URL}/api/auth/login",
         {"email": email, "password": "Test1234!"}, 50, 10),
        ("[3/9] Auth - Get /me (JWT)", "GET", f"{BASE_URL}/api/auth/me", None, 50, 10),
        ("[4/9] Workspaces - List", "GET", f"{BASE_URL}/api/workspaces/", None, 50, 10),
    ]

    if ws_id:
        tests.append(("[5/9] Boards - List", "GET", f"{BASE_URL}/api/workspaces/{ws_id}/boards", None, 50, 10))
    if board_id:
        tests.append(("[6/9] Postits - Get All", "GET", f"{BASE_URL}/api/boards/{board_id}/postits", None, 50, 10))
        tests.append(("[7/9] Postits - Create (Write)", "POST", f"{BASE_URL}/api/boards/{board_id}/postits",
                     {"content": "Load test postit", "color": "#FBBF24"}, 30, 5))

    tests.append(("[8/9] Stress Test (100 users x 3 req)", "GET", f"{BASE_URL}/api/auth/me", None, 300, 100))

    for label, method, url, data, count, conc in tests:
        print(f"\n{label}...")
        r = run_endpoint_test(label.split("] ")[1], method, url, token=token, json_data=data, count=count, concurrency=conc)
        all_results.append(r)
        print_result(r)

    print(f"\n[9/9] Concurrent Mixed Load (50 users x 4 endpoints)...")
    urls = [
        ("GET", f"{BASE_URL}/api/auth/me"),
        ("GET", f"{BASE_URL}/api/workspaces/"),
    ]
    if ws_id:
        urls.append(("GET", f"{BASE_URL}/api/workspaces/{ws_id}/boards"))
    if board_id:
        urls.append(("GET", f"{BASE_URL}/api/boards/{board_id}/postits"))
    mixed = TestResult(name="Mixed Load")
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = []
        for _ in range(4):
            for method, url in urls:
                futures.append(executor.submit(timed_request, method, url, headers=headers))
        for f in as_completed(futures):
            status, elapsed, err = f.result()
            mixed.status_codes.append(status)
            mixed.response_times.append(elapsed)
            if err:
                mixed.errors += 1
    all_results.append(mixed)
    print_result(mixed)

    print("\n" + "=" * 90)
    print("RESUME FINAL")
    print("=" * 90)
    total_req = 0
    total_err = 0
    all_pass = True
    for r in all_results:
        s = r.summary()
        total_req += s["total_requests"]
        total_err += s["errors"]
        passed, msg = r.passes_thresholds()
        if not passed:
            all_pass = False
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {s['name']:35s} | {s['total_requests']:4d} req | "
              f"{s['avg_ms']:7.1f}ms avg | {s['p50_ms']:7.1f}ms p50 | "
              f"{s['rps']:6.1f} rps | {s['errors']} errors")

    print(f"\nTotal: {total_req} requests | {total_err} errors")
    verdict = "TOUS LES TESTS PASSENT" if all_pass else "CERTAINS TESTS ONT ECHOUE"
    print(f"Verdict: {verdict}")

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "thresholds": {"p95_ms": THRESHOLD_P95_MS, "error_rate_pct": THRESHOLD_ERROR_RATE * 100},
        "results": [r.summary() for r in all_results],
        "verdict": verdict,
    }
    report_path = os.path.join(RESULTS_DIR, f"load_{time.strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nRapport sauvegarde: {report_path}")
    print("Termine.")


if __name__ == "__main__":
    run_all_tests()
