from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from ... import db
from ...models import User, Game
from ...schemas import RegisterSchema, LoginSchema
from .utils import create_access_token, decode_access_token
import jwt

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    register_schema = RegisterSchema()
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({
        "errors": {
            "json": ["Invalid or missing JSON body"]
        }
    }), 400

    try:
        data = register_schema.load(payload)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400
    existing_user = db.session.execute(
    db.select(User).where(User.username == data["username"])).scalar_one_or_none()
    if existing_user is not None:
        return jsonify({"errors": {"username": ["Username already exists"]}}), 409

    user = User(username=data["username"])
    user.set_password(data["password"])
    db.session.add(user)
    game = Game(user=user, found_department_ids=[])
    db.session.add(game)
    db.session.commit()

    return jsonify({
    "user": {
        "id": user.id,
        "username": user.username,
    },
    "game": {
        "id": game.id,
        "name": game.name,
        "found_department_ids": game.found_department_ids,
        "score": game.score,
        },
    }), 201


@auth_bp.post("/login")
def login():
    login_schema = LoginSchema()
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({
        "errors": {
            "json": ["Invalid or missing JSON body"]
        }
    }), 400

    try:
        data = login_schema.load(payload)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400
    
    existing_user = db.session.execute(
    db.select(User).where(User.username == data["username"])).scalar_one_or_none()
    if existing_user is None:
        return jsonify({"errors": {"credentials": ["Invalid username or password"]}}), 401

    if not existing_user.check_password(data["password"]):
        return jsonify({"errors": {"credentials": ["Invalid username or password"]}}), 401

    access_token = create_access_token(existing_user.id)

    return jsonify({
        "access_token": access_token,
        "token_type": "Bearer",
        "user": {
            "id": existing_user.id,
            "username": existing_user.username,
        },
    }), 200


@auth_bp.post("/logout")
def logout():
    return jsonify({"message": "logout endpoint coming next"}), 501


@auth_bp.get("/me")
def me():
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
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"errors": {"user": ["User doesn't exist"]}}), 401
    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
        }
    }), 200
