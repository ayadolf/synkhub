class TestCreatePostit:
    def test_create_postit(self, client, auth_headers, board_id):
        res = client.post(f"/api/boards/{board_id}/postits", json={
            "content": "Mon idee",
            "color": "blue",
            "x_pos": 100,
            "y_pos": 200,
            "priority": "High",
            "status": "Draft"
        }, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["content"] == "Mon idee"
        assert data["color"] == "blue"
        assert data["priority"] == "High"
        assert data["status"] == "Draft"
        assert data["x_pos"] == 100
        assert data["y_pos"] == 200

    def test_create_postit_default_values(self, client, auth_headers, board_id):
        res = client.post(f"/api/boards/{board_id}/postits", json={
            "content": "Default values"
        }, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["priority"] == "Medium"
        assert data["status"] == "Draft"
        assert data["color"] == "#FBBF24"

    def test_create_postit_unauthorized(self, client, board_id):
        res = client.post(f"/api/boards/{board_id}/postits", json={"content": "No auth"})
        assert res.status_code in [401, 403]


class TestListPostits:
    def test_list_postits(self, client, auth_headers, board_id):
        client.post(f"/api/boards/{board_id}/postits", json={"content": "P1"}, headers=auth_headers)
        client.post(f"/api/boards/{board_id}/postits", json={"content": "P2"}, headers=auth_headers)
        res = client.get(f"/api/boards/{board_id}/postits", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_list_postits_empty(self, client, auth_headers, board_id):
        res = client.get(f"/api/boards/{board_id}/postits", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 0


class TestMovePostit:
    def test_move_postit(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Move me"}, headers=auth_headers).json()
        res = client.patch(f"/api/postits/{postit['id']}/move", json={"x_pos": 500, "y_pos": 300}, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["x_pos"] == 500
        assert data["y_pos"] == 300

    def test_move_postit_with_z_index(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Z move"}, headers=auth_headers).json()
        res = client.patch(f"/api/postits/{postit['id']}/move", json={"x_pos": 10, "y_pos": 20, "z_index": 99}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["z_index"] == 99


class TestUpdatePostit:
    def test_update_postit_content(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Old"}, headers=auth_headers).json()
        res = client.patch(f"/api/postits/{postit['id']}", json={"content": "New"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["content"] == "New"

    def test_update_postit_priority(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Priority"}, headers=auth_headers).json()
        res = client.patch(f"/api/postits/{postit['id']}", json={"priority": "High"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["priority"] == "High"

    def test_update_postit_status(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Status"}, headers=auth_headers).json()
        res = client.patch(f"/api/postits/{postit['id']}", json={"status": "Approved"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "Approved"

    def test_update_postit_not_found(self, client, auth_headers):
        res = client.patch("/api/postits/00000000-0000-0000-0000-000000000000", json={"content": "X"}, headers=auth_headers)
        assert res.status_code == 404


class TestDeletePostit:
    def test_delete_postit(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Delete me"}, headers=auth_headers).json()
        res = client.delete(f"/api/postits/{postit['id']}", headers=auth_headers)
        assert res.status_code == 204

    def test_delete_postit_not_found(self, client, auth_headers):
        res = client.delete("/api/postits/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert res.status_code == 404


class TestVotePostit:
    def test_vote_postit(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Vote me"}, headers=auth_headers).json()
        res = client.post(f"/api/postits/{postit['id']}/vote", headers=auth_headers)
        assert res.status_code == 200

    def test_vote_toggle(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Toggle"}, headers=auth_headers).json()
        client.post(f"/api/postits/{postit['id']}/vote", headers=auth_headers)
        res = client.post(f"/api/postits/{postit['id']}/vote", headers=auth_headers)
        assert res.status_code == 200


class TestComments:
    def test_add_comment(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Comment me"}, headers=auth_headers).json()
        res = client.post(f"/api/postits/{postit['id']}/comments", json={"content": "Super idee !"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["content"] == "Super idee !"

    def test_list_comments(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Test"}, headers=auth_headers).json()
        client.post(f"/api/postits/{postit['id']}/comments", json={"content": "C1"}, headers=auth_headers)
        client.post(f"/api/postits/{postit['id']}/comments", json={"content": "C2"}, headers=auth_headers)
        res = client.get(f"/api/postits/{postit['id']}/comments", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_comment_not_found(self, client, auth_headers):
        res = client.get("/api/postits/00000000-0000-0000-0000-000000000000/comments", headers=auth_headers)
        assert res.status_code == 404


class TestDecisionHub:
    def test_list_ideas(self, client, auth_headers, board_id):
        client.post(f"/api/boards/{board_id}/postits", json={"content": "Idee 1", "priority": "High"}, headers=auth_headers)
        client.post(f"/api/boards/{board_id}/postits", json={"content": "Idee 2", "priority": "Low"}, headers=auth_headers)
        workspace_id = client.get(f"/api/boards/{board_id}", headers=auth_headers).json()["workspace_id"]
        res = client.get(f"/api/workspaces/{workspace_id}/ideas", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_idea_vote(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Vote idea"}, headers=auth_headers).json()
        res = client.post(f"/api/ideas/{postit['id']}/vote", headers=auth_headers)
        assert res.status_code == 200

    def test_idea_comments(self, client, auth_headers, board_id):
        postit = client.post(f"/api/boards/{board_id}/postits", json={"content": "Comment idea"}, headers=auth_headers).json()
        client.post(f"/api/ideas/{postit['id']}/comments", json={"content": "Nice!"}, headers=auth_headers)
        res = client.get(f"/api/ideas/{postit['id']}/comments", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 1
