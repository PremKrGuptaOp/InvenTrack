import os


class Config:
    """Application configuration loaded from environment variables."""

    # Render PostgreSQL URLs start with postgres://, but SQLAlchemy requires postgresql://
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///inventory.db")
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
