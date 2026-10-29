import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Open Client Portal"
    APP_ENV: str = "development"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./open_client_portal.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "open-client-portal-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = ".env"

settings = Settings()
