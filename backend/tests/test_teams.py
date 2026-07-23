class TestListMembers:
    def test_list_members(self, client, auth_headers, workspace_id):
        res = client.get(f"/api/workspaces/{workspace_id}/members", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) >= 1
        assert res.json()[0]["role"] == "admin"

    def test_list_members_not_member(self, client, auth_headers, second_user_headers):
        ws = client.post("/api/workspaces/", json={"name": "Private WS"}, headers=auth_headers).json()
        res = client.get(f"/api/workspaces/{ws['id']}/members", headers=second_user_headers)
        assert res.status_code == 403


class TestAddMember:
    def test_add_member(self, client, auth_headers, second_user_headers, workspace_id):
        res = client.post(f"/api/workspaces/{workspace_id}/members?email=user2@test.com", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["email"] == "user2@test.com"

    def test_add_member_not_admin(self, client, auth_headers, second_user_headers, workspace_id):
        res = client.post(f"/api/workspaces/{workspace_id}/members?email=test@test.com", headers=second_user_headers)
        assert res.status_code == 403

    def test_add_member_not_found(self, client, auth_headers, workspace_id):
        res = client.post(f"/api/workspaces/{workspace_id}/members?email=ghost@test.com", headers=auth_headers)
        assert res.status_code == 404

    def test_add_member_already_member(self, client, auth_headers, second_user_headers, workspace_id):
        client.post(f"/api/workspaces/{workspace_id}/members?email=user2@test.com", headers=auth_headers)
        res = client.post(f"/api/workspaces/{workspace_id}/members?email=user2@test.com", headers=auth_headers)
        assert res.status_code == 400


class TestUpdateRole:
    def test_update_role(self, client, auth_headers, second_user_headers, workspace_id):
        client.post(f"/api/workspaces/{workspace_id}/members?email=user2@test.com", headers=auth_headers)
        members = client.get(f"/api/workspaces/{workspace_id}/members", headers=auth_headers).json()
        member_id = [m for m in members if m["email"] == "user2@test.com"][0]["id"]
        res = client.patch(f"/api/members/{member_id}/role?role=viewer", headers=auth_headers)
        assert res.status_code == 200

    def test_update_role_invalid(self, client, auth_headers, second_user_headers, workspace_id):
        client.post(f"/api/workspaces/{workspace_id}/members?email=user2@test.com", headers=auth_headers)
        members = client.get(f"/api/workspaces/{workspace_id}/members", headers=auth_headers).json()
        member_id = [m for m in members if m["email"] == "user2@test.com"][0]["id"]
        res = client.patch(f"/api/members/{member_id}/role?role=superadmin", headers=auth_headers)
        assert res.status_code == 400


class TestRemoveMember:
    def test_remove_member(self, client, auth_headers, second_user_headers, workspace_id):
        client.post(f"/api/workspaces/{workspace_id}/members?email=user2@test.com", headers=auth_headers)
        members = client.get(f"/api/workspaces/{workspace_id}/members", headers=auth_headers).json()
        member_id = [m for m in members if m["email"] == "user2@test.com"][0]["id"]
        res = client.delete(f"/api/members/{member_id}", headers=auth_headers)
        assert res.status_code == 200
