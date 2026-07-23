import io


class TestUploadAvatar:
    def test_upload_avatar_png(self, client, auth_headers):
        file_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        res = client.post(
            "/api/auth/avatar",
            files={"file": ("avatar.png", io.BytesIO(file_content), "image/png")},
            headers=auth_headers
        )
        assert res.status_code == 200
        assert res.json()["avatar_url"] is not None

    def test_upload_avatar_jpg(self, client, auth_headers):
        file_content = b'\xff\xd8\xff\xe0' + b'\x00' * 100
        res = client.post(
            "/api/auth/avatar",
            files={"file": ("avatar.jpg", io.BytesIO(file_content), "image/jpeg")},
            headers=auth_headers
        )
        assert res.status_code == 200

    def test_upload_wrong_format(self, client, auth_headers):
        file_content = b'not an image'
        res = client.post(
            "/api/auth/avatar",
            files={"file": ("avatar.exe", io.BytesIO(file_content), "application/octet-stream")},
            headers=auth_headers
        )
        assert res.status_code == 400

    def test_upload_too_large(self, client, auth_headers):
        file_content = b'\x89PNG' + b'\x00' * (3 * 1024 * 1024)
        res = client.post(
            "/api/auth/avatar",
            files={"file": ("big.png", io.BytesIO(file_content), "image/png")},
            headers=auth_headers
        )
        assert res.status_code == 400


class TestDeleteAvatar:
    def test_delete_avatar(self, client, auth_headers):
        file_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        client.post(
            "/api/auth/avatar",
            files={"file": ("avatar.png", io.BytesIO(file_content), "image/png")},
            headers=auth_headers
        )
        res = client.delete("/api/auth/avatar", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["avatar_url"] is None

    def test_delete_avatar_none(self, client, auth_headers):
        res = client.delete("/api/auth/avatar", headers=auth_headers)
        assert res.status_code == 200
