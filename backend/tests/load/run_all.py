"""
SynkHub - Lanceur de Tests de Charge (v2)
Usage: python -m tests.load.run_all
"""
import subprocess
import sys
import os


def main():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    print("=" * 90)
    print("SynkHub - Suite de Tests de Charge (v2)")
    print("=" * 90)

    tests = [
        ("Tests de charge API HTTP", "tests.load.test_api_load", []),
        ("Tests de charge WebSocket (10 clients, 5s)", "tests.load.test_websocket_load", ["10", "5"]),
        ("Tests de charge WebSocket (50 clients, 10s)", "tests.load.test_websocket_load", ["50", "10"]),
        ("Scan de securite (Bandit)", "tests.load.security_scan", []),
    ]

    for i, (label, module, args) in enumerate(tests, 1):
        print(f"\n[{i}/{len(tests)}] {label}...")
        print("-" * 60)
        try:
            subprocess.run(
                [sys.executable, "-m", module] + args,
                cwd=backend_dir,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            print(f"  Erreur: {e}")

    print("\n" + "=" * 90)
    print("Tous les tests de charge sont termines.")
    print("=" * 90)


if __name__ == "__main__":
    main()
