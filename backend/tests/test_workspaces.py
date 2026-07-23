class TestCreateWorkspace:
    def test_create_workspace(self, client, auth_headers):
        res = client.post("/api/workspaces/", json={"name": "Mon Workspace"}, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Mon Workspace"
        assert "id" in data
        assert "owner_id" in data

    def test_create_workspace_unauthorized(self, client):
        res = client.post("/api/workspaces/", json={"name": "No Auth"})
        assert res.status_code in [401, 403]


class TestListWorkspaces:
    def test_list_workspaces(self, client, auth_headers):
        client.post("/api/workspaces/", json={"name": "WS1"}, headers=auth_headers)
        client.post("/api/workspaces/", json={"name": "WS2"}, headers=auth_headers)
        res = client.get("/api/workspaces/", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_list_workspaces_empty(self, client, auth_headers):
        res = client.get("/api/workspaces/", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 0


class TestGetWorkspace:
    def test_get_workspace(self, client, auth_headers):
        ws = client.post("/api/workspaces/", json={"name": "Get WS"}, headers=auth_headers).json()
        res = client.get(f"/api/workspaces/{ws['id']}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["name"] == "Get WS"

    def test_get_workspace_not_found(self, client, auth_headers):
        res = client.get("/api/workspaces/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert res.status_code == 404


class TestDeleteWorkspace:
    def test_delete_workspace(self, client, auth_headers):
        ws = client.post("/api/workspaces/", json={"name": "To Delete"}, headers=auth_headers).json()
        res = client.delete(f"/api/workspaces/{ws['id']}", headers=auth_headers)
        assert res.status_code == 204

    def test_delete_workspace_not_owner(self, client, auth_headers, second_user_headers):
        ws = client.post("/api/workspaces/", json={"name": "Owner WS"}, headers=auth_headers).json()
        res = client.delete(f"/api/workspaces/{ws['id']}", headers=second_user_headers)
        assert res.status_code == 403
