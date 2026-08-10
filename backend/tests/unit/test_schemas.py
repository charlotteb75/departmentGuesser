import pytest
from marshmallow import ValidationError

from app.schemas import GameCreateSchema, RegisterSchema, validate_password


@pytest.mark.parametrize(
    "password",
    [
        "Short1!",
        "lowercase123!",
        "NoNumberHere!",
        "NoSpecial1234",
        "Whitespace123 ",
    ],
)
def test_validate_password_rejects_weak_passwords(password):
    with pytest.raises(ValidationError):
        validate_password(password)


def test_validate_password_accepts_strong_password():
    assert validate_password("Password123!") is None


def test_register_schema_accepts_valid_credentials():
    credentials = {
        "username": "alice",
        "password": "Password123!",
    }

    assert RegisterSchema().load(credentials) == credentials


@pytest.mark.parametrize("username", ["ab", "a" * 81])
def test_register_schema_rejects_invalid_username_length(username):
    with pytest.raises(ValidationError) as error:
        RegisterSchema().load(
            {"username": username, "password": "Password123!"}
        )

    assert "username" in error.value.messages


def test_game_create_schema_rejects_empty_name():
    with pytest.raises(ValidationError) as error:
        GameCreateSchema().load({"name": ""})

    assert "name" in error.value.messages


def test_game_create_schema_loads_progress():
    payload = {
        "name": "Tour de France",
        "found_department_ids": ["dep_13", "dep_59"],
    }

    assert GameCreateSchema().load(payload) == payload
