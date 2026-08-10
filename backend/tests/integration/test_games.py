import pytest


def create_game(client, headers, **overrides):
    payload = {"name": "Partie initiale", **overrides}
    response = client.post("/api/games", headers=headers, json=payload)

    assert response.status_code == 201
    return response.get_json()["game"]


def test_games_require_authentication(client):
    response = client.get("/api/games")

    assert response.status_code == 401
    assert "authorization" in response.get_json()["errors"]


def test_create_game_returns_initial_progress_and_score(client, auth_headers):
    headers = auth_headers()

    response = client.post(
        "/api/games",
        headers=headers,
        json={
            "name": "Tour de France",
            "found_department_ids": ["dep_59", "dep_75"],
        },
    )

    assert response.status_code == 201
    created_game = response.get_json()["game"]
    assert created_game["name"] == "Tour de France"
    assert created_game["found_department_ids"] == ["dep_59", "dep_75"]
    assert created_game["score"] == 2


def test_update_game_changes_progress_and_score(client, auth_headers):
    headers = auth_headers()
    game = create_game(client, headers)

    response = client.patch(
        f"/api/games/{game['id']}",
        headers=headers,
        json={"found_department_ids": ["dep_59", "dep_75", "dep_13"]},
    )

    assert response.status_code == 200
    updated_game = response.get_json()["game"]
    assert updated_game["found_department_ids"] == ["dep_59", "dep_75", "dep_13"]
    assert updated_game["score"] == 3


def test_list_games_returns_current_users_games(client, auth_headers):
    headers = auth_headers()
    first_game = create_game(client, headers, name="Première partie")
    second_game = create_game(client, headers, name="Deuxième partie")

    response = client.get("/api/games", headers=headers)

    assert response.status_code == 200
    games = response.get_json()["games"]
    assert {game["id"] for game in games} == {first_game["id"], second_game["id"]}
    assert {game["name"] for game in games} == {"Première partie", "Deuxième partie"}


def test_delete_game_removes_it(client, auth_headers):
    headers = auth_headers()
    game = create_game(client, headers)

    response = client.delete(f"/api/games/{game['id']}", headers=headers)

    assert response.status_code == 200
    get_response = client.get(f"/api/games/{game['id']}", headers=headers)
    assert get_response.status_code == 404


@pytest.mark.parametrize(
    ("method", "payload"),
    [
        pytest.param("get", None, id="read"),
        pytest.param("patch", {"name": "Partie volée"}, id="update"),
        pytest.param("delete", None, id="delete"),
    ],
)
def test_user_cannot_access_another_users_game(
    client,
    auth_headers,
    method,
    payload,
):
    alice_headers = auth_headers("alice")
    game = create_game(client, alice_headers, name="Partie privée")
    bob_headers = auth_headers("bob")

    response = client.open(
        f"/api/games/{game['id']}",
        method=method.upper(),
        headers=bob_headers,
        json=payload,
    )

    assert response.status_code == 404


def test_default_game_names_are_unique_per_user(client, auth_headers):
    headers = auth_headers()

    first_response = client.post("/api/games", headers=headers, json={})
    second_response = client.post("/api/games", headers=headers, json={})

    assert first_response.get_json()["game"]["name"] == "Nouvelle partie"
    assert second_response.get_json()["game"]["name"] == "Nouvelle partie 2"
