from sqlmodel import Session, select
from entities.ai_conversation_message import AiConversationMessage

def get_messages_by_conversation_id(session: Session, conversation_id: int):
    statement = select(AiConversationMessage).where(AiConversationMessage.conversation_id == conversation_id).order_by(AiConversationMessage.created_at)
    messages = session.exec(statement).all()
    return messages
