from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(hours=2),
    }

    return jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )

def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        current_app.config["SECRET_KEY"],
        algorithms=["HS256"],
    )