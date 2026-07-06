from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from flask import current_app, jsonify, request
from ... import db
from ...models import User


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

def auth_required(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if auth_header is None:
            return jsonify({"errors": {"authorization": ["Missing Authorization header"]}}), 401
        if not auth_header.startswith("Bearer "):
            return jsonify({"errors": {"authorization": ["Invalid Authorization header"]}}), 401

        token = auth_header.removeprefix("Bearer ").strip()
        try:
            payload = decode_access_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"errors": {"token": ["Token expired"]}}), 401
        except jwt.InvalidTokenError:
            return jsonify({"errors": {"token": ["Invalid token"]}}), 401
        user_id = int(payload["sub"])
        current_user = db.session.get(User, user_id)
        if current_user is None:
            return jsonify({"errors": {"user": ["User doesn't exist"]}}), 401

        return route_function(current_user, *args, **kwargs)

    return wrapper