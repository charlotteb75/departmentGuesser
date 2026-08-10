import os

import pytest
from sqlalchemy.engine import make_url

from app import create_app, db


DEFAULT_TEST_DATABASE_URL = (
    "postgresql://department_guesser_test:department_guesser_test@"
    "127.0.0.1:5433/department_guesser_test"
)


class TestConfig:
    TESTING = True
    SECRET_KEY = "integration-test-secret"
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TEST_DATABASE_URL",
        DEFAULT_TEST_DATABASE_URL,
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def ensure_test_database(database_url):
    database_name = make_url(database_url).database or ""
    if not database_name.endswith("_test"):
        raise RuntimeError(
            "Integration tests require a database whose name ends with '_test'."
        )


@pytest.fixture()
def app():
    ensure_test_database(TestConfig.SQLALCHEMY_DATABASE_URI)
    application = create_app(TestConfig)

    with application.app_context():
        db.drop_all()
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    def create_headers(username="alice"):
        password = "Password123!"
        register_response = client.post(
            "/api/auth/register",
            json={"username": username, "password": password},
        )
        assert register_response.status_code == 201

        login_response = client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
        )
        assert login_response.status_code == 200
        token = login_response.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return create_headers
