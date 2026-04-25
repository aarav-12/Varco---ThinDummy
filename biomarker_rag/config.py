from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    LLM_MODEL: str = "llama3"          # or "mistral"
    LLM_TEMPERATURE: float = 0.0       # deterministic
    LLM_NUM_PREDICT: int = 1024        # cap token output
    TOP_K_CHUNKS: int = 3
    MIN_BIOMARKERS: int = 12
    MIN_DOMAINS: int = 4

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
