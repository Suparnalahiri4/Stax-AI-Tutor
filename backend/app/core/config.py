# ABOUTME: Application configuration loaded from environment variables
# ABOUTME: Uses pydantic-settings for type-safe configuration management

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # Gemini API
    gemini_api_key: str
    
    # Hugging Face (for DeepSeek verification)
    huggingface_api_key: str
    deepseek_model_id: str = "deepseek-ai/deepseek-coder-6.7b-instruct"
    
    # Application
    secret_key: str
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
