import json
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session
from query_generation_agent import get_database_engine
from services.nl2sql import Nl2SqlService

from logger import get_cloudwatch_logger
logger = get_cloudwatch_logger(service_name="ai-utility-service")

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'environments', '.env.dev')
load_dotenv(dotenv_path=env_path, override=True)

DB_HOST = os.environ.get("DB_HOST")
DB_USERNAME = os.environ.get("DB_USER") 
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME")
DB_PORT = os.environ.get("DB_PORT")
DB_SSL = os.environ.get("DB_SSL", "false")
DB_SSL_CA = os.environ.get("DB_SSL_CA")

# Log error if critical DB details are missing
router = APIRouter()

def get_session():
    if not any([DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT]):
        logger.error("Database connection details are missing in environment variables.")
        raise HTTPException(status_code=500, detail="Database connection details are not properly configured.")

    engine = get_database_engine(
        db_host=DB_HOST,
        db_username=DB_USERNAME,
        db_password=DB_PASSWORD,
        db_name=DB_NAME,
        db_port=DB_PORT,
        db_ssl=DB_SSL,
        db_ssl_ca=DB_SSL_CA
    )
    with Session(engine) as session:
        yield session
# nl-2-sql/conversation/{user_id}
@router.get("/conversation/{user_id}", )
def get_conversation_requests(user_id: int, session: Session = Depends(get_session)):
    service = Nl2SqlService()
    res = service.get_user_conversation_requests(session, user_id)
    
    response = {
        "status": "success",
        "data": res,
        "error": None
    }
    return response

# nl-2-sql/response/{request_id}
@router.get("/response/{request_id}", )
def get_request_response(request_id: int, session: Session = Depends(get_session)):
    service = Nl2SqlService()
    result = service.get_request_response(session, request_id)
    
    if not result:
        return {
            "status": "failure",
            "data": None,
            "error": {
                "message": "Response not found",
                "code": "NOT_FOUND"
            }
        }

    res, feedback = result
    data = None
    error = None
    if res.metadata_.get("success"):
        try:
            parsed_data = json.loads(res.message) if res.message else []
        except json.JSONDecodeError:
            parsed_data = res.message
        data = {
            "sql_query": res.sql_query,
            "data": parsed_data,
            "data_format": res.metadata_.get("data_format"),
            "feedback": feedback.model_dump() if feedback else None,
            "message_id": res.id
        }
        status = "success"
    else:
        data = None
        error = {
            "message": res.message or "Unknown error",
            "code": res.metadata_.get("error_code", "UNKNOWN_ERROR")
        }
        status = "failure"
        
    response = {
        "status": status,
        "data": data,
        "error": error
    }
    return response

class UpdateConversationRequest(BaseModel):
    deactivate: bool

@router.put("/conversation/{user_id}")
def update_conversation(user_id: int, body: UpdateConversationRequest, session: Session = Depends(get_session)):
    if body.deactivate:
        service = Nl2SqlService()
        success = service.deactivate_conversation(session, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Active conversation not found for this user")
        return {"status": "success", "message": "Conversation deactivated"}
    return {"status": "ignored", "message": "No action taken"}
