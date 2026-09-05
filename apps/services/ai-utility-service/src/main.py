import os
from select import select
from dotenv import load_dotenv
# Load environment variables from .env file
node_env = os.getenv('NODE_ENV', 'dev')
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'environments', f".env.{node_env}")
load_dotenv(dotenv_path=env_path, override=True)
import re

import json
import math
import time
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
from sqlmodel import Session, text, select, SQLModel
from entities.ai_conversation import AiConversation
from entities.ai_conversation_message import AiConversationMessage
# from .chat_service import ChatService
from query_generation_agent import get_database_engine, run_complete_policy_analysis, run_complete_nudge_analysis
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List, Literal
from contextlib import asynccontextmanager
import httpx
from apis.nl2sql import router as nl2sql_router
from logger import get_cloudwatch_logger

# Load conversation window size for context echo
ASK_ECHO_CONTEXT_WINDOW_SIZE = int(os.getenv("ASK_ECHO_CONTEXT_WINDOW_SIZE", "0"))

logger = get_cloudwatch_logger(service_name="ai-utility-service")


# Load database connection parameters from environment
DB_HOST = os.environ.get("DB_HOST")
DB_USERNAME = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_SSL = os.environ.get("DB_SSL", "false")
DB_SSL_CA = os.environ.get("DB_SSL_CA")

# Load NL2SQL database connection parameters from environment
NL2SQL_DB_HOST = os.environ.get("NL2SQL_DB_HOST")
NL2SQL_DB_USERNAME = os.environ.get("NL2SQL_DB_USERNAME")
NL2SQL_DB_PASSWORD = os.environ.get("NL2SQL_DB_PASSWORD")
NL2SQL_DB_NAME = os.environ.get("NL2SQL_DB_NAME")
NL2SQL_DB_PORT = os.environ.get("NL2SQL_DB_PORT", "5432")
NL2SQL_DB_SSL = os.environ.get("DB_SSL", "false")
NL2SQL_DB_SSL_CA = os.environ.get("DB_SSL_CA")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup: Register this service with the service registry
    logger.info(
        "AI Utility Service starting up",
        status="success",
        location="main",
        method="lifespan.startup"
    )
    service_info = {
        "name": "ai-utility-service",
        "url": os.getenv("URL_AI_UTILITY_SERVICE", "http://localhost:3026"),
        "port": os.getenv("PORT_AI_UTILITY_SERVICE", "3026"),
        "healthCheck": "/health",
        "status": "active"
    }
    
    service_registry_url = os.getenv("URL_SERVICE_REGISTRY", "http://localhost:3002")
    logger.info(
        "Registering service with registry",
        status="success",
        location="main",
        method="lifespan.startup",
        payload={"service_registry_url": service_registry_url}
    )
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{service_registry_url}/service-registry/registry/register",
                json=service_info,
                timeout=10.0
            )
            logger.info(
                "Service registered successfully",
                status="success",
                location="main",
                method="lifespan.startup",
                payload=service_info,
                message_data={"response_status": response.status_code}
            )
    except Exception as error:
        logger.error(
            "Failed to register service",
            location="main",
            method="lifespan.startup",
            message_data=str(error)
        )
    
    yield
    
    # Shutdown: Could add cleanup logic here if needed
    logger.info(
        "AI Utility Service shutting down",
        status="success",
        location="main",
        method="lifespan.shutdown"
    )

app = FastAPI(title="NL2SQL Chat API", version="0.1.0", lifespan=lifespan)

class DataFormat(BaseModel):
    row_count: int
    column_count: int
    columns: list
    graph_semantics: dict

class ResponseData(BaseModel):
    user_query: str
    sql_query: Optional[str] = None
    data: list
    data_format: DataFormat
    message_id:int

class ErrorInfo(BaseModel):
    message: str
    code: str

class CombinedNL2SQLRequest(BaseModel):
    prompt: str
    assistant_id: Optional[str] = "16"
    execute_query: Optional[bool] = False
    conversation_id: Optional[int] = None
    user_id: Optional[int] = None

class CombinedNL2SQLResponse(BaseModel):
    status: Literal["success", "failure"]
    data: Optional[ResponseData] = None
    error: Optional[ErrorInfo] = None
    conversation_id: Optional[int] = None

class Nudge(BaseModel):
    nudge_id: int
    attributes: Dict[str, Any]
    prompt: str
    nudge_template: str


class NudgeRequest(BaseModel):
    user_id: int
    nudges: List[Nudge]

# Redis client initialization
import redis

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", "6379"))
redis_client = redis.Redis(
    host=redis_host, port=redis_port, db=0, ssl=True, ssl_cert_reqs=None
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

app.include_router(nl2sql_router, prefix="/nl-2-sql", tags=["nl2sql"])


async def onyx_chat_with_sql_generation(
    prompt: str, assistant_id: str = "16", execute_query: bool = False, message_history=None
) -> dict:
    """
    Function 1: Onyx chat service with integrated SQL generation and optional execution.
    Gets context from Onyx and generates SQL using the query generation agent.

    Args:
        prompt: Natural language query
        sql_result = await run_complete_policy_analysis(prompt, message_history=message_history, relevant_tables=relevant_tables)
        execute_query: Whether to execute the generated SQL query
        message_history: Optional conversation history for context

    Returns:
        dict: Combined response with Onyx context, generated SQL, and optional results
    """
    try:
        logger.info(
            "Starting Onyx chat with SQL generation",
            status="success",
            location="onyx_chat_with_sql_generation",
            method="onyx_chat_with_sql_generation",
            payload={"prompt": prompt, "execute_query": execute_query, "assistant_id": assistant_id}
        )

        # # Step 1: Get context from Onyx
        # try:
        #     # onyx_response = await chat_service.create_chat_session(
        #     #     prompt=prompt, assistant_id=assistant_id
        #     # )
        #     logger.info("Onyx response received")

        #     # # Step 2: Extract relevant table names from Onyx response
        #     # relevant_tables = extract_table_names_from_onyx_response(onyx_response)
        #     relevant_tables = []
        #     onyx_response = "Onyx response skipped for testing"
        #     logger.info(f"Extracted relevant tables from Onyx: {relevant_tables}")

        # except Exception as onyx_error:
        #     logger.warning(f"Onyx service error: {onyx_error}")
        #     logger.info("Falling back to SQL generation without Onyx context")
        #     onyx_response = f"Onyx service unavailable: {str(onyx_error)}"
        #     relevant_tables = []  # Use full schema as fallback

        # # Step 3: Generate SQL and optionally execute using enhanced infini agent
        # # Convert relevant_tables list to comma-separated string for the agent
        # relevant_tables_str = ", ".join(relevant_tables) if relevant_tables else ""
        sql_result = await run_complete_policy_analysis(prompt)
        logger.info(
            "Enhanced policy analysis completed",
            status="success",
            location="onyx_chat_with_sql_generation",
            method="run_complete_policy_analysis",
            message_data={"has_sql": bool(sql_result.get("sql_query")), "execution_success": sql_result.get("execution_success")}
        )

        # Combine results
        result = {
            "user_query": prompt,
            "sql_query": sql_result.get("sql_query"),
            "explanation": sql_result.get("explanation"),
            "business_context": sql_result.get("business_context"),
            "error": sql_result.get("error"),
            "graph_semantics": sql_result.get("graph_semantics"),
            "execution_success": sql_result.get("execution_success"),
            "execution_time_ms": sql_result.get("execution_time_ms"),
            "row_count": sql_result.get("row_count"),
            "column_count": sql_result.get("column_count"),
            "total_count": sql_result.get("total_count"),
            "columns": sql_result.get("columns"),
            "data": sql_result.get("data"),
            "execution_error": sql_result.get("execution_error"),
            "status_code": sql_result.get("status_code", 500),
        }

        return result

    except Exception as e:
        logger.error(
            "Error in Onyx chat with SQL generation",
            location="onyx_chat_with_sql_generation",
            method="onyx_chat_with_sql_generation",
            message_data=str(e)
        )
        return {"user_query": prompt, "error": f"Failed to process request: {str(e)}"}


async def standalone_sql_generation(
    prompt: str, relevant_tables: list = None, execute_query: bool = False
) -> dict:
    """
    Function 2: Standalone SQL query generation and optional execution.
    Direct SQL generation without Onyx integration.

    Args:
        prompt: Natural language query
           sql_result = await run_complete_policy_analysis(prompt, message_history=message_history, relevant_tables=relevant_tables_str)
        execute_query: Whether to execute the generated SQL query

    Returns:
        dict: SQL generation and execution result
    """
    try:
        logger.info(
            f"Starting standalone SQL generation (execute={execute_query}) for: {prompt}"
        )

        # Generate SQL using enhanced infini agent with relevant tables
        relevant_tables_str = ", ".join(relevant_tables) if relevant_tables else ""
        sql_result = await run_complete_policy_analysis(prompt, relevant_tables_str)
        logger.info("Enhanced policy analysis completed")

        result = {
            "user_query": prompt,
            "sql_query": sql_result.get("sql_query", ""),
            "explanation": sql_result.get("explanation", ""),
            "business_context": sql_result.get("business_context", ""),
            "error": sql_result.get("error"),
            "graph_semantics": sql_result.get("graph_semantics"),
            "execution_success": sql_result.get("execution_success"),
            "execution_time_ms": sql_result.get("execution_time_ms"),
            "row_count": sql_result.get("row_count"),
            "column_count": sql_result.get("column_count"),
            "total_count": sql_result.get("total_count"),
            "data": sql_result.get("data"),
            "columns": sql_result.get("columns"),
            "execution_error": sql_result.get("execution_error"),
        }

        return result

    except Exception as e:
        logger.error(f"Error in standalone SQL generation: {e}")
        return {"user_query": prompt, "error": f"Failed to generate SQL: {str(e)}"}

def normalize_prompt_for_key(prompt: str) -> str:
    p = prompt.strip().lower()                  
    p = re.sub(r"\s+", " ", p)                 
    p = p.replace(" ", "_")                    
    return p

def make_cache_key(prefix: str, prompt: str, assistant_id: str, execute_query: bool) -> str:
    normalized_prompt = normalize_prompt_for_key(prompt)
    execute_flag = "1" if execute_query else "0"
    return f"{prefix}:{normalized_prompt}:{assistant_id}:{execute_flag}"

@app.post("/nl2sql", response_model=CombinedNL2SQLResponse)
async def combined_nl2sql(request: CombinedNL2SQLRequest):
    conversation_id = request.conversation_id
    user_message_id = None
    user_id = request.user_id
    response_payload = None

     # Initialize app database engine
    app_db_engine = get_database_engine(
        db_host=DB_HOST,
        db_username=DB_USERNAME,
        db_password=DB_PASSWORD,
        db_name=DB_NAME,
        db_port=DB_PORT,
        db_ssl=DB_SSL,
        db_ssl_ca=DB_SSL_CA
    )
    
    # Initialize NL2SQL database engine
    nl2sql_db_engine = get_database_engine(
        db_host=NL2SQL_DB_HOST,
        db_username=NL2SQL_DB_USERNAME,
        db_password=NL2SQL_DB_PASSWORD,
        db_name=NL2SQL_DB_NAME,
        db_port=NL2SQL_DB_PORT,
        db_ssl=NL2SQL_DB_SSL,
        db_ssl_ca=NL2SQL_DB_SSL_CA
    )
    if not user_id:
        response_payload = CombinedNL2SQLResponse(
            status="failure",
            data=None,
            error=ErrorInfo(message="User ID is required", code="MISSING_USER_ID")
        )
        return response_payload
    
    # Start a session for conversation management
    with Session(app_db_engine) as session:
        logger.info("Opened app database session for conversation management")
        try:
            # 1. Create/Get Conversation
            if not conversation_id:
                statement = select(AiConversation).where(AiConversation.user_id == user_id).where(AiConversation.status == "active")
                conversation = session.exec(statement).first()
                if not conversation:
                    conversation = AiConversation(
                        user_id=request.user_id,
                        title=request.prompt[:50] if request.prompt else "New Conversation",
                        status="active",
                        created_by=request.user_id,
                        updated_by=request.user_id
                    )
                    session.add(conversation)
                    session.commit()
                    session.refresh(conversation)
                conversation_id = conversation.id
                print(f"Using conversation ID {conversation_id} for user {user_id}")
            
            # 2. Log User Request
            user_message = AiConversationMessage(
                conversation_id=conversation_id,
                message_type="request",
                message_author="user",
                message=request.prompt,
                created_by=request.user_id,
                updated_by=request.user_id
            )
            session.add(user_message)
            session.commit()
            session.refresh(user_message)
            user_message_id = user_message.id
            print(f"Logged user message with ID {user_message_id} in conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Error logging conversation: {e}")
            print(f"Error logging conversation: {e}")
            # Continue even if logging fails
            pass

    message_history = None
    if ASK_ECHO_CONTEXT_WINDOW_SIZE > 0 and conversation_id:
        from services.nl2sql import Nl2SqlService
        with Session(app_db_engine) as conversation_session:
            nl2sql_service = Nl2SqlService()
            message_history = nl2sql_service.get_user_conversation_history(
                conversation_session, conversation_id, ASK_ECHO_CONTEXT_WINDOW_SIZE
            )
    logger.info(f"Retrieved message history for context: {message_history}")

    try:
        cache_key = make_cache_key("nl2sql", request.prompt, request.assistant_id, request.execute_query)
        print(f"Generated normalized cache key: {cache_key}")
        cached = redis_client.get(cache_key)
        if cached:
            print(f"Cache hit for key {cache_key}")
            cached_obj = json.loads(cached)
            # Re-execute the cached SQL query to get fresh data
            sql_query = cached_obj.get("sql_query")
            if not sql_query:
                logger.warning("Cached object missing sql_query. Falling back to full pipeline.")
                cached = None  # Force full run
            else:
                # Re-execute the cached SQL to get fresh data
                try:
                    logger.info("Opening NL2SQL database session for cached query execution")
                    with Session(nl2sql_db_engine) as nl2sql_session:
                        result = nl2sql_session.exec(text(sql_query))
                        rows = result.fetchall()
                        columns = result.keys()
                        df = pd.DataFrame(rows, columns=columns)

                    data = df.to_dict(orient="records") if not df.empty else []
                    row_count = len(df)
                    columns_list = list(df.columns) if not df.empty else cached_obj.get("columns", [])

                    # Build proper ResponseData
                    response_data = ResponseData(
                        user_query=cached_obj["user_query"],
                        sql_query=sql_query,
                        data=data,
                        data_format=DataFormat(
                            row_count=row_count,
                            column_count=len(columns_list),
                            columns=columns_list,
                            graph_semantics=cached_obj.get("graph_semantics", {})
                        ),
                        message_id=user_message_id
                    )

                    logger.info("Closed NL2SQL database session for cached query execution")
                    response_payload = CombinedNL2SQLResponse(status="success", data=response_data, error=None)

                except Exception as db_exc:
                    logger.error(f"Error executing cached SQL: {db_exc}")
                    # Fall back to full pipeline if DB execution fails
                    pass

        if not response_payload:
            # Cache miss or cache invalid: run full pipeline
            result = await onyx_chat_with_sql_generation(
                prompt=request.prompt,
                assistant_id=request.assistant_id,
                execute_query=request.execute_query,
                message_history=message_history,
            )
            logger.info("Obtained result from Onyx chat with SQL generation")   
            # Handle error case from pipeline
            if result.get("error"):
                error_message = result["error"]
                if "cannot access local variable" in error_message:
                    error_message = "I've reached my processing token limit while analyzing your request. This happens when queries are very complex or involve large amounts of data. Please try again in 2-3 minutes."
                response_payload = CombinedNL2SQLResponse(
                    status="failure",
                    data=None,
                    error=ErrorInfo(message=error_message, code="PIPELINE_ERROR")
                )
            else:
                # Prepare data format
                data_format = DataFormat(
                    row_count=result.get("row_count", 0),
                    column_count=result.get("column_count", 0),
                    columns=result.get("columns", []),
                    graph_semantics=result.get("graph_semantics", {})
                )

                response_data = ResponseData(
                    user_query=result["user_query"],
                    sql_query=result.get("sql_query"),
                    data=result.get("data", []),
                    data_format=data_format,
                    message_id=user_message_id
                )

                # Cache the static parts (excluding live data)
                if result.get("sql_query") and not result.get("error"):
                    cache_obj = {
                        "user_query": result["user_query"],
                        "sql_query": result["sql_query"],
                        "graph_semantics": result.get("graph_semantics", {}),
                        "columns": result.get("columns", []),  # optional: cache column names if stable
                    }
                    redis_client.set(cache_key, json.dumps(cache_obj), ex=3600)  # optional TTL
                    print(f"Cached SQL/metadata for key {cache_key}")

                response_payload = CombinedNL2SQLResponse(
                    status="success",
                    data=response_data,
                    error=None
                )

    except Exception as e:
        logger.error(f"Unexpected error in /nl2sql: {e}")
        response_payload = CombinedNL2SQLResponse(
            status="failure",
            data=None,
            error=ErrorInfo(message=str(e), code="INTERNAL_ERROR")
        )

    # Ensure response_payload has conversation_id
    if response_payload:
        response_payload.conversation_id = conversation_id

    # 3. Log Assistant Response
    if conversation_id and response_payload:
        logger.info("Opening app database session for response logging")
        with Session(app_db_engine) as app_session:
            try:
                sql_query = None
                message_text = ""
                
                if response_payload.status == "success" and response_payload.data:
                    sql_query = response_payload.data.sql_query
                    # Store data as JSON string for easier retrieval
                    message_text = json.dumps(response_payload.data.data, default=str)
                    metadata = {
                        "success": True,
                        "data_format": response_payload.data.data_format.model_dump()
                    }
                else:
                    message_text = response_payload.error.message if response_payload.error else "Unknown error"
                    metadata = { "success": False, "error_code": response_payload.error.code } if response_payload.error else {}

                assistant_message = AiConversationMessage(
                    conversation_id=conversation_id,
                    message_type="response",
                    message_author="assistant",
                    message=message_text,
                    reference_message_id=user_message_id,
                    sql_query=sql_query,
                    metadata_=metadata,
                    created_by=request.user_id,
                    updated_by=request.user_id
                )
                app_session.add(assistant_message)
                app_session.commit()
            except Exception as e:
                logger.error(f"Error logging response: {e}")
                print(f"Error logging response: {e}")

    return response_payload


def render_template(template: str, attributes: Dict[str, Any]) -> str:
    """Replace {{key}} with attribute values"""
    rendered = template
    for key, value in attributes.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
    return rendered

async def generate_nudge_result(nudge: Nudge) -> Dict[str, Any]:
    """
    Executes a single nudge using the nudge-specific pipeline
    """
    print(f"Running nudge {nudge.nudge_id}")

    result = await run_complete_nudge_analysis(
        prompt=nudge.prompt,
        attributes=nudge.attributes,
        nudge_template=nudge.nudge_template
    )
    print(f"Nudge {nudge.nudge_id} result: {result}")

    return {
        "data": result.get("data", {}),
        "sql_query": result.get("sql_query")  # Include SQL for caching
    }


def normalize_attributes(attributes: Dict[str, Any]) -> str:
    """
    Convert attributes to a stable string so key order does not matter
    """
    return json.dumps(attributes, sort_keys=True)


def make_nudge_cache_key(nudge: Nudge) -> str:
    """
    Cache key includes:
    - nudge_id
    - prompt  
    - attributes (keys only, not values since they change)
    - template
    """
    prompt_key = normalize_prompt_for_key(nudge.prompt)
    attr_keys = json.dumps(sorted(nudge.attributes.keys()))  # Only attribute names, not values
    template_key = normalize_prompt_for_key(nudge.nudge_template)
    return f"nudge:{nudge.nudge_id}:{prompt_key}:{attr_keys}:{template_key}"


def cache_nudge_result(nudge: Nudge, nudge_result: Dict[str, Any]) -> None:
    """
    Cache the SQL query and attribute mapping for future use
    """
    try:
        if not nudge_result.get("sql_query") or not nudge_result.get("data"):
            return
            
        # Create mapping from attribute names to SQL column names
        # Assuming nudge_result["data"] keys match the SQL column names
        sql_data = nudge_result["data"]
        attribute_mapping = {}
        
        # Map original attribute names to SQL result column names
        sql_columns = list(sql_data.keys())
        attr_names = list(nudge.attributes.keys())
        
        # Simple 1:1 mapping (could be enhanced with smarter matching)
        for i, attr_name in enumerate(attr_names):
            if i < len(sql_columns):
                attribute_mapping[attr_name] = sql_columns[i]
        
        cache_obj = {
            "sql_query": nudge_result["sql_query"],
            "attributes": attribute_mapping,  # Map attribute names to SQL columns
            "template": nudge.nudge_template
        }
        
        cache_key = make_nudge_cache_key(nudge)
        redis_client.set(cache_key, json.dumps(cache_obj), ex=3600)  # 1 hour TTL
        print(f"Cached nudge SQL/mapping for key {cache_key}")
        
    except Exception as e:
        logger.error(f"Error caching nudge result: {e}")


@app.post("/get-nudge-data")
async def run_nudges(request: NudgeRequest):
    """
    Executes multiple nudges and returns
    Nudge_<id>_Response format
    """
    try:
         # Initialize NL2SQL database engine
        nl2sql_db_engine = get_database_engine(
            db_host=NL2SQL_DB_HOST,
            db_username=NL2SQL_DB_USERNAME,
            db_password=NL2SQL_DB_PASSWORD,
            db_name=NL2SQL_DB_NAME,
            db_port=NL2SQL_DB_PORT,
            db_ssl=NL2SQL_DB_SSL,
            db_ssl_ca=NL2SQL_DB_SSL_CA
        )
        response: Dict[str, Any] = {}
        print(f"Received nudge request for user {request.user_id} with {len(request.nudges)} nudges")
        for nudge in request.nudges:
            # Try cache first
            cache_key = make_nudge_cache_key(nudge)
            print(f"Generated nudge cache key: {cache_key}")
            cached = redis_client.get(cache_key)
            
            if cached:
                print(f"Cache hit for nudge key {cache_key}")
                cached_obj = json.loads(cached)
                sql_query = cached_obj.get("sql_query")
                attributes = cached_obj.get("attributes")
                
                if sql_query and attributes:
                    try:
                        # Re-execute cached SQL to get fresh data
                        logger.info("Opening NL2SQL database session for nudge cache execution")
                        with Session(nl2sql_db_engine) as nl2sql_session:
                            result = nl2sql_session.exec(text(sql_query))
                            rows = result.fetchall()
                            columns = result.keys()
                            df = pd.DataFrame(rows, columns=columns)

                        # Get first row (like nudge analysis does)
                        if not df.empty:
                            fresh_data = df.iloc[0].to_dict()
                            # Map SQL columns to original attribute names
                            mapped_data = {}
                            for attr_name, sql_column in attributes.items():
                                mapped_data[attr_name] = fresh_data.get(sql_column, None)
                        else:
                            mapped_data = {}

                        response[f"Nudge_{nudge.nudge_id}_Response"] = {
                            "data": mapped_data,
                            "nudge_id": nudge.nudge_id,
                            "nudge_template": nudge.nudge_template
                        }
                        continue  # Skip to next nudge
                        
                    except Exception as db_exc:
                        logger.error(f"Error executing cached nudge SQL: {db_exc}")
                        # Fall through to full execution
            
            # Cache miss or error - run full nudge analysis
            nudge_result = await generate_nudge_result(nudge)
            
            # Keep same response format - only include data (not sql_query)
            frontend_response = {
                "data": nudge_result.get("data", {}),
                "nudge_id": nudge.nudge_id,
                "nudge_template": nudge.nudge_template
            }
            
            response[f"Nudge_{nudge.nudge_id}_Response"] = frontend_response
            
            # Cache for next time if successful (sql_query used only internally)
            if nudge_result.get("data") and nudge_result.get("sql_query"):
                cache_nudge_result(nudge, nudge_result)

        return response

    except Exception as e:
        logger.error("Nudge execution failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Nudge execution failed")

class QueryRequest(BaseModel):
    sql_query: str
    page: int = 1
    limit: int = 10

@app.post("/paginate")
def run_paginated_query(request: QueryRequest):
    sql_query = request.sql_query
    page = request.page
    limit = request.limit
     # Initialize NL2SQL database engine
    nl2sql_db_engine = get_database_engine(
        db_host=NL2SQL_DB_HOST,
        db_username=NL2SQL_DB_USERNAME,
        db_password=NL2SQL_DB_PASSWORD,
        db_name=NL2SQL_DB_NAME,
        db_port=NL2SQL_DB_PORT,
        db_ssl=NL2SQL_DB_SSL,
        db_ssl_ca=NL2SQL_DB_SSL_CA
    )

    if page < 1 or limit < 1:
        return {
            "success": False,
            "error": "Page and limit must be positive integers.",
            "data": [],
            "total_records": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "row_count": 0,
            "columns": [],
            "status_code": 400,
        }

    # Get database engine
    try:
        offset = (page - 1) * limit

        # The query is interpolated into a subquery wrapper below, so it must be
        # a single read-only SELECT. Reject stacked statements (";"), SQL
        # comments ("--", "/* */") and non-SELECT queries — these are how an
        # attacker would break out of the wrapper or run write operations.
        normalized_sql = sql_query.strip().rstrip(";").strip()
        if (
            not re.match(r'^\s*SELECT\b', normalized_sql, re.IGNORECASE)
            or ";" in normalized_sql
            or "--" in normalized_sql
            or "/*" in normalized_sql
        ):
            return {
                "success": False,
                "error": "Only a single read-only SELECT query is permitted.",
                "data": [],
                "total_records": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0,
                "row_count": 0,
                "columns": [],
                "status_code": 400,
            }
        sql_query = normalized_sql

        # count query wrapper
        count_query = f"SELECT COUNT(*) as total FROM ({sql_query}) as total_count"

        # paginated query wrapper — limit/offset bound as params to prevent injection
        paginated_query = f"SELECT * FROM ({sql_query}) as paginated_data LIMIT :limit OFFSET :offset"

        start_time = time.time()

        logger.info("Opening NL2SQL database session for pagination query")
        with Session(nl2sql_db_engine) as nl2sql_session:
            # total count
            total_result = nl2sql_session.exec(text(count_query))
            total_records = int(total_result.scalar() or 0)

            # paginated fetch
            result = nl2sql_session.exec(text(paginated_query).bindparams(limit=int(limit), offset=int(offset)))
            rows = result.fetchall()
            columns = result.keys()
            df = pd.DataFrame(rows, columns=columns)

        end_time = time.time()
        execution_time_ms = int((end_time - start_time) * 1000)

        data = df.to_dict(orient="records") if not df.empty else []
        total_pages = math.ceil(total_records / limit) if limit > 0 else 1

        return {
            "success": True,
            "data": data,
            "total_records": total_records,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "row_count": len(df),
            "columns": list(df.columns),
            "execution_time_ms": execution_time_ms,
            "status_code": 200,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": [],
            "total_records": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "row_count": 0,
            "columns": [],
            "status_code": 500,
        }

@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "AI Utility Service is healthy"}

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment variables (already loaded via dotenv at top)
    PORT = int(os.getenv("PORT_AI_UTILITY_SERVICE", os.getenv("PORT", "8001")))
    HOST = os.getenv("HOST", "0.0.0.0")
    ENV = os.getenv("NODE_ENV", "development")
    
    # Determine if reload should be enabled based on environment
    RELOAD = False
    
    logger.info(f"Starting AI Utility Service on {HOST}:{PORT} (env={ENV}, reload={RELOAD})")
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level="info"
    )
