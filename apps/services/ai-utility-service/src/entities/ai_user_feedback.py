from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB

class AiUserFeedback(SQLModel, table=True):
    __tablename__ = "ai_user_feedback"

    id: Optional[int] = Field(default=None, primary_key=True)
    message_id: int = Field(foreign_key="ai_conversation_message.id")
    comment: Optional[str] = Field(default=None, sa_column=Column(Text))
    additional_info: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    is_valid_response: Optional[int] = Field(default=None)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None)
    updated_by: Optional[int] = Field(default=None)
