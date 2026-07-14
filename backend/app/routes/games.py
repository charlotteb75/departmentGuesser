from flask import Blueprint, jsonify, request
from .. import db
from ..models import Game
from .auth.utils import auth_required
from ..schemas import GameCreateSchema, GameUpdateSchema

games_bp = Blueprint("games", __name__)

def serialize_game(game):
    return {
        "id": game.id,
        "name": game.name,
        "found_department_ids": game.found_department_ids,
        "score": game.score,
        "created_at": game.created_at.isoformat()
    }


@games_bp.get("")
@auth_required
def list_games(current_user):
    games = db.session.execute(
        db.select(Game)
        .where(Game.user_id == current_user.id)
        .order_by(Game.updated_at.desc())
    ).scalars().all()
    return jsonify({
        "games": [serialize_game(game) for game in games]
    }), 200


@games_bp.post("")
@auth_required
def create_game(current_user):
    game_create_schema = GameCreateSchema()
    payload = request.get_json(silent=True)
    if payload is None:
        payload = {}

    try:
        data = game_create_schema.load(payload)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400
    new_game = Game(user=current_user, name=data["name"], found_department_ids=[])
    db.session.add(new_game)
    db.session.commit()
    return jsonify({"game": serialize_game(game)}), 201


@games_bp.get("/<int:game_id>")
@auth_required
def get_game(current_user, game_id):
    game = db.session.execute(
    db.select(Game).where(
            Game.id == game_id,
            Game.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if game is None:
        return jsonify({"errors": {"game": ["Game not found"]}}), 404

    return jsonify({"game": serialize_game(game)}), 200


@games_bp.patch("/<int:game_id>")
@auth_required
def update_game(current_user, game_id):
    game = db.session.execute(
    db.select(Game).where(
            Game.id == game_id,
            Game.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if game is None:
        return jsonify({"errors": {"game": ["Game not found"]}}), 404

    game_update_schema = GameUpdateSchema()
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"errors": {"json": ["Invalid or missing JSON body"]}}), 400

    try:
        data = game_update_schema.load(payload)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400

    if not data:
        return jsonify({"errors": {"body": ["At least one field is required"]}}), 400
    
    if "name" in data:
        game.name = data["name"]

    if "found_department_ids" in data:
        game.found_department_ids = data["found_department_ids"]

    db.session.commit()
    return jsonify({"game": serialize_game(game)}), 200
