from datetime import datetime, timezone

from app.models import Game
from app.routes.games import serialize_game


def test_serialize_game_returns_public_json_contract():
    created_at = datetime(2026, 8, 10, 12, 30, tzinfo=timezone.utc)
    game = Game(
        id=42,
        name="Tour de France",
        found_department_ids=["dep_13", "dep_59"],
        created_at=created_at,
    )

    assert serialize_game(game) == {
        "id": 42,
        "name": "Tour de France",
        "found_department_ids": ["dep_13", "dep_59"],
        "score": 2,
        "created_at": "2026-08-10T12:30:00+00:00",
    }
