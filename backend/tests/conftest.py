import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport
import asyncio
from app.main import app
from app.database import Base, get_db


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db

    class SyncClient:
        def __init__(self, app):
            self.app = app
            self.transport = ASGITransport(app=app)
            self.base_url = "http://test"

        def _run(self, coro):
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(coro)
            finally:
                loop.close()

        async def _request(self, method, url, **kwargs):
            async with AsyncClient(transport=self.transport, base_url=self.base_url) as ac:
                return await ac.request(method, url, **kwargs)

        def get(self, url, **kwargs):
            return self._run(self._request("GET", url, **kwargs))

        def post(self, url, **kwargs):
            return self._run(self._request("POST", url, **kwargs))

        def put(self, url, **kwargs):
            return self._run(self._request("PUT", url, **kwargs))

        def patch(self, url, **kwargs):
            return self._run(self._request("PATCH", url, **kwargs))

        def delete(self, url, **kwargs):
            return self._run(self._request("DELETE", url, **kwargs))

    client = SyncClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    client.post("/api/auth/register", json={
        "email": "test@test.com",
        "username": "testuser",
        "password": "Test1234!"
    })
    res = client.post("/api/auth/login", json={
        "email": "test@test.com",
        "password": "Test1234!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user_headers(client):
    client.post("/api/auth/register", json={
        "email": "user2@test.com",
        "username": "user2",
        "password": "Test1234!"
    })
    res = client.post("/api/auth/login", json={
        "email": "user2@test.com",
        "password": "Test1234!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, db_session):
    from app.models.user import User
    client.post("/api/auth/register", json={
        "email": "admin@test.com",
        "username": "admin",
        "password": "Test1234!"
    })
    user = db_session.query(User).filter(User.email == "admin@test.com").first()
    if user:
        user.role = "admin"
        db_session.commit()
    res = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "Test1234!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def workspace_id(client, auth_headers):
    res = client.post("/api/workspaces/", json={"name": "Test WS"}, headers=auth_headers)
    return res.json()["id"]


@pytest.fixture
def board_id(client, auth_headers, workspace_id):
    res = client.post(f"/api/workspaces/{workspace_id}/boards", json={"title": "Test Board"}, headers=auth_headers)
    return res.json()["id"]
