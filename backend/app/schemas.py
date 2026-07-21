import re

from marshmallow import Schema, ValidationError, fields, validate


def validate_password(password):
    password_is_strong = (
        len(password) >= 12
        and re.search(r"[A-Z]", password)
        and re.search(r"[0-9]", password)
        and re.search(r"[^A-Za-z0-9\s]", password)
    )

    if not password_is_strong:
        raise ValidationError(
            "Le mot de passe doit contenir au moins 12 caractères, "
            "une majuscule, un chiffre et un caractère spécial."
        )


class RegisterSchema(Schema):
    username = fields.String(
        required=True,
        validate=validate.Length(min=3, max=80),
    )
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.And(validate.Length(max=80), validate_password),
    )

class LoginSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True, load_only=True)

class GameCreateSchema(Schema):
    name = fields.String(
        load_default="Nouvelle partie",
        validate=validate.Length(min=1, max=120))

class GameUpdateSchema(Schema):
    name = fields.String(
        load_default="Nouvelle partie",
        validate=validate.Length(min=1, max=120))
    found_department_ids = fields.List(fields.String(), required=True)
