from app import create_app
from app.models import Game, User

app = create_app()


@app.shell_context_processor
def make_shell_context():
    return {"Game": Game, "User": User}
