from flask import Blueprint, jsonify

games_bp = Blueprint("games", __name__)


@games_bp.get("")
def list_games():
    return jsonify({"message": "list games endpoint coming next"}), 501


@games_bp.post("")
def create_game():
    return jsonify({"message": "create game endpoint coming next"}), 501


@games_bp.get("/<int:game_id>")
def get_game(game_id):
    return jsonify({"message": "get game endpoint coming next", "game_id": game_id}), 501


@games_bp.patch("/<int:game_id>")
def update_game(game_id):
    return jsonify({"message": "update game endpoint coming next", "game_id": game_id}), 501
