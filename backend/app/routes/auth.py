from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from .. import db
from ..models import User, Game
from ..schemas import RegisterSchema

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
    return jsonify({"message": "login endpoint coming next"}), 501


@auth_bp.post("/logout")
def logout():
    return jsonify({"message": "logout endpoint coming next"}), 501


@auth_bp.get("/me")
def me():
    return jsonify({"message": "me endpoint coming next"}), 501
