import os
import logging
import boto3
import watchtower
import json
from datetime import datetime
from typing import Optional, Dict, Any, Literal


# Global registry to track configured loggers
_configured_loggers = {}


class StructuredLogger:
    """
    Structured logger matching NestJS format.
    Provides methods for logging with structured metadata.
    """
    
    def __init__(self, logger: logging.Logger, trace_id: Optional[str] = None):
        self.logger = logger
        self.trace_id = trace_id
    
    def _build_log_message(
        self,
        message: str,
        trace_id: Optional[str] = None,
        user_id: Optional[int] = None,
        status: Optional[Literal["success", "failure"]] = None,
        location: Optional[str] = None,
        method: Optional[str] = None,
        payload: Optional[Any] = None,
        message_data: Optional[Any] = None,
        additional_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a structured log message matching NestJS format."""
        log_data = {}
        
        if trace_id or self.trace_id:
            log_data["traceId"] = trace_id or self.trace_id
        if user_id is not None:
            log_data["userId"] = user_id
        if status:
            log_data["status"] = status
        if location:
            log_data["location"] = location
        if method:
            log_data["method"] = method
        if payload is not None:
            log_data["payload"] = payload
        if message_data is not None:
            log_data["messageData"] = message_data
        if additional_info:
            log_data.update(additional_info)
        
        # If we have structured data, format as JSON, otherwise just return message
        if log_data:
            log_data["message"] = message
            return json.dumps(log_data, default=str)
        return message
    
    def log(
        self,
        message: str,
        trace_id: Optional[str] = None,
        user_id: Optional[int] = None,
        status: Optional[Literal["success", "failure"]] = None,
        location: Optional[str] = None,
        method: Optional[str] = None,
        payload: Optional[Any] = None,
        message_data: Optional[Any] = None,
        **kwargs
    ):
        """Log info level message with structured format."""
        formatted_msg = self._build_log_message(
            message, trace_id, user_id, status, location, method, payload, message_data, kwargs
        )
        self.logger.info(formatted_msg)
    
    def info(self, message: str, **kwargs):
        """Log info level message."""
        self.log(message, **kwargs)
    
    def error(
        self,
        message: str,
        trace_id: Optional[str] = None,
        user_id: Optional[int] = None,
        location: Optional[str] = None,
        method: Optional[str] = None,
        message_data: Optional[Any] = None,
        **kwargs
    ):
        """Log error level message with structured format."""
        formatted_msg = self._build_log_message(
            message, trace_id, user_id, "failure", location, method, None, message_data, kwargs
        )
        self.logger.error(formatted_msg)
    
    def warning(self, message: str, **kwargs):
        """Log warning level message."""
        formatted_msg = self._build_log_message(message, additional_info=kwargs)
        self.logger.warning(formatted_msg)
    
    def debug(self, message: str, **kwargs):
        """Log debug level message."""
        formatted_msg = self._build_log_message(message, additional_info=kwargs)
        self.logger.debug(formatted_msg)


def get_cloudwatch_logger(service_name: str = None, trace_id: str = None) -> StructuredLogger:

    LOG_GROUP_NAME = os.getenv("LOG_GROUP_NAME", "default-log-group")
    AWS_REGION = os.getenv("AWS_REGION")

    if not AWS_REGION:
        raise ValueError("AWS_REGION environment variable is required")

    # Match JS naming: serviceName-YYYY-MM-DD or 'global-stream'
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    stream_name = f"{service_name}-{date_str}" if service_name else "global-stream"

    # Use a unique logger name per service
    logger_name = service_name or "global_logger"
    
    # Check if this logger has already been configured
    if logger_name in _configured_loggers:
        return StructuredLogger(_configured_loggers[logger_name], trace_id)
    
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)
    logger.propagate = True  # Allow propagation for better visibility
    
    # Clear any existing handlers to prevent duplicates
    logger.handlers.clear()
    
    class CloudWatchFormatter(logging.Formatter):
        def format(self, record):
            timestamp = datetime.utcnow().isoformat()
            message = super().format(record)
            level = record.levelname.lower()
            return f"[Logger] {timestamp} [{level}]: {message}"

    formatter = CloudWatchFormatter("%(message)s")

    client = boto3.client("logs", region_name=AWS_REGION)  # IAM role is used automatically

    cw_handler = watchtower.CloudWatchLogHandler(
        log_group=LOG_GROUP_NAME,
        stream_name=stream_name,
        boto3_client=client,
        create_log_group=False,
        send_interval=1,  # Send logs more frequently (1 second)
        max_batch_size=10,  # Smaller batch size for more immediate logging
        max_batch_count=10  # Send after 10 messages
    )
    cw_handler.setLevel(logging.INFO)
    cw_handler.setFormatter(formatter)

    logger.addHandler(cw_handler)

    # Add Console Handler for local debugging
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Mark this logger as configured
    _configured_loggers[logger_name] = logger

    return StructuredLogger(logger, trace_id)
