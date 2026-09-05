from sqlmodel import Session, select
from entities.ai_conversation import AiConversation

def get_conversation_by_id(session: Session, conversation_id: int):
    statement = select(AiConversation).where(AiConversation.id == conversation_id)
    conversation = session.exec(statement).first()
    return conversation
