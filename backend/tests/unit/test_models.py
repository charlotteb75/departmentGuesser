from datetime import timezone

from app.models import Game, User, utc_now


def test_user_password_is_hashed_and_can_be_checked():
    user = User(username="alice")

    user.set_password("Password123!")

    assert user.password_hash != "Password123!"
    assert user.check_password("Password123!") is True
    assert user.check_password("WrongPassword123!") is False


def test_game_score_counts_found_departments():
    game = Game(found_department_ids=["dep_13", "dep_59", "dep_75"])

    assert game.score == 3


def test_game_score_is_zero_without_found_departments():
    game = Game(found_department_ids=None)

    assert game.score == 0


def test_utc_now_returns_timezone_aware_datetime():
    current_time = utc_now()

    assert current_time.tzinfo is timezone.utc
