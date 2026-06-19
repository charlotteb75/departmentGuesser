# Memory Game

Web game where you have to guess french departments from a map.

## Stack

- Frontend : Javascript/HTML/CSS
- Backend : Flask
- Database : PostgreSQL
- ORM : SQLAlchemy
- Migrations : Alembic

## Database graph

```mermaid
erDiagram
    USERS ||--o{ GAMES : "possede"

    USERS {
        int id PK
        string username UK
        string password_hash
        datetime created_at
    }

    GAMES {
        int id PK
        int user_id FK
        string name
        jsonb found_department_ids
        string selected_department_id
        datetime completed_at
        datetime created_at
        datetime updated_at
    }
```
