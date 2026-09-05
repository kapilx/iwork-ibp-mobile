from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB

class AiPromptFavourite(SQLModel, table=True):
    __tablename__ = "ai_prompt_favourite"

    id: Optional[int] = Field(default=None, primary_key=True)
    message_id: int = Field(foreign_key="ai_conversation_message.id")
    is_favourite: Optional[int] = Field(default=0)
    comment: Optional[str] = Field(default=None, sa_column=Column(Text))
    additional_info: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None)
    created_by: Optional[int] = Field(default=None)
