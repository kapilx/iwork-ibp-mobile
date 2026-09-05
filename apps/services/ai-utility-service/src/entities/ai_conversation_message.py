from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB

class AiConversationMessage(SQLModel, table=True):
    __tablename__ = "ai_conversation_message"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="ai_conversation.id")
    message_type: Optional[str] = Field(default=None, max_length=50) # 'request' or 'response'
    message_author: Optional[str] = Field(default=None, max_length=50) # 'user', 'assistant'
    message: Optional[str] = Field(default=None, sa_column=Column(Text))
    reference_message_id: Optional[int] = Field(default=None, foreign_key="ai_conversation_message.id")
    parent_message_id: Optional[int] = Field(default=None, foreign_key="ai_conversation_message.id")
    sql_query: Optional[str] = Field(default=None, sa_column=Column(Text))
    metadata_: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column("metadata", JSONB))
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None)
    updated_by: Optional[int] = Field(default=None)
