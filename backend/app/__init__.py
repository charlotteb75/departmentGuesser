from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

from .config import Config

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

    db.init_app(app)
    migrate.init_app(app, db)

    from .routes.auth import auth_bp
    from .routes.games import games_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(games_bp, url_prefix="/api/games")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
