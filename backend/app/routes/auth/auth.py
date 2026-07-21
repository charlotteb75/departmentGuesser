from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from ... import db
from ...models import User
from ...schemas import RegisterSchema, LoginSchema
from .utils import create_access_token, auth_required
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
    db.session.commit()

    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
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
@auth_required
def me(current_user):
    return jsonify({
        "user": {
            "id": current_user.id,
            "username": current_user.username,
        }
    }), 200
