def test_auth_public_config(client):
    r = client.get("/api/v1/auth/public-config")
    assert r.status_code == 200
    j = r.get_json()
    assert j.get("username") == "demo"
    assert j.get("password") == "ira.vin"


def test_auth_login_ok(client):
    r = client.post("/api/v1/auth/login", json={"username": "demo", "password": "ira.vin"})
    assert r.status_code == 200
    assert r.get_json().get("ok") is True


def test_auth_login_fail(client):
    r = client.post("/api/v1/auth/login", json={"username": "demo", "password": "wrong"})
    assert r.status_code == 401
