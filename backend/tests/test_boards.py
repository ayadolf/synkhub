class TestCreateBoard:
    def test_create_board(self, client, auth_headers, workspace_id):
        res = client.post(f"/api/workspaces/{workspace_id}/boards", json={"title": "Board 1"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["title"] == "Board 1"

    def test_create_board_unauthorized(self, client, workspace_id):
        res = client.post(f"/api/workspaces/{workspace_id}/boards", json={"title": "No Auth"})
        assert res.status_code in [401, 403]


class TestListBoards:
    def test_list_boards(self, client, auth_headers, workspace_id):
        client.post(f"/api/workspaces/{workspace_id}/boards", json={"title": "B1"}, headers=auth_headers)
        client.post(f"/api/workspaces/{workspace_id}/boards", json={"title": "B2"}, headers=auth_headers)
        res = client.get(f"/api/workspaces/{workspace_id}/boards", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_list_boards_empty(self, client, auth_headers, workspace_id):
        res = client.get(f"/api/workspaces/{workspace_id}/boards", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 0


class TestGetBoard:
    def test_get_board(self, client, auth_headers, workspace_id):
        board = client.post(f"/api/workspaces/{workspace_id}/boards", json={"title": "B1"}, headers=auth_headers).json()
        res = client.get(f"/api/boards/{board['id']}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["title"] == "B1"

    def test_get_board_not_found(self, client, auth_headers):
        res = client.get("/api/boards/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert res.status_code == 404
