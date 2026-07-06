from marshmallow import Schema, fields, validate

class RegisterSchema(Schema):
    username = fields.String(
        required=True,
        validate=validate.Length(min=3, max=80),
    )
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, max=80),
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
