from app import db
from app.models import User


def test_register_creates_user_with_hashed_password(client, app):
    response = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "Password123!"},
    )

    assert response.status_code == 201
    assert response.get_json()["user"]["username"] == "alice"

    with app.app_context():
        user = db.session.execute(
            db.select(User).where(User.username == "alice")
        ).scalar_one()
        assert user.password_hash != "Password123!"
        assert user.check_password("Password123!")


def test_register_rejects_duplicate_username(client):
    credentials = {"username": "alice", "password": "Password123!"}

    assert client.post("/api/auth/register", json=credentials).status_code == 201
    response = client.post("/api/auth/register", json=credentials)

    assert response.status_code == 409
    assert response.get_json() == {
        "errors": {"username": ["Username already exists"]}
    }


def test_login_returns_token_that_grants_access_to_current_user(client):
    credentials = {"username": "alice", "password": "Password123!"}
    client.post("/api/auth/register", json=credentials)

    login_response = client.post("/api/auth/login", json=credentials)

    assert login_response.status_code == 200
    login_payload = login_response.get_json()
    assert login_payload["token_type"] == "Bearer"

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.get_json()["user"]["username"] == "alice"


def test_login_rejects_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "Password123!"},
    )

    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "WrongPassword123!"},
    )

    assert response.status_code == 401
    assert "credentials" in response.get_json()["errors"]
