class TestGetNote:
    def test_get_note_creates_empty(self, client, auth_headers, board_id):
        res = client.get(f"/api/boards/{board_id}/notes", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["content"] == ""
        assert data["board_id"] == board_id

    def test_get_note_returns_existing(self, client, auth_headers, board_id):
        client.put(f"/api/boards/{board_id}/notes", json={"content": "My note"}, headers=auth_headers)
        res = client.get(f"/api/boards/{board_id}/notes", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["content"] == "My note"

    def test_get_note_unauthorized(self, client, board_id):
        res = client.get(f"/api/boards/{board_id}/notes")
        assert res.status_code in [401, 403]


class TestUpdateNote:
    def test_update_note(self, client, auth_headers, board_id):
        res = client.put(f"/api/boards/{board_id}/notes", json={"content": "Hello world"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["content"] == "Hello world"

    def test_update_note_overwrites(self, client, auth_headers, board_id):
        client.put(f"/api/boards/{board_id}/notes", json={"content": "First"}, headers=auth_headers)
        res = client.put(f"/api/boards/{board_id}/notes", json={"content": "Second"}, headers=auth_headers)
        assert res.json()["content"] == "Second"

    def test_update_note_empty(self, client, auth_headers, board_id):
        res = client.put(f"/api/boards/{board_id}/notes", json={"content": ""}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["content"] == ""

    def test_update_note_unauthorized(self, client, board_id):
        res = client.put(f"/api/boards/{board_id}/notes", json={"content": "No auth"})
        assert res.status_code in [401, 403]


class TestListNotes:
    def test_list_notes(self, client, auth_headers, board_id):
        client.put(f"/api/boards/{board_id}/notes", json={"content": "Note 1"}, headers=auth_headers)
        res = client.get(f"/api/boards/{board_id}/notes/all", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) >= 1

    def test_list_notes_empty_board(self, client, auth_headers, board_id):
        res = client.get(f"/api/boards/{board_id}/notes/all", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 0

    def test_list_notes_unauthorized(self, client, board_id):
        res = client.get(f"/api/boards/{board_id}/notes/all")
        assert res.status_code in [401, 403]
