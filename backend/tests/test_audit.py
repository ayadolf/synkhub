from app.models.audit import DataProcessing


class TestAuditLogs:
    def test_get_audit_logs(self, client, admin_headers, board_id):
        client.post(f"/api/boards/{board_id}/postits", json={"content": "Test"}, headers=admin_headers)
        res = client.get("/api/audit/logs", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        assert len(data["logs"]) >= 1

    def test_get_audit_logs_with_action_filter(self, client, admin_headers, board_id):
        client.post(f"/api/boards/{board_id}/postits", json={"content": "Test"}, headers=admin_headers)
        res = client.get("/api/audit/logs?action=postit:create", headers=admin_headers)
        assert res.status_code == 200
        for log in res.json()["logs"]:
            assert log["action"] == "postit:create"

    def test_get_audit_logs_unauthorized(self, client):
        res = client.get("/api/audit/logs")
        assert res.status_code in [401, 403]

    def test_get_audit_logs_non_admin_forbidden(self, client, auth_headers):
        client.post("/api/auth/register", json={
            "email": "admin@test.com", "username": "admin", "password": "Test1234!"
        }, headers=auth_headers)
        res = client.get("/api/audit/logs", headers=auth_headers)
        assert res.status_code == 403

    def test_audit_logs_contains_register(self, client, admin_headers):
        res = client.get("/api/audit/logs", headers=admin_headers)
        logs = res.json()["logs"]
        register_logs = [l for l in logs if l["action"] == "register"]
        assert len(register_logs) >= 1

    def test_audit_logs_contains_login(self, client, admin_headers):
        res = client.get("/api/audit/logs", headers=admin_headers)
        logs = res.json()["logs"]
        login_logs = [l for l in logs if l["action"] == "login"]
        assert len(login_logs) >= 1


class TestAuditStats:
    def test_get_audit_stats(self, client, admin_headers, board_id):
        client.post(f"/api/boards/{board_id}/postits", json={"content": "Test"}, headers=admin_headers)
        res = client.get("/api/audit/stats", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_logs"] >= 1
        assert "by_action" in data

    def test_get_audit_stats_unauthorized(self, client):
        res = client.get("/api/audit/stats")
        assert res.status_code in [401, 403]


class TestDataProcessings:
    def test_get_processings(self, client, admin_headers, db_session):
        db_session.add(DataProcessing(
            name="Authentification utilisateur",
            purpose="Accès sécurisé",
            legal_basis="Art. 6.1.b RGPD",
            data_categories="Email, username, password hash",
            retention_period="Durée du compte",
            recipients="Direction Systèmes Informatique - OCP Jorf Lasfar",
        ))
        db_session.commit()

        res = client.get("/api/audit/processings", headers=admin_headers)
        assert res.status_code == 200
        processings = res.json()
        assert len(processings) >= 1
        assert processings[0]["name"] == "Authentification utilisateur"
        assert "legal_basis" in processings[0]

    def test_get_processings_unauthorized(self, client):
        res = client.get("/api/audit/processings")
        assert res.status_code in [401, 403]
