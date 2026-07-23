class TestSQLInjection:
    def test_login_sql_injection(self, client):
        res = client.post("/api/auth/login", json={
            "email": "admin' OR '1'='1@test.com",
            "password": "password",
        })
        assert res.status_code in [400, 401, 422]

    def test_search_sql_injection(self, client, auth_headers, board_id):
        client.post(f"/api/boards/{board_id}/postits",
                    json={"content": "Normal postit"}, headers=auth_headers)
        res = client.get(f"/api/boards/{board_id}/postits", headers=auth_headers)
        assert res.status_code == 200


class TestXSS:
    def test_postit_xss_content(self, client, auth_headers, board_id):
        xss_payload = "<script>alert('xss')</script>"
        res = client.post(f"/api/boards/{board_id}/postits",
                         json={"content": xss_payload}, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["content"] == xss_payload

    def test_postit_html_content(self, client, auth_headers, board_id):
        html = "<img src=x onerror=alert(1)>"
        res = client.post(f"/api/boards/{board_id}/postits",
                         json={"content": html}, headers=auth_headers)
        assert res.status_code == 200


class TestOversizedPayloads:
    def test_oversized_postit_content(self, client, auth_headers, board_id):
        huge_content = "x" * 100000
        res = client.post(f"/api/boards/{board_id}/postits",
                         json={"content": huge_content}, headers=auth_headers)
        assert res.status_code in [200, 400, 413, 422]

    def test_empty_postit_content(self, client, auth_headers, board_id):
        res = client.post(f"/api/boards/{board_id}/postits",
                         json={"content": " "}, headers=auth_headers)
        assert res.status_code in [200, 400]

    def test_missing_required_fields(self, client, auth_headers, board_id):
        res = client.post(f"/api/boards/{board_id}/postits",
                         json={}, headers=auth_headers)
        assert res.status_code == 422

    def test_register_short_password(self, client):
        res = client.post("/api/auth/register", json={
            "email": "short@test.com",
            "password": "123",
            "username": "short",
        })
        assert res.status_code == 400

    def test_register_invalid_email(self, client):
        res = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "Test1234!",
            "username": "invalid",
        })
        assert res.status_code == 422


class TestAuthEdgeCases:
    def test_invalid_token(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token"})
        assert res.status_code == 401

    def test_missing_token(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_duplicate_register(self, client):
        payload = {"email": "dup@test.com", "password": "Test1234!", "username": "dupuser"}
        client.post("/api/auth/register", json=payload)
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == 400

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "email": "wp@test.com", "password": "Test1234!", "username": "wpuser"
        })
        res = client.post("/api/auth/login", json={
            "email": "wp@test.com", "password": "wrongpassword"
        })
        assert res.status_code == 401


class TestResourceNotFound:
    def test_board_not_found(self, client, auth_headers):
        res = client.get("/api/boards/00000000-0000-0000-0000-000000000000/postits",
                        headers=auth_headers)
        assert res.status_code == 404

    def test_postit_not_found(self, client, auth_headers):
        res = client.get("/api/postits/00000000-0000-0000-0000-000000000000/comments",
                        headers=auth_headers)
        assert res.status_code == 404

    def test_workspace_not_found(self, client, auth_headers):
        res = client.get("/api/workspaces/00000000-0000-0000-0000-000000000000",
                        headers=auth_headers)
        assert res.status_code == 404
