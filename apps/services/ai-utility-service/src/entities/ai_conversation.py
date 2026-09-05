from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class AiConversation(SQLModel, table=True):
    __tablename__ = "ai_conversation"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None)
    title: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(default="active", max_length=50)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None)
    created_by: Optional[int] = Field(default=None)
    updated_by: Optional[int] = Field(default=None)
