"""
SynkHub - Load Test WebSocket (v2)
Usage: python -m tests.load.test_websocket_load [num_clients] [duration]
"""
import websocket
import json
import time
import threading
import statistics
import os
import requests
from dataclasses import dataclass, field

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)


@dataclass
class WSResult:
    connections: int = 0
    messages_sent: int = 0
    messages_received: int = 0
    connect_times: list = field(default_factory=list)
    send_times: list = field(default_factory=list)
    recv_times: list = field(default_factory=list)
    errors: int = 0
    latencies: list = field(default_factory=list)

    @property
    def avg_connect_ms(self):
        return statistics.mean(self.connect_times) * 1000 if self.connect_times else 0

    @property
    def p95_connect_ms(self):
        s = sorted(self.connect_times)
        idx = int(len(s) * 0.95)
        return s[min(idx, len(s) - 1)] * 1000 if s else 0

    @property
    def avg_send_ms(self):
        return statistics.mean(self.send_times) * 1000 if self.send_times else 0

    @property
    def throughput(self):
        return self.messages_sent / max(self.connect_times[-1] - self.connect_times[0], 0.01) if self.connect_times else 0

    def summary(self):
        return {
            "connections": self.connections,
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "avg_connect_ms": round(self.avg_connect_ms, 1),
            "p95_connect_ms": round(self.p95_connect_ms, 1),
            "avg_send_ms": round(self.avg_send_ms, 1),
            "throughput_msg_per_sec": round(self.throughput, 1),
            "errors": self.errors,
        }


class WSTestClient:
    def __init__(self, board_id, user_id, username, result):
        self.board_id = board_id
        self.user_id = user_id
        self.username = username
        self.result = result
        self.ws = None
        self.connected = False

    def on_open(self, ws):
        self.connected = True
        self.result.connections += 1

    def on_message(self, ws, message):
        self.result.messages_received += 1

    def on_error(self, ws, error):
        self.result.errors += 1

    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False

    def connect(self):
        url = f"{WS_URL}/{self.board_id}?user_id={self.user_id}&username={self.username}"
        start = time.time()
        try:
            self.ws = websocket.WebSocketApp(
                url,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close,
            )
            t = threading.Thread(target=self.ws.run_forever, daemon=True)
            t.start()
            time.sleep(1.0)
            elapsed = time.time() - start
            self.result.connect_times.append(elapsed)
            return True
        except Exception:
            self.result.errors += 1
            return False

    def send_cursor(self, x, y):
        if not self.connected:
            return
        msg = json.dumps({"type": "cursor:move", "data": {"x": x, "y": y}})
        start = time.time()
        try:
            self.ws.send(msg)
            elapsed = time.time() - start
            self.result.send_times.append(elapsed)
            self.result.messages_sent += 1
        except Exception:
            self.result.errors += 1

    def send_postit_event(self):
        if not self.connected:
            return
        msg = json.dumps({"type": "postit:moved", "data": {"id": 1, "x_pos": 100, "y_pos": 200}})
        start = time.time()
        try:
            self.ws.send(msg)
            elapsed = time.time() - start
            self.result.send_times.append(elapsed)
            self.result.messages_sent += 1
        except Exception:
            self.result.errors += 1

    def disconnect(self):
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass


def create_test_board():
    email = f"ws_load_{int(time.time())}@test.com"
    password = "Test1234!"
    token = None

    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": password, "username": f"ws_load_{int(time.time())}"
        }, timeout=5)
        if r.status_code == 200:
            token = r.json()["access_token"]
        else:
            r = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email, "password": password
            }, timeout=5)
            if r.status_code == 200:
                token = r.json()["access_token"]
    except Exception as e:
        print(f"  [ERR] Auth failed: {e}")
        return None

    if not token:
        print(f"  [ERR] No token obtained")
        return None

    headers = {"Authorization": f"Bearer {token}"}
    try:
        r2 = requests.post(f"{BASE_URL}/api/workspaces/", json={"name": "WSLoadTest"}, headers=headers, timeout=5)
        if r2.status_code == 200:
            ws_id = r2.json()["id"]
            r3 = requests.post(f"{BASE_URL}/api/workspaces/{ws_id}/boards",
                               json={"title": "WSLoadBoard"}, headers=headers, timeout=5)
            if r3.status_code == 200:
                return r3.json()["id"]
            print(f"  [ERR] Board create: {r3.status_code} {r3.text[:100]}")
        else:
            print(f"  [ERR] Workspace create: {r2.status_code} {r2.text[:100]}")
    except Exception as e:
        print(f"  [ERR] Setup failed: {e}")
    return None


def run_ws_load_test(num_clients=10, duration=5):
    print("=" * 90)
    print("SynkHub - Load Test WebSocket (v2)")
    print("=" * 90)
    print(f"\nClients: {num_clients} | Duree: {duration}s")

    board_id = create_test_board()
    if not board_id:
        board_id = "test-board"
        print(f"  [WARN] Using fallback board_id: {board_id}")
    else:
        print(f"  Board UUID: {board_id}")

    result = WSResult()
    clients = []

    print(f"\n[1] Connexion de {num_clients} clients WebSocket...")
    for i in range(num_clients):
        client = WSTestClient(board_id=board_id, user_id=f"loadtest_{i}", username=f"User_{i}", result=result)
        if client.connect():
            clients.append(client)
        time.sleep(0.05)

    connected = sum(1 for c in clients if c.connected)
    print(f"      Connectes: {connected}/{num_clients}")

    print(f"\n[2] Envoi de messages pendant {duration}s...")
    start = time.time()
    msg_count = 0
    while time.time() - start < duration:
        for client in clients:
            if client.connected:
                client.send_cursor(x=100 + (msg_count % 500), y=200 + (msg_count % 300))
                if msg_count % 5 == 0:
                    client.send_postit_event()
                msg_count += 1
        time.sleep(0.02)

    print(f"      Messages envoyes: {msg_count}")

    print(f"\n[3] Deconnexion...")
    for client in clients:
        client.disconnect()
    time.sleep(0.5)

    print("\n" + "=" * 90)
    print("RESUME WEBSOCKET")
    print("=" * 90)
    s = result.summary()
    for k, v in s.items():
        print(f"  {k:30s}: {v}")

    print(f"\nDebit: {s['throughput_msg_per_sec']:.1f} messages/sec")
    print("Termine.")

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "config": {"num_clients": num_clients, "duration_sec": duration, "board_id": str(board_id)},
        "results": s,
    }
    report_path = os.path.join(RESULTS_DIR, f"ws_{time.strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nRapport sauvegarde: {report_path}")

    return s


if __name__ == "__main__":
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    d = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    run_ws_load_test(num_clients=n, duration=d)
