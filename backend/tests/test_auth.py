class TestRegister:
    def test_register_success(self, client):
        res = client.post("/api/auth/register", json={
            "email": "new@test.com",
            "username": "newuser",
            "password": "Test1234!"
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@test.com"
        assert data["user"]["username"] == "newuser"

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "email": "dup@test.com",
            "username": "user1",
            "password": "Test1234!"
        })
        res = client.post("/api/auth/register", json={
            "email": "dup@test.com",
            "username": "user2",
            "password": "Test1234!"
        })
        assert res.status_code == 400

    def test_register_missing_fields(self, client):
        res = client.post("/api/auth/register", json={
            "email": "inc@test.com"
        })
        assert res.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        client.post("/api/auth/register", json={
            "email": "login@test.com",
            "username": "loginuser",
            "password": "Test1234!"
        })
        res = client.post("/api/auth/login", json={
            "email": "login@test.com",
            "password": "Test1234!"
        })
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "email": "wrong@test.com",
            "username": "wronguser",
            "password": "Test1234!"
        })
        res = client.post("/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "WrongPassword"
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post("/api/auth/login", json={
            "email": "noexist@test.com",
            "password": "Test1234!"
        })
        assert res.status_code == 401


class TestGetCurrentUser:
    def test_get_current_user(self, client, auth_headers):
        res = client.get("/api/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["email"] == "test@test.com"

    def test_get_current_user_no_token(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code in [401, 403]
