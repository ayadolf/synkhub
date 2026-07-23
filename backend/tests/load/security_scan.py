"""
SynkHub - Analyse de Securite (Chasse aux Bugs)
Usage: python -m tests.load.security_scan
"""
import subprocess
import sys
import os

def run_bandit():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    app_dir = os.path.join(backend_dir, "app")

    print("=" * 70)
    print("SynkHub - Analyse de Securite (Bandit)")
    print("=" * 70)

    print("\n[1/3] Scan de vulnerabilites dans app/...")
    print("-" * 40)
    result = subprocess.run(
        [sys.executable, "-m", "bandit", "-r", app_dir, "-f", "txt", "-q", "--severity-level", "medium"],
        capture_output=True, text=True, cwd=backend_dir
    )
    if result.stdout:
        print(result.stdout)
    if result.returncode == 0:
        print("Aucune vulnerabilite medium/high trouvee.")
    else:
        print(f"Bandit a trouve des problemes (code: {result.returncode})")

    print("\n[2/3] Scan JSON detaille...")
    print("-" * 40)
    result = subprocess.run(
        [sys.executable, "-m", "bandit", "-r", app_dir, "-f", "json", "-q", "--severity-level", "medium"],
        capture_output=True, text=True, cwd=backend_dir
    )
    import json
    try:
        data = json.loads(result.stdout)
        metrics = data.get("metrics", {}).get("_totals", {})
        print(f"  Fichiers analyses:      {metrics.get('loc', 'N/A')} lignes")
        print(f"  High severity:          {metrics.get('SEVERITY.HIGH', 0)}")
        print(f"  Medium severity:        {metrics.get('SEVERITY.MEDIUM', 0)}")
        print(f"  Low severity:           {metrics.get('SEVERITY.LOW', 0)}")
        print(f"  High confidence:        {metrics.get('CONFIDENCE.HIGH', 0)}")
        print(f"  Medium confidence:      {metrics.get('CONFIDENCE.MEDIUM', 0)}")

        results = data.get("results", [])
        if results:
            print(f"\n  Details ({len(results)} problemes):")
            for r in results:
                severity = r.get("issue_severity", "?")
                confidence = r.get("issue_confidence", "?")
                filename = os.path.basename(r.get("filename", "?"))
                line = r.get("line_number", "?")
                text = r.get("issue_text", "?")
                print(f"    [{severity}/{confidence}] {filename}:{line} - {text}")
    except json.JSONDecodeError:
        print("  (pas de JSON disponible)")

    print("\n[3/3] Resume des regles de securite...")
    print("-" * 40)
    rules = [
        ("B101", "assert_usage", "Utilisation de assert (a eviter en prod)"),
        ("B102", "exec_usage", "Utilisation de exec() (danger)"),
        ("B103", "set_bad_file_perms", "Permissions de fichiers trop ouvertes"),
        ("B105", "hardcoded_password_string", "Mot de passe en dur dans le code"),
        ("B106", "hardcoded_password_funcarg", "Mot de passe en dur en argument"),
        ("B107", "hardcoded_password_default", "Mot de passe en dur en default"),
        ("B108", "hardcoded_tmp_directory", "Repertoire /tmp en dur"),
        ("B110", "try_except_pass", "try/except avec pass (erreur ignoree)"),
        ("B201", "flask_debug_true", "Debug True en production"),
        ("B301", "pickle_loads", "Pickle (deserialisation dangereuse)"),
        ("B324", "hashlib_insecure_hash", "Fonction de hash insecure (MD5/SHA1)"),
    ]
    for code, name, desc in rules:
        print(f"  {code:5s} {name:35s} - {desc}")

    print("\n" + "=" * 70)
    print("Analyse terminee.")
    print("=" * 70)


if __name__ == "__main__":
    run_bandit()
