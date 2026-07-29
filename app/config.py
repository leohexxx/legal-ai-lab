"""应用配置管理."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，支持环境变量覆盖."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # 应用信息
    app_name: str = "Legal AI Lab"
    app_version: str = "0.1.0"
    debug: bool = False

    # 数据库
    database_url: str = "postgresql://legalai:legalai@localhost:5432/legalai"
    database_echo: bool = False

    # 知识库路径
    knowledge_base_path: Path = Path("data/knowledge")
    raw_data_path: Path = Path("data/raw")
    normalized_data_path: Path = Path("data/normalized")

    # LLM API（DeepSeek 配置）
    llm_api_key: str = "sk-0afad2bc0acb439cbaccfe58fe1f9c13"
    llm_api_base: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-chat"
    llm_timeout: int = 30

    # 审计日志
    audit_log_enabled: bool = True


@lru_cache()
def get_settings() -> Settings:
    """获取全局配置单例."""
    return Settings()
