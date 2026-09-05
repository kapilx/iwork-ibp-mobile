from sqlmodel import Session, select
from typing import List, Any, Dict
from entities.ai_conversation import AiConversation
from entities.ai_conversation_message import AiConversationMessage
from entities.ai_user_feedback import AiUserFeedback
from entities.ai_prompt_favourite import AiPromptFavourite

class Nl2SqlService:
    def get_user_conversation_requests(self, session: Session, user_id: int) -> List[Dict[str, Any]]:
        # Find the conversation for the user
        # Assuming one conversation per user as per requirement
        statement = select(AiConversation).where(AiConversation.user_id == user_id).where(AiConversation.status == "active")
        conversation = session.exec(statement).first()
        if not conversation:
            return []
        
        # Get all request messages for this conversation
        messages_statement = (
            select(AiConversationMessage, AiPromptFavourite)
            .join(AiPromptFavourite, AiConversationMessage.id == AiPromptFavourite.message_id, isouter=True)
            .where(AiConversationMessage.conversation_id == conversation.id)
            .where(AiConversationMessage.message_type == "request")
            .order_by(AiConversationMessage.created_at)
        )
        results = session.exec(messages_statement).all()
        
        messages = []
        for message, favourite in results:
            msg_dict = message.model_dump()
            if favourite:
                msg_dict["favourite"] = favourite
            messages.append(msg_dict)
        return messages

    def get_request_response(self, session: Session, request_id: int):
        # Find the response message where parent_message_id is the request_id
        statement = (
            select(AiConversationMessage, AiUserFeedback)
            .join(AiUserFeedback, AiConversationMessage.id == AiUserFeedback.message_id, isouter=True)
            .where(AiConversationMessage.reference_message_id == request_id)
        )
        result = session.exec(statement).first()
        
        
        return result

    def deactivate_conversation(self, session: Session, user_id: int) -> bool:
        # Find the active conversation for the user
        statement = select(AiConversation).where(AiConversation.user_id == user_id).where(AiConversation.status == "active")
        conversation = session.exec(statement).first()
        
        if not conversation:
            return False
            
        conversation.status = "inactive"
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        return True

    def get_user_conversation_history(self, session: Session, conversation_id: int, last_n_messages: int) -> list:
        import json
        from repositories.ai_conversation_message import get_messages_by_conversation_id
        from pydantic_ai.messages import ModelRequest, ModelResponse, UserPromptPart, TextPart

        messages = get_messages_by_conversation_id(session, conversation_id)
        requests = [m for m in messages if getattr(m, 'message_type', None) == 'request']
        responses = [m for m in messages if getattr(m, 'message_type', None) == 'response']

        # Pair requests and responses by reference (assuming response.reference_message_id == request.id)
        pairs = []
        for req in reversed(requests):
            resp = next((r for r in responses if getattr(r, 'reference_message_id', None) == req.id), None)
            if resp:
                pairs.append((req, resp))
            if len(pairs) >= last_n_messages:
                break
        pairs = list(reversed(pairs))

        chat_history = []
        for req, resp in pairs:
            req_content = getattr(req, 'content', None) or getattr(req, 'message', None) or ''
            chat_history.append(ModelRequest(parts=[UserPromptPart(content=req_content)]))

            # For response, try to parse message as JSON (data), and include metadata if present
            resp_message = getattr(resp, 'message', None) or ''
            resp_metadata = getattr(resp, 'metadata_', None)
            try:
                import os
                resp_data = json.loads(resp_message)
                # Limit records if resp_data is a list or dict with 'data' as a list
                max_records = int(os.getenv("ASK_ECHO_CONTEXT_RES_DATA_RECORDS_LENGTH", "20"))
                if isinstance(resp_data, list):
                    resp_data = resp_data[:max_records]
                elif isinstance(resp_data, dict) and isinstance(resp_data.get("data"), list):
                    resp_data["data"] = resp_data["data"][:max_records]
                resp_text = json.dumps({"data": resp_data, "metadata": resp_metadata}, default=str)
            except Exception:
                resp_text = resp_message
            chat_history.append(ModelResponse(parts=[TextPart(content=resp_text)]))
        return chat_history
