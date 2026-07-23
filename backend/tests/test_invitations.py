class TestInviteMember:
    def test_invite_success(self, client, auth_headers, workspace_id):
        res = client.post(
            f"/api/workspaces/{workspace_id}/invite",
            params={"email": "new@test.com", "role": "member"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert "Invitation sent" in res.json()["message"]

    def test_invite_not_admin(self, client, second_user_headers, workspace_id):
        res = client.post(
            f"/api/workspaces/{workspace_id}/invite",
            params={"email": "new@test.com"},
            headers=second_user_headers,
        )
        assert res.status_code == 403

    def test_invite_workspace_not_found(self, client, auth_headers):
        res = client.post(
            "/api/workspaces/00000000-0000-0000-0000-000000000000/invite",
            params={"email": "new@test.com"},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_invite_duplicate_pending(self, client, auth_headers, workspace_id):
        client.post(
            f"/api/workspaces/{workspace_id}/invite",
            params={"email": "dup@test.com"},
            headers=auth_headers,
        )
        res = client.post(
            f"/api/workspaces/{workspace_id}/invite",
            params={"email": "dup@test.com"},
            headers=auth_headers,
        )
        assert res.status_code == 400


class TestGetInvitation:
    def test_get_invitation_not_found(self, client):
        res = client.get("/api/invitations/nonexistent_token")
        assert res.status_code == 404


class TestAcceptInvitation:
    def test_accept_invitation_not_found(self, client, auth_headers):
        res = client.post("/api/invitations/nonexistent/accept", headers=auth_headers)
        assert res.status_code == 404
