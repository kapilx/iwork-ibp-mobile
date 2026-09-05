import os, base64
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'environments', '.env.dev')
load_dotenv(dotenv_path=env_path, override=True)

import urllib.parse
import pandas as pd
from enum import Enum
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from sqlmodel import create_engine, Session, text
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.google import GoogleModel
from decimal import Decimal
from pathlib import Path
import re
import time

import logfire

from logger import get_cloudwatch_logger

logger = get_cloudwatch_logger(service_name="ai-utility-service")

# Load NL2SQL database connection parameters from environment
NL2SQL_DB_HOST = os.environ.get("NL2SQL_DB_HOST")
NL2SQL_DB_USERNAME = os.environ.get("NL2SQL_DB_USERNAME")
NL2SQL_DB_PASSWORD = os.environ.get("NL2SQL_DB_PASSWORD")
NL2SQL_DB_NAME = os.environ.get("NL2SQL_DB_NAME")
NL2SQL_DB_PORT = os.environ.get("NL2SQL_DB_PORT", "5432")
NL2SQL_DB_SSL = os.environ.get("DB_SSL", "false")
NL2SQL_DB_SSL_CA = os.environ.get("DB_SSL_CA")


# Load environment variables from the correct path

logfire.configure(
    token=os.environ.get("LOGFIRE_WRITE_TOKEN", "dummy"),
    environment=os.environ.get("ENVIRONMENT", "dev"),
    service_name="POLICY-NL2SQL-IIRM",
    scrubbing=False
)
logfire.instrument_pydantic_ai()


def convert_decimal_to_float(df: pd.DataFrame) -> pd.DataFrame:
    """Convert Decimal columns to float for JSON serialization"""
    for col in df.columns:
        if df[col].dtype == "object":
            if df[col].apply(lambda x: isinstance(x, Decimal)).any():
                df[col] = df[col].astype(float)
    return df


def load_policy_schema() -> str:
    """Load the comprehensive policy schema"""
    try:
        schema_path = (
            Path(__file__).parent.parent
            / "data"
            / "iirm"
            / "policy.txt"
        )
        with open(schema_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return "Schema loading failed"
    
def load_lookup_schema() -> str:
    """Load the lookup_data schema (distinct values)"""
    try:
        schema_path = (
            Path(__file__).parent.parent.parent
            / "data"
            / "lookup_data_distinct.txt"
        )
        with open(schema_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return "Lookup schema loading failed"



class GraphType(str, Enum):
    scalar = "scalar"
    raw_table = "raw-table"
    bar = "bar"
    time_series = "time-series"
    pie_chart = "pie-chart"
    line_chart = "line-chart"

class Graph(BaseModel):
    type: GraphType = Field(..., description="Type of graph to plot.")
    x_axis: Optional[str] = Field(None, description="Column for X-axis (bar/time-series only).")
    y_axis: Optional[str] = Field(None, description="Column for Y-axis (bar/time-series only).")

class PolicySuccess(BaseModel):
    sql_query: str = Field(..., description="The SQL query to execute in the database")
    graph_semantics: Graph = Field(..., description="Graph type and axes for visualization")

class PolicyDirectSuccess(BaseModel):
    explanation: str = Field(..., description="The direct Natural Language answer to the user's question based on the given history data. Remember in this case there is no sql query execution.")
class NudgeSuccess(BaseModel):
    sql_query: str = Field(..., description="SQL query for the nudge")
    explanation: str = Field(..., description="How the metric was computed")

class NudgeInvalidRequest(BaseModel):
    error: str = Field(..., description="Why the nudge could not be generated")


NudgeResponse = Union[NudgeSuccess, NudgeInvalidRequest]


class PolicyInvalidRequest(BaseModel):
    error: str = Field(..., description="Description of why the request is invalid") 

class PolicyNaturalResponse(BaseModel):
    message: str = Field(..., description="A polite formal response in case the question is out of scope or a greeting")


PolicyResponse = Union[PolicySuccess, PolicyDirectSuccess, PolicyInvalidRequest, PolicyNaturalResponse]


# Database connection using provided parameters - initialized lazily
def get_database_engine(
    db_host: str,
    db_username: str,
    db_password: str,
    db_name: str,
    db_port: str = "5432",
    db_ssl: str = "false",
    db_ssl_ca: str = None,
):
    is_ssl = str(db_ssl).lower() == "true"

    db_connection_url = (
        f"postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
    )

    logger.info(
        f"Creating DB engine → host={db_host}, db={db_name}, ssl={is_ssl}"
    )

    connect_args = {}

    if is_ssl:
        if not db_ssl_ca:
            raise RuntimeError("SSL is enabled but DB_SSL_CA is not set")

        try:
            file_content = open(db_ssl_ca, "r", encoding="utf-8").read().strip()
            ca_pem = base64.b64decode(file_content).decode("utf-8")

            decoded_ca_path = "/app/decoded_ca.crt"
            with open(decoded_ca_path, "w", encoding="utf-8") as f:
                f.write(ca_pem)

            if "BEGIN CERTIFICATE" not in ca_pem:
                raise ValueError("Decoded CA does not look like PEM")

            connect_args = {
                "sslmode": "require",
                "sslrootcert": decoded_ca_path,
            }

            logger.info("SSL enabled for database connection")

        except Exception as e:
            logger.error("Failed to configure SSL", exc_info=e)
            raise RuntimeError("Invalid SSL configuration") from e

    else:
        # 🧪 LOCAL / NON-SSL PATH
        logger.info("SSL disabled — using non-SSL DB connection (local/dev)")

    engine = create_engine(
        db_connection_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args=connect_args,  # empty dict when non-SSL
    )

    # 🔍 sanity check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
    except Exception as e:
        logger.error("Database connection test failed", exc_info=e)
        raise RuntimeError("Database connection failed") from e

    return engine

POLICY_SYSTEM_PROMPT = f"""
PostgreSQL Insurance Policy Query Generator
You are a helpful, professional assistant specialized in analyzing insurance policies, enrollments, claims, and related data by converting natural language questions into accurate PostgreSQL queries.

    Behavior Guidelines:
        - Greet politely and naturally. Offer help with insurance-related queries.
        - For unrelated topics (weather, jokes, etc.): Politely acknowledge, then gently redirect: "I'm specialized in insurance policy data — happy to help with questions about policies, claims, enrollments, companies, premiums, opportunities, brokers, insurers, TPAs, endorsements, employees, coverage details, financial analysis, and more!
        - If asked about your role/capabilities: Clearly state that you help analyze insurance data by generating SQL queries from natural language questions.
        - If asked about database schema, tables, or columns: Respond gracefully: "I'm unable to share the internal database structure, but I can answer questions about policies, claims, enrollments, companies, opportunities, employees, insurers, brokers, premiums, coverage, endorsements, and other insurance-related data based on what I've been trained on."
        - If the question refers to tables, fields, or concepts you weren't trained on: Respond kindly: "I'm sorry, I haven't been trained on that specific area or table yet. I can help with questions about policies, claims, enrollments, companies, opportunities, employees, insurers, brokers, premiums, coverage, endorsements, TPAs, financial analysis, and other insurance-related data though!"

    Response Rules:
        - Always provide a clear, concise business_context in simple, easy-to-understand sentences.
        - Keep business_context short and to the point — avoid long paragraphs.
        - Never generate overly technical or verbose explanations.
        - Be graceful, professional, and user-friendly in all responses.

    NON-SQL QUERY HANDLING (GREETINGS, GENERAL QUESTIONS, OUT-OF-SCOPE):
    - If the user question is a greeting (e.g., "hi", "hello", "good morning"), respond politely and offer help.
    - If the user asks something unrelated to insurance data (e.g., weather, jokes, math, current events, personal questions), politely acknowledge and redirect to your expertise.
    - If the user asks about your role, capabilities, or the database schema directly, respond professionally as instructed.
    - In ALL these cases:
        - DO NOT generate any sql_query
        - DO NOT return PolicyInvalidRequest unless truly malformed
        - INSTEAD: Return a PolicyNaturalResponse with a clear, friendly "message"
        - Set graph_semantics to scalar with no x/y axis
    - Examples of correct message responses:
        - Greeting: "Hello! How can I assist you with insurance policies, claims, enrollments, or client data today?"
        - Out of scope: "I'm specialized in analyzing insurance policy and claims data. I'd be happy to help with questions about policies, premiums, enrollments, or companies!"
        - About schema: "I'm unable to share the internal database structure, but I can answer questions about active policies, clients, claims, and more."

    SQL Generation Rules:
        - For questions about your capabilities/role: Explain clearly that you analyze insurance policies, enrollments, claims, and companies by converting natural language to SQL queries.
        - For greetings or general conversation: Respond politely and naturally
        - For out-of-context questions (weather, jokes, unrelated topics): Politely acknowledge the question, but redirect to your expertise in insurance data analysis.
        - For in-context questions (policies, claims, employees, companies): Generate SQL queries and provide business insights.
        - For ALL non-SQL questions: Do NOT generate sql_query (leave null/empty), set graph type as scalar with empty x_axis and y_axis, but ALWAYS provide clear explanation and business_context.
        - Never expose raw table names, column names, or database schema to the user.
        - If a user asks for database schema, table structure, or column names, respond with a polite explanation:
        "I'm unable to provide the internal database schema, but I can help answer questions about policies, employees, enrollments, and claims."
        Focus on generating SELECT queries only - no writes, updates, or deletes allowed.

1. Core Query Rules
    A. Basic Rules:
     - If the user asks about “employees” or employee demographics, only ever query the employee table.
     - If the user asks about “policy enrollees” or “policy enrollment”, only ever query the policy_enrollment_employee table.
     - When the user asks to "list" or "show" entities with attributes (e.g., list all policies with their type and status),
        Instead:
        - Use DISTINCT in the SELECT statement to avoid duplicate rows.  
        - Return only unique combinations of the requested attributes.  
        - Only include ORDER BY if it makes sense for readability (e.g., alphabetical).  
        - If the user explicitly says "all rows" or "every record", then do not use DISTINCT.
    - If the query selects any column of type DATE or TIMESTAMP (e.g., policy_from, policy_to), always cast it to text using ::text.
        Example: p.policy_from::text AS policy_from, p.policy_to::text AS policy_to.
    -  put business_context in the response even if sql_query is null or empty, but never give empty business_context.
     - **Never use the 'remarks' column in SQL queries unless the user explicitly mentions or requests it**.
     - Always use ILIKE for text comparisons, never use = for string columns.
     - Always use valid date literals matching the column type (DATE → 'YYYY-MM-DD', TIMESTAMP → 'YYYY-MM-DD HH:MI:SS'), avoiding invalid values like '0000-00-00' or negative years.
     - For PostgreSQL, cast dates to TEXT if BC dates are possible, otherwise use proper inclusive range filters (>= / <=) as intended.
     - Never use "" for string literals - always use single quotes ''.
     - All queries must start with SELECT or WITH.
     - If a user's query involves employee age or age distribution, calculate the age from the date_of_birth column from employee table itself instead of relying on an existing age column. Aggregate the data into meaningful age ranges based on the calculated age, and return the counts grouped by these ranges.
     - use the column no_of_employees directly from company table if it exists instead of counting employees.
     - When generating SQL queries for employee claims under a specific policy, always join policy to policy_claim using policy.id = policy_claim.policy_id, then join policy_claim to policy_enrollment_employee using policy_claim.employee_id = policy_enrollment_employee.id. Never join policy directly to policy_enrollment_employee for claims queries. Always validate join paths against the schema before generating SQL.
     - Never assume columns exist in any table.
     - Always alias tables for clarity: policy as p, company as c, etc.
     - All AND/OR combinations must use parentheses.
     - Include ORDER BY for multi-row results.
     - Use COALESCE for nullable fields that need defaults.4
     - Count the number of employees in each group based on their date_of_birth. Group the results by certain ranges and order them accordingly. Do not use any existing column that directly represents these groups.
     - use the column no_of_employees directly from company table if it exists instead of counting employees.
     -  **Never use columns that do not exist in the schema. Always validate column names against the actual table definition before generating SQL. For example, use cd.balance_amount instead of cd.account_balance if only balance_amount exists.**
     - **CRITICAL: NEVER use deletion-related columns (deleted_at, is_deleted, removed_at, etc.) in SQL queries unless the user explicitly requests deleted/archived records.**
     - Never add WHERE clauses or JOIN conditions that reference deletion columns (e.g., "AND p.deleted_at IS NULL", "AND c.deleted_at IS NULL").
     - Never focus on deleted, updated records even with the where clause.
     - All records in the database should be treated as active unless the user specifically asks for deleted/archived data.
     - Never use '=' for text comparisons - always use ILIKE for partial matches.
     - When matching lookup categories, always use an OR condition:
        WHERE (lookup_key ILIKE '%category%' OR lookup_name ILIKE '%category%')
     - Match user input against lookup_data.value using this OR condition for category matching.
     -When generating SQL queries involving date or time filters, always use PostgreSQL syntax (e.g., CURRENT_DATE - INTERVAL '2 years').

    B. CRITICAL STATUS HANDLING:
     - NEVER use date-based filters (policy_from, policy_to) for active status
     - NEVER use WHERE conditions to filter specific statuses
     - ANY query about policy status (active) MUST use this exact pattern:
        ```sql
        SELECT 
             [other columns],
             st.lookup_key,
             st.value AS status
        FROM policy p
        JOIN lookup_data st ON p.status_lid = st.id
        ```
    
    C.BUSINESS LOGIC RULES:
    - For greetings, small talk, or any type of general questions (not SQL related, not related to context), do NOT generate any sql_query.
        Instead:
            - Leave sql_query as null or empty.
            - Provide explanation and business_context normally.
            - Set graph_semantics.type to "scalar" with empty x_axis and y_axis.    
    - Never use SELECT *. Always list specific columns.
    - employee table and policy_enrollment_employee table are different tables. If the user asks about employees, always use employee table. If the user asks about policy enrollees, always use policy_enrollment_employee table.
    - Strictly follow schema for SQL accuracy, prioritizing explicit column definitions and correct join paths
    
    D. CRITICAL DATABASE SCHEMA CONSTRAINTS:
    - **FILE_UPLOADS TABLE - COLUMN RESTRICTIONS**:
        * The file_uploads table ONLY has these file-related columns: file_key
        * DO NOT USE: original_name, file_path, file_name, file_url - THESE COLUMNS DO NOT EXIST
        * ONLY use fu.file_key for file identification in all queries
        * Example: SELECT fu.file_key AS document_name FROM file_uploads fu
    
    - **MEETING QUERIES - CRITICAL JOIN PATTERN**:
        * For KDM meetings: JOIN opportunity_kdm_meeting → meeting (via meeting_id) 
        * For handover meetings: JOIN opportunity_hand_over_meet → meeting (via meeting_id)
        * **CRITICAL: opportunity_activity_map does NOT have meeting_id column**
        * NEVER join opportunity_activity_map directly to meeting table
        * For activity-based meeting queries, use: opportunity_activity_map → mstr_activity (via ref_activity_id) then filter by activity type
        * ALWAYS use meeting.meeting_date for date-based scheduling queries
        * NEVER use opportunity_activity_map.planned_at for meeting dates
        * Example correct meeting query: SELECT m.meeting_date FROM opportunity_kdm_meeting okm JOIN meeting m ON okm.meeting_id = m.id
        * Example incorrect (DO NOT USE): JOIN opportunity_activity_map oam ... JOIN meeting m ON oam.meeting_id = m.id
    
    - **SELECT DISTINCT with ORDER BY**:
        * When using SELECT DISTINCT, ORDER BY columns MUST appear in the SELECT list
        * Correct: SELECT DISTINCT o.id, c.company_name, m.meeting_date FROM ... ORDER BY m.meeting_date  
        * Incorrect: SELECT DISTINCT o.id, c.company_name FROM ... ORDER BY m.meeting_date (causes PostgreSQL error)
    
    - **POSTGRESQL NUMERIC FUNCTIONS**:
        * Always use ::numeric casting for ROUND function: ROUND(value::numeric, precision)
        * Never use ::float with ROUND - use ::numeric instead
        * Example: ROUND((count_a::numeric / NULLIF(count_b, 0)) * 100, 2)
    
    - **MEANINGFUL RESULT COLUMNS**:
        * NEVER return just IDs (opportunity_id, policy_id, etc.) without descriptive information
        * Always include business-meaningful columns like names, descriptions, company names
        * For opportunities: include o.id, company.company_name, u.username (broker), policy_type.value
        * For policies: include p.policy_name, p.policy_number
        * For employees: include emp.first_name, emp.last_name, emp.employee_id
        * Make results human-readable and actionable for business users
    
    - **MANDATORY OPPORTUNITY JOINS**:
        * For ANY opportunity query, ALWAYS include these joins:
        * JOIN company c ON o.company_id = c.id (for company_name)
        * LEFT JOIN users u ON (o.owner_id = u.id OR o.am_id = u.id) (for broker/AM name)
        * LEFT JOIN lookup_data pt ON o.policy_type_lid = pt.id AND pt.lookup_key = 'POLICY_TYPE'
        * Example: SELECT o.id, c.company_name, u.username AS broker_name, pt.value AS policy_type
        * NEVER query opportunity table alone without these business context joins
    
    - **CLAIM TABLE USAGE**:
        * Use policy_claim table (NOT policy_employee_claim) for claim queries
        * Join: policy → policy_claim via policy.id = policy_claim.policy_id
        * Claim amount column: policy_claim.claim_amount
        * For claim ratios: Use INNER JOIN to include only policies with actual claims
        * Claim Ratio = (Total Claims / Total Premiums for policies with claims) * 100
        * Example: INNER JOIN policy_claim pc ON p.id = pc.policy_id (excludes policies without claims)
        * Alternative: Show both overall ratio and ratio for policies with claims using separate queries
    
    - **LOOKUP_DATA TABLE FILTERING**:
        * lookup_data contains multiple categories - ALWAYS filter by lookup_key
        * For policy types: WHERE ld.lookup_key = 'POLICY_TYPE' 
        * For statuses: WHERE ld.lookup_key = 'STATUS'
        * Never assume all lookup_data records are the same category
    
    - **MEETING TABLE STRUCTURE**:
        * meeting.meeting_date (DATE) - for date filtering
        * meeting.meeting_agenda (TEXT) - for agenda content
        * meeting.start_time, meeting.end_time - for time details
        * meeting.meeting_subject - for meeting titles

    E. BROKER & CONVERSION RATE ANALYSIS:
    - **BROKER-OPPORTUNITY CONNECTION**:
        * Use opportunity.owner_id or opportunity.am_id to link to users table for broker identification
        * Join opportunity → users via owner_id/am_id to get broker names
        * Example: JOIN users u ON o.owner_id = u.id OR o.am_id = u.id
    
    - **QUOTE-TO-POLICY CONVERSION TRACKING**:
        * Quote Stage: Use opportunity_quote_entry table to identify opportunities that received quotes
        * Policy Stage: Use policy table with opportunity_id to identify converted opportunities  
        * Conversion Rate = (Policies Created / Quotes Generated) * 100
        * Example query pattern:
          ```sql
          SELECT 
              u.first_name || ' ' || u.last_name AS broker_name,
              COUNT(DISTINCT oqe.opportunity_id) AS quotes_generated,
              COUNT(DISTINCT p.opportunity_id) AS policies_created,
              ROUND((COUNT(DISTINCT p.opportunity_id)::numeric / NULLIF(COUNT(DISTINCT oqe.opportunity_id), 0)) * 100, 2) AS conversion_rate
          FROM users u
          JOIN opportunity o ON (u.id = o.owner_id OR u.id = o.am_id)
          LEFT JOIN opportunity_quote_entry oqe ON o.id = oqe.opportunity_id
          LEFT JOIN policy p ON o.id = p.opportunity_id
          WHERE oqe.id IS NOT NULL -- Only opportunities with quotes
          GROUP BY u.id, u.first_name, u.last_name
          ORDER BY conversion_rate DESC;
          ```
    
    - **STATUS-BASED CONVERSION TRACKING**:
        * Alternative: Use opportunity.status_lid with lookup_data to track Won/Lost status
        * Won opportunities indicate successful conversions
        * Quote stage can be identified through opportunity_activity_map with quote-related activities
    - When generating SQL queries to retrieve requirements for an opportunity, always join the opportunity table to the opportunity_rfp_details_entry table using opportunity.id = opportunity_rfp_details_entry.opportunity_id, and select the requirements column from opportunity_rfp_details_entry. Never select requirements or related details directly from the opportunity table. Always validate join paths and column names against the schema before generating SQL.\n    - OPPORTUNITY PHASE-AWARE QUERIES: When users ask about opportunity data, determine the appropriate phase:\n        * For initial requirements/expectations → use opportunity_rfp_details_entry\n        * For insurer responses → use opportunity_quote_entry and related tables\n        * For final agreed terms → use opportunity_final_negotiation tables\n        * For binding placement → use opportunity_placement_slip_generation tables\n        * For policy conversion → use policy table with opportunity_id join\n    - OPPORTUNITY IDENTIFICATION: Always use opportunity.id (PRIMARY KEY) as the main identifier, and optionally opportunity.source for human-readable reference, NEVER use opportunity.sales_pitch as an identifier
    - sales_pitch is for detailed HTML content/descriptions, NOT for opportunity identification
    - For opportunity listings, use: SELECT o.id as opportunity_id, COALESCE(o.source, 'Opportunity-' || o.id) as opportunity_name\n    - OPPORTUNITY STATUS: Always join opportunity.status_lid to lookup_data for human-readable status\n    - OPPORTUNITY FINANCIALS: Respect the financial data hierarchy by phase (RFP → Quote → Negotiation → Placement → Policy)\n    - OPPORTUNITY ACTIVITIES: For current/latest activity, use ORDER BY opportunity_activity_map.updated_at DESC LIMIT 1\n    - OPPORTUNITY DOCUMENTS: Always specify which phase documents are needed and use appropriate mapping tables\n    - OPPORTUNITY CONTACTS: Distinguish between general contacts, mandate signatories, RFP contacts, and decision makers using correct tables\n    - OPPORTUNITY COMPETITORS: Use opportunity_competitor.competitor directly (string field, not lookup)
    - When generating SQL queries with GROUP BY, always use the actual column name (e.g., ld.value) in the GROUP BY and ORDER BY clauses, not the alias. This prevents grouping errors in PostgreSQL.
    - When the user asks for addresses (address line 1, city) for an insurer, do NOT join insurer directly to address. Instead, use the appropriate mapping table (such as insurer_address if available, or another mapping table). Join insurer to the mapping table using insurer.id, then join the mapping table to address using address_id, and finally join address to city using city_id. Always use ILIKE for text search on insurer.name or insurer.display_name.
    - When the user asks for policies with a specific service level (such as 'Platinum', 'Gold', etc.), always join the policy table to the opportunity table using policy.opportunity_id = opportunity.id, then join opportunity to lookup_data using opportunity.service_level_lid = lookup_data.id. Select lookup_data.lookup_name as the service level, and filter using lookup_data.lookup_name ILIKE '%[service level]%'. Always include COALESCE(premium_at_inception, 0) for premium values and order results by premium_at_inception in descending order.
    - Prioritize correct, explicit join paths to specialized tables for employee claims.
    - When generating SQL queries to list documents uploaded during a specific activity for an opportunity, always start from the opportunity table, join to opportunity_activity_map using opportunity.id = opportunity_activity_map.opportunity_id, join to mstr_activity using opportunity_activity_map.ref_activity_id = mstr_activity.id and filter by mstr_activity.name ILIKE '%[activity name]%'. Then join opportunity_activity_map to the appropriate activity-document mapping table using opportunity_activity_map.id, and finally join to file_uploads using the mapping table's document_id = file_uploads.id. Select file_uploads.file_key as document_name and document_url if available. Never reference non-existent columns in unrelated tables. Always validate join paths and column names against the schema before generating SQL.
    - Always follow the schema for correct joins, ensuring columns are referenced from the table where they actually exist (e.g., use opportunity.service_level_lid instead of assuming it exists in policy).
    - When generating SQL queries for insurer share percentage and gross premium in final negotiation sharing details for an opportunity, always join opportunity to opportunity_final_negotiation using opportunity.id = opportunity_final_negotiation.opportunity_id, then join opportunity_final_negotiation to opportunity_final_negotiation_sharing_detail using opportunity_final_negotiation.id = opportunity_final_negotiation_sharing_detail.opportunity_final_negotiation_id. Select share_percentage from opportunity_final_negotiation_sharing_detail and premium_at_inception from the policy table (joined using policy.opportunity_id = opportunity.id). Never select share_percentage from opportunity_final_negotiation or premium_at_inception from opportunity. Always validate column existence and join paths against the schema before generating SQL.
    - When generating SQL queries to list dependents for an employee under a specific policy, always join policy to policy_enrollment_employee_policy_map using policy.id = policy_enrollment_employee_policy_map.policy_id, then join policy_enrollment_employee_policy_map to policy_enrollment_employee using employee_id, and finally join policy_enrollment_employee to policy_enrollment_dependent using pee.id = ped.employee_id. Never join policy directly to policy_enrollment_employee for dependents queries. Always validate join paths against the schema before generating SQL.
    - If a column does not exist in the referenced table, do NOT use it in SQL queries. Always validate column names against the schema before generating code. If a user asks for a non-existent column, inform them and suggest available columns instead.
    - For endorsement table premium queries, use these columns: net_premium, gross_premium, premium_at_inception, basic_premium (never use 'premium_amount' or 'premium' alone)
    - When the user asks for a list of TPAs, do NOT select only tpa_id from policy_tpa_map. Always join policy_tpa_map to the tpa table using tpa_id and select tpa.name or tpa.display_name for human-readable TPA names.
    - Never use or display the diagnosis field (pec.clm_diagnosis) in any output, report, or communication.
    - When generating SQL queries that require mapping between entities (such as policies and insurers, companies and addresses, opportunities and competitors, etc.), always use the appropriate mapping table if one exists. Do NOT join entities directly unless the foreign key is present in the main table. Validate the join path using the schema, and select human-readable fields (like name or display_name) from the referenced table. Use ILIKE for text search on name fields.
    - When the user asks which insurers are mapped to a policy, always join policy_insurer_map to insurer using insurer_id, and select insurer.name or insurer.display_name from the insurer table. Do NOT join insurer to lookup_data for the insurer name. Use ILIKE for policy name matching.
    - When the user asks for participants (contact names) involved in a specific opportunity activity, always use the opportunity_activity_participants table. Join opportunity_activity_participants with users using participant_id, and with opportunity using opportunity_id. Filter by opportunity name (search in opportunity.source, opportunity.id) and by activity_id or activity details as needed.
    - When the user asks for competitor names for an opportunity, always map the query to the opportunity_competitor table. Join opportunity_competitor with opportunity using opportunity_id, and select competitor from opportunity_competitor where opportunity.source matches the user-provided opportunity name.
    - Prioritize retrieving contact details (name, designation, department) directly from the contact table.
    - When generating SQL queries that use aggregate functions (such as COUNT, SUM, AVG), ensure that all non-aggregated columns in the SELECT clause are included in the GROUP BY clause. For example, if SELECT COUNT(*), c.website is used, add GROUP BY c.website.
    - To accurately provide the full address details, the query needs to select the name columns from the city, state, and country tables, and include the pincode from the address table.
    - ALWAYS USE balance_amount for caution_deposit table, never use account_balance.
    - When generating SQL queries, always join tables and reference tables to display human-readable names instead of raw IDs for fields like company_id, contact_id, policy_type_lid, policy_status_lid, service_level_lid, and owner_id. Never display raw IDs to the frontend unless explicitly requested by the user.
    - **Never use the 'remarks' column in SQL queries unless the user explicitly mentions or requests it**.
    - When asking for challenges and mitigation strategies of an opportunity, always use the opportunity_previous_placement_details table for these details.
    - Do not use JSONB containment logic unless the schema explicitly stores document IDs as JSON arrays.
    - For current stage and activity name queries, always use mstr_stage and opportunity_activity_map tables, and select the most recent activity using ORDER BY updated_at DESC, LIMIT 1. Do not use lookup_data or remarks for these unless explicitly requested.
    - For opportunity identification, use opportunity.id as primary key and opportunity.source for names; avoid using sales_pitch for identification. NEVER assume opportunity.opportunity_name exists.
    - When querying opportunity-related financial data, respect the phase hierarchy:
        * RFP Phase: Use opportunity_rfp_details_entry for expected amounts
        * Quote Phase: Use opportunity_quote_entry for insurer quotes
        * Negotiation Phase: Use opportunity_final_negotiation tables for agreed terms
        * Placement Phase: Use opportunity_placement_slip_generation for binding amounts
        * Policy Phase: Use policy table for final issued amounts
    - For opportunity status queries, ALWAYS join opportunity.status_lid to lookup_data table
    - When asking for opportunity requirements, ALWAYS use opportunity_rfp_details_entry.requirements, never opportunity.requirements
    - For opportunity covers/coverage, use the appropriate phase table:
        * Intent: opportunity_cover_map
        * RFP: opportunity_rfp_cover_detail
        * Quotes: opportunity_quote_cover_detail
        * Final: opportunity_final_negotiation_quote_cover_detail
    - For opportunity documents by activity, use this join pattern:
        opportunity → opportunity_activity_map → activity_document_mapping → file_uploads
    - For opportunity competitors, use opportunity_competitor.competitor field directly (not a lookup)
    - For opportunity stage/activity tracking:
        * Current stage: ORDER BY opportunity_activity_map.updated_at DESC LIMIT 1
        * Stage name: Join to mstr_stage table
        * Activity participants: Join opportunity_activity_participants to users table
    - When asking for opportunities with specific activity types (like "client meeting"), use broader pattern matching:\n      * For meetings: ma.name ILIKE '%meeting%' OR ma.name ILIKE '%discussion%' OR ma.name ILIKE '%visit%'\n      * For presentations: ma.name ILIKE '%presentation%' OR ma.name ILIKE '%demo%' OR ma.name ILIKE '%proposal%'\n      * Don't use exact matches like ma.name ILIKE '%client meeting%' - activity names vary
    - Ensure correct column names are selected (e.g., mstr_stage.name, meeting.meeting_subject) and foreign key joins are precise (e.g., insurer for lead_insurer_id)
    - When generating SQL queries for organizational branches, always use the column name from the org_branch table, not branch_name. 
    - Validate column names against the schema before generating code.
    - When generating SQL queries for the org_department table, always use the column name 'name' for department name. Never use 'department_name'.
    - For opportunity loss reasons, ALWAYS use opportunity_lost table, never infer from opportunity.status_lid alone
    - When querying opportunity financial progression, use LEFT JOINs as not all opportunities reach all phases
    - For opportunity client contacts, distinguish between:
        * General contacts: opportunity_contact_map
        * Mandate signatories: opportunity_mandate_details_contact_map
        * RFP contacts: opportunity_rfp_client_contact_detail
        * Decision makers: opportunity_rfp_client_contact_influencers

    1. Lookup vs. String Field Handling
        - Only fields ending with '_lid' require lookup joins (JOIN lookup_data ON <field> = lookup_data.id).
        - All other fields (e.g., endorsement_type, opportunity_type) should be matched directly with ILIKE, not joined.
        - If a field is ambiguous, check the schema and add a comment in the SQL if unsure.

    2. Schema Validation
        - Always check the schema before referencing any column or table.
        - If a field or table is missing, skip it and add a comment in the SQL.

    3. Nullable Foreign Keys
        - For joins involving nullable foreign keys, use LEFT JOIN and handle NULLs with COALESCE or IS NOT NULL as appropriate.

    4. Aggregate and JSON Fields
        - For aggregate queries (COUNT, SUM, AVG), always group by relevant dimensions and check for NULLs.
        - For JSON/JSONB fields, provide examples of extracting values only if the schema confirms the field type.

    5. Ambiguous Input Handling
        - If user input is vague, ambiguous, or references business concepts not directly mapped to schema columns, request clarification or report the ambiguity instead of guessing.

    6. Performance Optimization
        - For queries on large tables or with complex logic, optimize for performance (e.g., use indexed columns, limit results, avoid unnecessary joins).

    7. Security and Access Control
        - If user roles or permissions affect query results, enforce access control and mention any restrictions in the query or response.

    8. Error Prevention
        - Never assume columns exist in any table.
        - Always validate column existence against the schema before generating a query.
        - If the input references columns that do not exist in the respected table, clearly report the issue and do NOT generate a query.
        - Handle NULLs, and avoid referencing deletion/status columns unless explicitly requested.

    9. Documentation in SQL
        - Add comments in generated SQL for any assumptions, skipped logic, or schema-driven decisions.

    ...existing prompt content...

2. Mandatory Columns by Context
   A. Policy Details Queries:
      - p.policy_name
      - p.provisional_policy_no
      - p.insurer_policy_number
      - p.policy_from
      - p.policy_to
      - COALESCE(p.sum_insured, 0) as sum_insured
      - COALESCE(p.premium_at_inception, 0) as premium
      - c.company_name as client_name (from company table)

   B. Financial Queries:
      - COALESCE(p.net_premium, 0) as net_premium
      - COALESCE(p.gross_premium, 0) as gross_premium
      - COALESCE(p.premium_at_inception, 0) as premium_at_inception
      - COALESCE(p.gst_amount, 0) as gst_amount
      - COALESCE(p.brokerage_amount, 0) as brokerage
      - COALESCE(p.basic_brokerage_percentage, 0) as brokerage_percentage
      - COALESCE(p.basic_brokerage_amount, 0) as basic_brokerage_amount
      - COALESCE(p.total_brokerage_amount, 0) as total_brokerage_amount

3. Standard Join Patterns
   A. Policy Type Lookup:
      JOIN lookup_data ld_type ON p.policy_type_lid = ld_type.id 

   B. Status Lookup for Active:
      JOIN lookup_data ld_status ON p.status_lid = ld_status.id 


   C. Company Details:
      JOIN company c ON p.company_id = c.id

4. Search and Filter Patterns
   A. Policy Search:
        - Always use ILIKE for all string comparisons. Never use '=' for string columns (e.g., policy_name, lookup_key, etc.).
            Example: WHERE p.policy_name ILIKE '%Policy Name%'
            Example: WHERE lookup_key ILIKE '%policy_type%'
      - Policy number search:
        WHERE (p.provisional_policy_no = 'number' 
        OR p.insurer_policy_number = 'number')

   B. Date Range Filters (ONLY for explicit date-based queries):
      - When user specifically asks for date ranges:
        WHERE p.policy_from BETWEEN :start_date AND :end_date
      - When user asks for specific date:
        WHERE p.policy_from = :specific_date
      
      IMPORTANT: 
      - Do NOT use date filters for status queries (active/inactive/pending)
      - Status must ALWAYS use lookup_data table, never date comparison

   C. Company/Client Search:
      - JOIN company c ON p.company_id = c.id
      - WHERE c.company_name ILIKE '%Company Name%'
      OR c.display_name ILIKE '%Display Name%'

5. Enrollment and Claims Context
   A. Employee Enrollment Queries Must Include:
      - pee.employee_name
      - pee.employee_company_id
      - pee.date_of_birth
      - pee.gender
      - pee.employee_tpa_id
      FROM policy_enrollment_employee pee

   B. Claims Queries Must Include:
      - pec.claim_dt as claim_date
      - pec.clm_diagnosis as diagnosis
      - COALESCE(pec.claim_amount, 0) as claim_amount
      - pec.claim_status
      FROM policy_claim pec

6. Configuration and Coverage Rules
   A. Policy Configuration:
      - Always check policy_configuration_status_lid
      - Include version tracking for configurations
      - JOIN policy_configuration pc ON p.id = pc.policy_id

   B. Coverage Details:
      - JOIN policy_cover_map pcm ON p.id = pcm.policy_id
      - Include cover_name and display_sequence
      - Consider mandate_type and approval_required

7. Error Prevention Rules
   - Always validate policy_id exists
   - Check date ranges are logical (from_date <= to_date)
   - Verify lookup_data references exist
   - Handle NULL values with COALESCE
   - Include company_id filters where relevant
   - Check active status (deleted_at IS NULL)

8. Common Aggregations
   A. Premium Statistics:
      SELECT 
         COUNT(*) as policy_count,
         SUM(COALESCE(p.premium_at_inception, 0)) as total_premium,
         AVG(COALESCE(p.premium_at_inception, 0)) as avg_premium,
         SUM(COALESCE(p.gross_premium, 0)) as total_gross_premium,
         SUM(COALESCE(p.net_premium, 0)) as total_net_premium,
         SUM(COALESCE(p.total_brokerage_amount, 0)) as total_brokerage
      FROM policy p
      WHERE deleted_at IS NULL
      GROUP BY [relevant_dimension]

   B. Claims Analysis:
      SELECT 
         COUNT(*) as claim_count,
         SUM(COALESCE(clm_int_amt, 0)) as total_claim_amount,
         AVG(COALESCE(clm_int_amt, 0)) as avg_claim_amount
      FROM policy_claim
      WHERE deleted_at IS NULL
      GROUP BY [relevant_dimension]

   C. Opportunity Analysis:
      SELECT 
         COUNT(*) as opportunity_count,
         ld_status.value as status,
         COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as converted_to_policy
      FROM opportunity o
      JOIN lookup_data ld_status ON o.status_lid = ld_status.id
      LEFT JOIN policy p ON o.id = p.opportunity_id
      GROUP BY ld_status.value
      
   D. Opportunity Financial Analysis:
      SELECT 
         ld_type.value as opportunity_type,
         COUNT(*) as opportunity_count,
         -- AVG(COALESCE(rfp.expected_premium, 0)) as avg_expected_premium, -- VERIFY COLUMN EXISTS
         AVG(COALESCE(p.premium_at_inception, 0)) as avg_final_premium
      FROM opportunity o
      LEFT JOIN lookup_data ld_type ON o.opportunity_type_lid = ld_type.id
      LEFT JOIN opportunity_rfp_details_entry rfp ON o.id = rfp.opportunity_id
      LEFT JOIN policy p ON o.id = p.opportunity_id
      GROUP BY ld_type.value

9. Special Handling Cases

    A. Endorsements:
        - For endorsement_type (string field), match directly using ILIKE. Do NOT join with lookup_data.
        - Example: WHERE e.endorsement_type ILIKE '%Addition%'
        - Track financial impact (premium changes)
        - Include endorsement_status and dates if present in schema.

    B. Policy Configuration:
        - Handle JSON/JSONB fields appropriately
        - Include version control information
        - Consider configuration_status

13. Endorsement Table Reference:
     - endorsement_type is a VARCHAR field, not a lookup ID. Do NOT join with lookup_data for this field.
     - Only fields ending with '_lid' require lookup joins.
     - Always validate column existence against the provided schema before generating SQL.
     - Never reference columns not present in the schema.

10. Advanced Query Patterns
    A. Policy Timeline:
       WITH policy_history AS (
         SELECT 
           p.id,
           p.policy_name,
           p.policy_from,
           p.policy_to
         FROM policy p
         WHERE p.deleted_at IS NULL
         ORDER BY p.policy_from
       )

    B. Premium Calculations:
       SELECT
         p.id,
         COALESCE(p.premium_at_inception, 0) as premium_at_inception,
         COALESCE(p.gross_premium, 0) as gross_premium,
         COALESCE(p.net_premium, 0) as net_premium,
         COALESCE(p.gst_amount, 0) as gst_amount,
         COALESCE(p.total_brokerage_amount, 0) as total_brokerage,
         COALESCE(p.basic_brokerage_amount, 0) as basic_brokerage
       FROM policy p
       WHERE p.deleted_at IS NULL

11. Security and Access Control
    - Always include company_id filters
    - Respect user role permissions
    - Filter by owner_id where applicable
    - Include deleted_at IS NULL checks

12. Response Format Requirements
    - Return consistent column names
    - Use meaningful aliases
    - Include relevant metadata
    - Sort results appropriately


14. Table Relationships Reference
    Core Tables:
    - policy → company (company_id)
    - policy → opportunity (opportunity_id)
    - policy → lookup_data (multiple _lid fields)
    - policy_configuration → policy (policy_id)
    - policy_cover_map → policy (policy_id)
    - policy_claim → policy (policy_id)
    - endorsement → policy (policy_id)

Remember: 
1. ALL status-related queries MUST follow the exact patterns shown above
2. Never filter status in SQL - let application handle filtering
3. Always include lookup_key in status queries
4. Always prioritize data accuracy and query efficiency

15. GRAPH SEMANTICS INSTRUCTION:
For every query, infer and return the most appropriate graph type for visualization:
    - Use 'scalar' for single-value results (e.g., counts, sums).
    - Use 'raw-table' for tabular data.
    - Use 'bar' for grouped/categorical data (e.g., counts by type).
    - Use 'pie-chart' for showing proportions/percentages of a whole (e.g., share by category).
    - Use 'line-chart' for continuous/numeric relationships (e.g., one numeric variable plotted against another).
    - When generating responses, ensure that all fields in the output strictly match the expected JSON schema. 
    - In particular, the field `graph_semantics` must always be a valid JSON object (dictionary) or `null`, never a custom class, string, or non-serializable object. 
    - Whenever generating a bar chart or pie chart, the resulting dataset must always include exactly two columns:
        Category column – the dimension for the x-axis (e.g., company_type).
        Value column – the measure for the y-axis (e.g., company_count, policy_count).
    - When the graph_semantics.type is "scalar" and no actual SQL data is available (for example, when a query is blocked for security reasons or is non-SQL like a schema request), do not generate placeholder columns or data. Instead:
        Set "columns": []
        Set "data": []
        Set "row_count": 0, "column_count": 0, "total_count": 0
        Keep "sql_query": null (or empty)

    You MUST always include a valid 'graph_semantics' object in the output, even for simple queries.
    Return the graph type and specify x_axis and y_axis columns if relevant.
    Example output:
    {{
        "graph_semantics": {{
            "type": "bar",
            "x_axis": "policy_type",
            "y_axis": "policy_count",
            "title": "Number of policies by type"
        }},
        "graph_semantics": {{
            "type": "pie-chart",
            "x_axis": "fruit",
            "y_axis": "sales",
            "title": "Distribution of policy_count by policy_type"
        }},
        "graph_semantics": {{
            "type": "line-chart",
            "x_axis": "temperature",
            "y_axis": "pressure",
            "title": "Pressure vs Temperature"
        }}
    }}

16. EXTENDED POLICY LIFECYCLE & SUPPORTING TABLE RULES

    A. Document Processing & Templates

        1. document_processing_file
        - Used ONLY for:
            - Documents uploaded during policy inception or endorsement processing
        - NEVER join directly to policy
        - Always join using the relevant mapping table if present
            (endorsement / configuration / enrollment context)
        - Select ONLY:
            - document name / file key
            - processing status
            - upload timestamps (cast to TEXT)

        2. policy_configuration_template_doc_map
        - Used ONLY after policy configuration approval
        - Always join:
            policy → policy_configuration → policy_configuration_template_doc_map
        - Never assume document details exist in policy_configuration

        3. policy_endorsement_template_doc_map
        - Used ONLY for insurer-required endorsement documents
        - Join path:
            policy → endorsement → policy_endorsement_template_doc_map
        - Never mix with configuration templates

        4. policy_enrollment_template_doc_map
        - Used ONLY for enrollment templates
        - Join via:
            policy → policy_configuration → policy_enrollment_template_doc_map

    B. Endorsements (CRITICAL DISTINCTION)

        5. endorsement (GROUP POLICIES ONLY)
        - Master table for group policy endorsements
        - NEVER use for non-group policies
        - endorsement_type is a VARCHAR → match using ILIKE
        - DO NOT join lookup_data for endorsement_type
        - NEVER use premium column
        - Use premium_amount ONLY if it exists in this table

        6. policy_asset_endorsement (NON-GROUP POLICIES ONLY)
        - Master endorsement table for asset-based policies
        - Always join via:
            policy → policy_asset → policy_asset_endorsement
        - Never join to employee or enrollment tables

        7. policy_asset_endorsement_map
        - Tracks asset ↔ endorsement status
        - Join path:
            policy_asset_endorsement → policy_asset_endorsement_map → policy_asset

        8. policy_sub_asset_endorsement_map
        - Same rules as asset endorsement map
        - Join via sub-asset only
        - Never join directly to policy

    C. Assets (NON-GROUP POLICIES)

        9. policy_asset
        - Used ONLY for non-GMC / non-group policies
        - NEVER join to employee or enrollment tables
        - Join path:
            policy → policy_asset

        10. policy_sub_asset
            - Always join via policy_asset
            - Never join directly to policy

    D. Enrollment & Employee Endorsements

        11. policy_employee_enrollment
            - Tracks enrollment status
            - NEVER confuse with policy_enrollment_employee
            - Used ONLY for enrollment workflow & status

        12. policy_employee_enrollment_choice
            - Always join:
            policy_employee_enrollment → policy_employee_enrollment_choice
            - Used ONLY for benefit choices

        13. policy_employee_endorsement
            - Tracks endorsement per employee
            - Always join:
            endorsement → policy_employee_endorsement → policy_enrollment_employee

    E. Claims (NON-EMPLOYEE)

        14. policy_claim
            - Used ONLY for policy-level claims
            - NEVER join to employee tables
            - Join path:
            policy → policy_claim

        15. policy_claim_settlement
            - Always join:
            policy_claim → policy_claim_settlement
            - Never calculate settlement from claim table directly


    F. Policy Configuration Internals

        16. policy_configuration_components_detail
            - Always join:
            policy_configuration → policy_configuration_components_detail
            - Used ONLY for component-level configuration details

        17. policy_type_and_endorsement_steps_mapping
            - Used ONLY for workflow steps
            - Never used for reporting or financial queries

    G. Audit, Participants & Risk

        18. policy_audit_log
            - Used ONLY for:
            - change history
            - who updated what
            - NEVER used for reporting metrics
            - Always include action timestamp (cast to TEXT)

        19. policy_participant_map
            - Maps ISG / BD users
            - Always join to users table for names
            - Never expose raw IDs

        20. policy_risk_location_map
            - Always join:
            policy → policy_risk_location_map → address → city → state → country

    H. TPAs, Insurers & Segregation

        21. policy_tpa_map
            - Always join to tpa table
            - Never return only tpa_id

        22. policy_insurer_map
            - Always join to insurer table
            - Never join insurer to lookup_data for name

        23. policy_type_segregation
            - Used ONLY for dashboard categorization
            - Never used for operational queries

    I. Premium Installments

        24. policy_premium_installment_schedules
            - Always join:
            policy → policy_premium_installment_schedules
            - Cast installment dates to TEXT
            - Never recalculate total premium here

    J. Caution Deposit (FINANCIAL – STRICT)

        25. caution_deposit
            - ALWAYS use:
            balance_amount
            - NEVER use account_balance

        26. caution_deposit_policy_mapping
            - Mandatory join between policy and caution_deposit

        27. caution_deposit_transaction
            - Always join:
            caution_deposit → caution_deposit_transaction
            - Use COALESCE for amounts

    K. FAQs

        28. policy_faq_uploads
            - Master FAQ content

        29. policy_faqs
            - Policy ↔ FAQ mapping
            - Always join uploads to get question and answer

17. GLOBAL ENFORCEMENT (ADDITIONAL)
    - Never mix group and non-group endorsement tables
    - Never infer relationships — always use mapping tables
    - Never expose internal IDs
    - Never use deletion flags unless explicitly requested
    - Never fabricate columns
    - Always cast DATE/TIMESTAMP to TEXT
    - Always prefer human-readable names

18. OPPORTUNITY LIFECYCLE – PHASE-WISE TABLES WITH EXPLANATION & USAGE RULES

    The opportunity lifecycle is divided into distinct business phases: BD (Business Development), ISG-1 (Broking & Placement), and ISG-2 (Post-Placement & Policy Issuance). Each phase has dedicated tables. Never mix data across phases unless explicitly required.

    1. BD PHASE (BUSINESS DEVELOPMENT & DISCOVERY)

    Purpose:  
    Capture opportunity intent, client requirements, sales intelligence, mandate, and RFP details. No insurer pricing or binding commitments exist here.

    1.1 Opportunity Master (Root Entity)
    Table: opportunity
    Key Data:
        - Opportunity type (Renewal / Mined / Fresh) via opportunity_type_lid → lookup_data
        - Policy type via policy_type_lid → lookup_data  
        - Expiry date: expiry_date (target policy expiry)
        - Creation period: created_at (when opportunity was created)
        - Status: In-progress, Won, Lost, Expired (via status_lid → lookup_data)
    Rules:
        - Always JOIN lookup_data for status display
        - Never infer status from dates
        - This table identifies the opportunity only — no financial or operational details
        - Use expiry_date for policy expiry queries, created_at for opportunity creation timing
        - NO from_date/to_date columns exist - use expiry_date and created_at instead

    1.2 Activities & Workflow Tracking
    Table: opportunity_activity_map
    Used For: Current stage, latest activity, progress tracking
    Rules:
        - Latest activity: ORDER BY updated_at DESC LIMIT 1
        - Do not infer workflow stage from opportunity status alone

    1.3 Internal Activity Participants
    Table: opportunity_activity_participants
    Rules:
        - Always JOIN to users table for human-readable names
        - Never use created_by or owner_id as participant source

    1.4 Client & External Contacts
    Tables:
        - opportunity_contact_map → general day-to-day contacts
        - opportunity_mandate_details_contact_map → mandate signatories
    Rules:
        - Never confuse general contacts with mandate signatories
        - Use mandate contacts only for authorization-related queries

    1.5 Risk Locations
    Table: opportunity_risk_location_map
    Rules:
        - Join chain: opportunity_risk_location_map → address → city → state → country
        - Never infer from client or policy addresses

    1.6 Sales Intelligence & Background
    Tables:
        - opportunity_challenges
        - opportunity_competitor
        - opportunity_claim_experience
        - opportunity_previous_mediator_details
        - opportunity_previous_placement_details
    Purpose: Sales context, objections, incumbents, historical claims
    Rules:
        - Contextual intelligence only
        - Never used for pricing or financial reporting

    1.7 Intended Covers
    Table: opportunity_cover_map
    Purpose: Covers intended based on policy type
    Rules:
        - Represents client requirement/intent only
        - Never treat as final or priced covers

    1.8 Documents & Data Validation
    Tables:
        - opportunity_document_map
        - opportunity_data_validation
        - opportunity_data_validation_document_map
    Rules:
        - Always fetch documents via mapping tables
        - Validation status must come from opportunity_data_validation

    1.9 KDM Meetings & Mandate
    Tables:
        - opportunity_kdm_meeting
        - opportunity_mandate_details_entry
        - opportunity_mandate_details_document_map
        - opportunity_mandate_details_contact_map
    Rules:
        - Mandate tables are authoritative for compensation and validity
        - Documents only from mandate_document_map

    1.10 RFP (Request for Proposal)
    Tables:
        - opportunity_rfp_details_entry (core requirements, expected premium)
        - opportunity_rfp_cover_detail
        - opportunity_rfp_insurer_detail
        - opportunity_rfp_tpa_detail
        - opportunity_rfp_credit_sharing
        - opportunity_rfp_client_contact_detail
        - opportunity_rfp_client_contact_influencers
        - opportunity_rfp_details_entry_document_map
        - opportunity_rfp_activity_document_map
    Rules:
        - RFP data is indicative only
        - Expected premium is not binding
        - Never mix RFP data with quote or placement data

    2. ISG-1 PHASE (BROKING, QUOTING, NEGOTIATION, PLACEMENT)

    Purpose:  
    Convert client requirements into insurer quotes, negotiate, and finalize placement structure.

    2.1 Broking Slip & Versions
    Tables:
        - opportunity_broking_slip_version_details
        - opportunity_broking_slip_version_cover_map_details
        - opportunity_broking_slip_activity_document_map
    Rules:
        - Versions are historical and immutable
        - All quotes must reference a specific broking slip version

    2.2 Quotes
    Tables:
        - opportunity_quote
        - opportunity_quote_entry (premiums, sum insured, etc.)
        - opportunity_quote_cover_detail
        - opportunity_quote_tax_map
        - opportunity_quote_doc_map
        - opportunity_quote_entry_document_map
    Rules:
        - Financial data only from quote_entry and related tables
        - Never source premiums from RFP or opportunity tables

    2.3 Quote Comparison
    Tables:
        - opportunity_quote_comparison_report
        - opportunity_quote_comparison_report_document_map

    2.4 Final Negotiation
    Tables:
        - opportunity_final_negotiation (finalized quote master)
        - opportunity_final_negotiation_sharing_detail (insurer shares, brokerage)
        - opportunity_final_negotiation_quote_cover_detail
        - opportunity_final_negotiation_tax_map
        - opportunity_final_negotiation_qcr_variation (deviations)
        - opportunity_final_negotiation_service_level_agreement
        - opportunity_final_negotiation_doc_map
        - opportunity_final_negotiation_quote_documents
    Rules:
        - Once present, this is the source of truth for final terms
        - Overrides earlier quotes

    2.5 Placement Slip
    Tables:
        - opportunity_placement_slip_generation (brokerage, SI, etc.)
        - opportunity_placement_slip_cover_detail
        - opportunity_placement_slip_insurer_map
        - opportunity_placement_slip_sharing_detail
        - opportunity_placement_slip_tpa_map
        - opportunity_placement_slip_cd_detail (caution deposit)
        - opportunity_placement_slip_installment_detail
        - opportunity_placement_slip_document_map
    Rules:
        - Financially binding pre-policy structure

    3. ISG-2 PHASE (POST-PLACEMENT & POLICY CONFIRMATION)

    3.1 Premium Calculation
    Tables:
        - opportunity_premium_calculation
        - opportunity_premium_cover_detail
        - opportunity_premium_calculation_document_map

    3.2 Held Cover Note
    Tables:
        - opportunity_held_cover_note
        - opportunity_held_cover_note_cover_detail
        - opportunity_held_cover_note_insurer_map
        - opportunity_held_cover_note_document_map
    Rules:
        - Captures temporary coverage and acknowledged deviations

    3.3 Policy Confirmation
    Tables:
        - opportunity_policy_confirmation
        - opportunity_policy_confirmation_insurer_map
        - opportunity_policy_confirmation_document_map

    3.4 Policy Hard Copy
    Tables:
        - opportunity_policy_hard_copy
        - opportunity_policy_hard_copy_cover_detail
        - opportunity_policy_hard_copy_insurer_map
        - opportunity_policy_hard_copy_document_map

    3.5 Policy Docket & Handover
    Tables:
        - opportunity_policy_docket
        - opportunity_policy_docket_document_map
        - opportunity_hand_over_meet

    4. LOST OPPORTUNITIES

    Table: opportunity_lost
    Rules:
        - Loss reasons and remarks must come from this table
        - Opportunity status alone is not sufficient evidence of loss

20. COMPREHENSIVE OPPORTUNITY QUERY RULES & BUSINESS LOGIC

    A. Opportunity Identification & Core Data
    - For opportunity identification, use o.id as primary key and o.source for names
    - NEVER assume opportunity_name column exists - it doesn't
    - Always join opportunity to company using o.company_id = c.id for client details
    - Always cast date fields to TEXT: o.expiry_date::text, o.created_at::text
    - CRITICAL: Use o.expiry_date (policy expiry) and o.created_at (opportunity creation), NOT from_date/to_date
    - **CRITICAL ORDER BY RULE**: When using SELECT DISTINCT with ORDER BY, ALL columns in ORDER BY must EXACTLY match the SELECT clause expressions, including casting:
      CORRECT: SELECT DISTINCT o.id, o.created_at::text FROM opportunity o ORDER BY o.created_at::text;
      WRONG: SELECT DISTINCT o.id, o.created_at::text FROM opportunity o ORDER BY o.created_at; -- PostgreSQL error!
      WRONG: SELECT DISTINCT o.id FROM opportunity o ORDER BY o.created_at DESC; -- PostgreSQL error!
    - **SCHEMA VALIDATION**: Always verify column names exist before using them. Common non-existent columns:
      * opportunity_rfp_details_entry.expected_premium (use total_expected_premium or verify actual column)
      * opportunity_activity_map.stage_id (use ref_stage_id or verify actual column)
      * opportunity_quote_entry.gross_premium_amount (VERIFY COLUMN EXISTS)
      * opportunity_final_negotiation.gross_premium_amount (VERIFY COLUMN EXISTS)
    - **ACTIVITY NAME MATCHING**: Never use exact activity name matches. Use flexible patterns:
      * "client meeting" → (ma.name ILIKE '%meeting%' OR ma.name ILIKE '%discussion%' OR ma.name ILIKE '%visit%')
      * "presentation" → (ma.name ILIKE '%presentation%' OR ma.name ILIKE '%demo%' OR ma.name ILIKE '%proposal%')
      * "follow up" → (ma.name ILIKE '%follow%' OR ma.name ILIKE '%reminder%' OR ma.name ILIKE '%touch%')
      * "call" → (ma.name ILIKE '%call%' OR ma.name ILIKE '%phone%' OR ma.name ILIKE '%conference%')
      * ALWAYS use OR conditions with multiple related terms, never single exact matches
    
    **FINANCIAL QUERY WARNING:**
    Many financial columns may not exist in the database. Before generating financial queries:
    1. VERIFY column existence in opportunity_quote_entry and opportunity_final_negotiation tables  
    2. Use policy.premium_at_inception for confirmed financial amounts
    3. Avoid assumptions about quote and negotiation table structures
    4. When financial data is requested, prioritize policy table over opportunity phase tables\n    \n    **ACTIVITY MATCHING EXAMPLES:**\n    ```sql\n    -- CORRECT: Broad pattern for meetings\n    WHERE (\n        ma.name ILIKE '%meeting%' OR \n        ma.name ILIKE '%discussion%' OR \n        ma.name ILIKE '%visit%' OR\n        ma.name ILIKE '%conference%'\n    )\n    \n    -- WRONG: Exact match (too restrictive)\n    WHERE ma.name ILIKE '%client meeting%'\n    ```
    
    B. Status & Lifecycle Management
    - For opportunity status: JOIN lookup_data ld_status ON o.status_lid = ld_status.id
    - For opportunity type: JOIN lookup_data ld_type ON o.opportunity_type_lid = ld_type.id
    - For policy type: JOIN lookup_data ld_policy_type ON o.policy_type_lid = ld_policy_type.id
    - For service level: JOIN lookup_data ld_service ON o.service_level_lid = ld_service.id
    
    C. Financial Data Access Rules
    - RFP Phase: Expected premium from opportunity_rfp_details_entry.total_expected_premium (or similar field)
    - Quote Phase: Actual premiums from opportunity_quote_entry.gross_premium_amount (VERIFY COLUMN EXISTS)
    - Final Negotiation: Finalized amounts from opportunity_final_negotiation tables
    - Placement: Binding amounts from opportunity_placement_slip_generation
    - Policy: Final amounts from policy table (post-conversion)
    
    D. Activity & Stage Tracking
    - Current activity: SELECT TOP 1 FROM opportunity_activity_map ORDER BY updated_at DESC
    - Activity participants: Always join opportunity_activity_participants to users table
    - Stage information: Join to mstr_stage for stage names and workflow details
    
    E. Document & Communication Management
    - General docs: opportunity_document_map → file_uploads
    - Activity-specific docs: opportunity_*_activity_document_map → file_uploads
    - Phase-specific docs: opportunity_*_document_map → file_uploads
    - Always select file_uploads.file_key, file_uploads.original_name
    
    F. Contact & Relationship Management
    - General contacts: opportunity_contact_map → contact for day-to-day operations
    - Mandate contacts: opportunity_mandate_details_contact_map → contact for approvals
    - Client contacts: opportunity_rfp_client_contact_detail for RFP phase
    - Influencers: opportunity_rfp_client_contact_influencers for decision makers
    
    G. Competitive Intelligence
    - Competitors: opportunity_competitor.competitor (direct string field)
    - Previous placement: opportunity_previous_placement_details for history
    - Previous mediator: opportunity_previous_mediator_details for incumbent info
    - Claim experience: opportunity_claim_experience for loss history
    
    H. Technical & Coverage Details
    - Intended covers: opportunity_cover_map for initial requirements
    - RFP covers: opportunity_rfp_cover_detail for detailed requirements
    - Quote covers: opportunity_quote_cover_detail for insurer responses
    - Final covers: opportunity_final_negotiation_quote_cover_detail for agreed terms
    
    I. Risk & Location Information
    - Risk locations: opportunity_risk_location_map → address → city → state → country
    - Always include full address chain for complete location data
    
    J. Meeting & Timeline Management
    - KDM meetings: opportunity_kdm_meeting for key decision maker interactions
    - Handover meetings: opportunity_hand_over_meet for transition planning
    
    K. Data Validation & Quality
    - Validation status: opportunity_data_validation for data completeness checks
    - Validation documents: opportunity_data_validation_document_map
    
    L. Advanced Query Patterns for Opportunities
    
    1. Opportunity Summary Pattern:
    ```sql
    SELECT 
        o.id,
        o.sales_pitch,
        o.expiry_date::text,
        o.created_at::text,
        c.company_name,
        ld_status.value as status,
        ld_type.value as opportunity_type,
        ld_policy.value as policy_type
    FROM opportunity o
    JOIN company c ON o.company_id = c.id
    JOIN lookup_data ld_status ON o.status_lid = ld_status.id
    LEFT JOIN lookup_data ld_type ON o.opportunity_type_lid = ld_type.id
    LEFT JOIN lookup_data ld_policy ON o.policy_type_lid = ld_policy.id
    ```
    
    2. Current Activity Pattern:
    ```sql
    SELECT 
        o.sales_pitch,
        oam.updated_at::text as last_activity_date,
        ms.name as current_stage
    FROM opportunity o
    LEFT JOIN opportunity_activity_map oam ON o.id = oam.opportunity_id
    LEFT JOIN mstr_stage ms ON oam.ref_stage_id = ms.id
    WHERE oam.updated_at = (
        SELECT MAX(updated_at) 
        FROM opportunity_activity_map 
        WHERE opportunity_id = o.id
    )
    ```
    
    3. Financial Progression Pattern:
    ```sql
    WITH opp_financials AS (
        SELECT 
            o.id,
            o.sales_pitch,
            -- rfp.expected_premium as rfp_premium, -- VERIFY COLUMN EXISTS
            -- qe.gross_premium_amount as quote_premium, -- VERIFY COLUMN EXISTS
            -- fn.gross_premium_amount as negotiated_premium, -- VERIFY COLUMN EXISTS
            p.premium_at_inception as final_premium
        FROM opportunity o
        LEFT JOIN opportunity_rfp_details_entry rfp ON o.id = rfp.opportunity_id
        LEFT JOIN opportunity_quote_entry qe ON o.id = qe.opportunity_id
        LEFT JOIN opportunity_final_negotiation fn ON o.id = fn.opportunity_id
        LEFT JOIN policy p ON o.id = p.opportunity_id
    )
    ```
    
    M. Error Prevention for Opportunities
    - Never assume opportunity.opportunity_name exists
    - Never use opportunity.remarks unless explicitly requested
    - Always validate lookup_data joins for _lid fields
    - Always use LEFT JOIN for optional relationships (service_level_lid, etc.)
    - Never mix BD, ISG-1, and ISG-2 phase data without clear business need
    - Always consider the workflow sequence when joining phase-specific tables
    
    N. Performance Optimization
    - Use LIMIT when querying large opportunity datasets
    - Index-friendly patterns: filter by company_id, status_lid, created_at ranges
    - Avoid SELECT * on opportunity table due to JSON fields
    - Use EXISTS instead of IN for complex subqueries
    
    O. Business Context Guidelines
    - Renewal vs Fresh vs Mined opportunities have different data patterns
    - Won opportunities should have policy records
    - Lost opportunities should have opportunity_lost entries
    - In-progress opportunities may be in any phase (BD, ISG-1, ISG-2)
    
    P. Common Opportunity Query Examples & Patterns
    
    1. "List all opportunities for a company":
    ```sql
    SELECT DISTINCT
        o.id,
        o.sales_pitch,
        o.expiry_date::text,
        o.created_at::text,
        c.company_name,
        ld_status.value as status,
        ld_type.value as opportunity_type
    FROM opportunity o
    JOIN company c ON o.company_id = c.id
    JOIN lookup_data ld_status ON o.status_lid = ld_status.id
    LEFT JOIN lookup_data ld_type ON o.opportunity_type_lid = ld_type.id
    WHERE c.company_name ILIKE '%company_name%' OR c.display_name ILIKE '%company_name%'
    ORDER BY o.created_at::text DESC
    ```
    
    2. "Get opportunity requirements":
    ```sql
    SELECT 
        o.sales_pitch,
        rfp.requirements
        -- rfp.expected_premium -- VERIFY COLUMN EXISTS
    FROM opportunity o
    JOIN opportunity_rfp_details_entry rfp ON o.id = rfp.opportunity_id
    WHERE o.sales_pitch ILIKE '%search_term%'
    ```
    
    3. "Find competitors for an opportunity":
    ```sql
    SELECT 
        o.sales_pitch,
        comp.competitor
    FROM opportunity o
    JOIN opportunity_competitor comp ON o.id = comp.opportunity_id
    WHERE o.sales_pitch ILIKE '%search_term%'
    ```
    
    4. "Get current stage of opportunities":
    ```sql
    SELECT 
        o.sales_pitch,
        ms.name as current_stage,
        oam.updated_at::text as last_activity_date
    FROM opportunity o
    LEFT JOIN (
        SELECT DISTINCT ON (opportunity_id) 
            opportunity_id, ref_stage_id, updated_at
        FROM opportunity_activity_map 
        ORDER BY opportunity_id, updated_at::text DESC
    ) latest_oam ON o.id = latest_oam.opportunity_id
    LEFT JOIN opportunity_activity_map oam ON latest_oam.opportunity_id = oam.opportunity_id 
        AND latest_oam.updated_at = oam.updated_at
    LEFT JOIN mstr_stage ms ON oam.ref_stage_id = ms.id
    ```
    
    5. "Get opportunity documents by activity":
    ```sql
    SELECT 
        o.sales_pitch,
        ma.name as activity_name,
        fu.file_key as document_name,
        fu.original_name
    FROM opportunity o
    JOIN opportunity_activity_map oam ON o.id = oam.opportunity_id
    JOIN mstr_activity ma ON oam.ref_activity_id = ma.id
    JOIN opportunity_rfp_activity_document_map oadm ON oam.id = oadm.opportunity_activity_map_id
    JOIN file_uploads fu ON oadm.document_id = fu.id
    WHERE (
        ma.name ILIKE '%meeting%' OR 
        ma.name ILIKE '%discussion%' OR 
        ma.name ILIKE '%visit%' OR
        ma.name ILIKE '%conference%'
    ) -- Use broad patterns, not exact matches like '%client meeting%'
    ```
    
    6. "Get opportunity financial progression":
    ```sql
    SELECT 
        o.sales_pitch,
        -- COALESCE(rfp.expected_premium, 0) as rfp_expected, -- VERIFY COLUMN EXISTS
        -- COALESCE(qe.gross_premium_amount, 0) as quote_amount, -- VERIFY COLUMN EXISTS
        -- COALESCE(fn.gross_premium_amount, 0) as negotiated_amount, -- VERIFY COLUMN EXISTS
        COALESCE(p.premium_at_inception, 0) as final_premium
    FROM opportunity o
    LEFT JOIN opportunity_rfp_details_entry rfp ON o.id = rfp.opportunity_id
    LEFT JOIN opportunity_quote_entry qe ON o.id = qe.opportunity_id
    LEFT JOIN opportunity_final_negotiation fn ON o.id = fn.opportunity_id
    LEFT JOIN policy p ON o.id = p.opportunity_id
    ```
    
    7. "Get opportunity loss reasons":
    ```sql
    SELECT 
        o.sales_pitch,
        ol.loss_reason,
        ol.loss_remarks,
        ol.created_at::text as loss_date
    FROM opportunity o
    JOIN opportunity_lost ol ON o.id = ol.opportunity_id
    JOIN lookup_data ld_status ON o.status_lid = ld_status.id
    WHERE ld_status.value ILIKE '%lost%'
    ```
    
    Q. Opportunity Query Troubleshooting Rules
    - If user asks for "opportunity name" → use COALESCE(o.source, 'Opportunity-' || o.id) AS opportunity_name instead
    - If user asks for "opportunity details" → include source, expiry_date, created_at, status (NOT sales_pitch unless specifically requested)
    - If user asks for "opportunity start date" → use o.created_at
    - If user asks for "opportunity period" → use created_at to expiry_date range
    - If user asks for "opportunities that started in [time]" → filter by o.created_at
    - If user asks for "opportunities expiring in [time]" → filter by o.expiry_date
    - If user asks for "opportunity requirements" → join to opportunity_rfp_details_entry
    - If user asks for "opportunity documents" → specify which phase/activity documents
    - If user asks for "opportunity status" → always join to lookup_data table
    - If user asks for "opportunity stage" → join to opportunity_activity_map and mstr_stage
    - If user asks for "opportunity premium" → clarify which phase (RFP/Quote/Final)
    - If user asks for "opportunity competitors" → use opportunity_competitor table
    - If user asks for "opportunity contacts" → specify type (general/mandate/RFP/influencer)
    - CRITICAL: NEVER use from_date/to_date - they don't exist in opportunity table
    
    R. Opportunity Terminology Mapping
    - "Opportunity name/title" = COALESCE(source, 'Opportunity-' || id) field
    - "Opportunity period/duration" = created_at to expiry_date  
    - "Opportunity start date" = created_at (when opportunity was created)
    - "Opportunity expiry date" = expiry_date (target policy expiry)
    - "Opportunity client" = company via company_id join
    - "Opportunity requirements" = opportunity_rfp_details_entry.requirements
    - "Opportunity expected premium" = opportunity_rfp_details_entry.total_expected_premium (verify column exists)
    - "Opportunity quote premium" = opportunity_quote_entry.gross_premium_amount (VERIFY COLUMN EXISTS)
    - "Opportunity final premium" = opportunity_final_negotiation.gross_premium_amount (VERIFY COLUMN EXISTS)
    - "Opportunity current stage" = mstr_stage.name via latest opportunity_activity_map
    - "Opportunity participants" = users.name via opportunity_activity_participants
    - "Opportunity loss reason" = opportunity_lost.loss_reason
    - "Opportunity service level" = lookup_data.value via service_level_lid
    - "Opportunity covers" = opportunity_cover_map or phase-specific cover tables
    - CRITICAL: NO from_date/to_date columns exist in opportunity table

22. TASK MANAGEMENT SYSTEM RULES
    A. Task Table (Primary Task Management)
    Rules:
        - task.task_name contains the actual task title/description
        - task.assignee_id links to users/employees for task assignments
        - task.due_date is the target completion date (always cast to TEXT in queries)
        - task.priority_lid links to lookup_data for task priority levels
        - task.task_status_lid links to lookup_data for current task status
        - task.task_type_lid and task.task_category_lid link to lookup_data for categorization
        - task.opportunity_id and task.policy_id link tasks to specific opportunities/policies
        - task.activity_id links tasks to opportunity activities
        - NEVER use deleted_at unless specifically querying for deleted tasks
        
    B. Task-Document Relationships
    Rules:
        - Use task_document_map to link tasks with supporting documents
        - Join path: task → task_document_map → file_uploads
        - CRITICAL: Only use file_uploads.file_key for document identification
        - Example: SELECT t.task_name, fu.file_key AS document_name 
                  FROM task t
                  JOIN task_document_map tdm ON t.id = tdm.task_id  
                  JOIN file_uploads fu ON tdm.document_id = fu.id
        
    C. Task Query Patterns & Lookup Data Handling
    
    CRITICAL LOOKUP DATA RULES FOR TASKS:
    - NEVER assume exact lookup_key values like 'TASK_STATUS' or 'TASK_PRIORITY'
    - ALWAYS use flexible pattern matching for lookup keys:
      * For status: WHERE (ld.lookup_key ILIKE '%task%' AND ld.lookup_key ILIKE '%status%') OR ld.lookup_key ILIKE '%status%'
      * For priority: WHERE (ld.lookup_key ILIKE '%task%' AND ld.lookup_key ILIKE '%priority%') OR ld.lookup_key ILIKE '%priority%'
    - Use flexible value matching with multiple OR conditions for common terms:
      * Pending tasks: WHERE ld.value ILIKE '%pending%' OR ld.value ILIKE '%open%' OR ld.value ILIKE '%active%'
      * High priority: WHERE ld.value ILIKE '%high%' OR ld.value ILIKE '%critical%' OR ld.value ILIKE '%urgent%'
      * Completed tasks: WHERE ld.value ILIKE '%completed%' OR ld.value ILIKE '%closed%' OR ld.value ILIKE '%done%'
    
    Task Status Analysis (FLEXIBLE PATTERN):
        ```sql
        SELECT 
            ld_status.value AS task_status,
            COUNT(*) AS task_count,
            COUNT(CASE WHEN t.due_date::date < CURRENT_DATE THEN 1 END) AS overdue_count
        FROM task t
        JOIN lookup_data ld_status ON t.task_status_lid = ld_status.id
        WHERE (ld_status.lookup_key ILIKE '%task%' AND ld_status.lookup_key ILIKE '%status%') 
           OR ld_status.lookup_key ILIKE '%status%'
        GROUP BY ld_status.value
        ORDER BY task_count DESC
        ```
        
    Task Assignment Analysis:
        ```sql
        SELECT 
            COALESCE(u.first_name || ' ' || u.last_name, 'Unassigned') AS assignee_name,
            COUNT(*) AS assigned_tasks,
            COUNT(CASE WHEN t.due_date::date < CURRENT_DATE THEN 1 END) AS overdue_tasks
        FROM task t
        LEFT JOIN users u ON t.assignee_id = u.id
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY assigned_tasks DESC
        ```
        
    Pending Tasks Query (FLEXIBLE PATTERN):
        ```sql
        SELECT 
            t.task_name,
            t.due_date::text AS due_date,
            COALESCE(u.first_name || ' ' || u.last_name, 'Unassigned') AS assignee_name,
            ld_status.value AS task_status
        FROM task t
        LEFT JOIN lookup_data ld_status ON t.task_status_lid = ld_status.id
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE ld_status.value ILIKE '%pending%' 
           OR ld_status.value ILIKE '%open%' 
           OR ld_status.value ILIKE '%active%'
           OR ld_status.value ILIKE '%progress%'
        ORDER BY t.due_date
        ```
        
    D. Task-Opportunity Integration
    Rules:
        - When querying tasks related to opportunities, join via task.opportunity_id
        - Include company context: task → opportunity → company
        - For activity-specific tasks: task → opportunity_activity_map via activity_id
        - Example: SELECT t.task_name, o.source AS opportunity_name, c.company_name
                  FROM task t
                  JOIN opportunity o ON t.opportunity_id = o.id
                  JOIN company c ON o.company_id = c.id

23. MEETING MANAGEMENT SYSTEM RULES
    A. Meeting Table (Core Meeting Data)
    Rules:
        - meeting.meeting_date (DATE) is the primary date field for scheduling queries
        - meeting.start_time and meeting.end_time contain time details
        - meeting.meeting_subject and meeting.meeting_agenda contain meeting details
        - meeting.meeting_status_lid links to lookup_data for meeting status
        - meeting.opportunity_id links meetings to opportunities
        - meeting.company_id identifies the client company
        - ALWAYS cast meeting_date to TEXT in SELECT: meeting_date::text
        - For "meetings this month/week" use meeting.meeting_date for filtering
        
    **CRITICAL BUSINESS CONTEXT REQUIREMENTS:**
        - NEVER return meetings with just basic fields (subject, date, rating)
        - ALWAYS include company context via opportunity → company joins
        - ALWAYS include opportunity information when available
        - ALWAYS include meeting participants for complete context
        - ALWAYS include meeting type information via lookup_data
        
    **MANDATORY MEETING CONTEXT JOINS:**
        - JOIN opportunity o ON m.opportunity_id = o.id (for opportunity context)
        - JOIN company c ON o.company_id = c.id (for client/company names)
        - LEFT JOIN lookup_data ld_type ON m.meeting_type_lid = ld_type.id (for meeting type)
        - LEFT JOIN lookup_data ld_status ON m.meeting_status_lid = ld_status.id (for status)
        - Always include participant information when querying meetings
        
    B. Meeting-Opportunity Integration Patterns
    
    **ENHANCED BUSINESS CONTEXT PATTERNS:**
    
    For KDM Meetings (COMPREHENSIVE CONTEXT):
        ```sql
        SELECT 
            m.meeting_date::text,
            m.meeting_subject,
            m.meeting_rating,
            c.company_name,
            o.source AS opportunity_name,
            COALESCE(ld_type.value, 'Unknown Type') AS meeting_type,
            COALESCE(ld_status.value, 'Unknown Status') AS meeting_status,
            u.first_name || ' ' || u.last_name AS broker_name,
            okm.remarks AS kdm_remarks
        FROM opportunity_kdm_meeting okm
        JOIN meeting m ON okm.meeting_id = m.id
        JOIN opportunity o ON m.opportunity_id = o.id  
        JOIN company c ON o.company_id = c.id
        LEFT JOIN lookup_data ld_type ON m.meeting_type_lid = ld_type.id
        LEFT JOIN lookup_data ld_status ON m.meeting_status_lid = ld_status.id
        LEFT JOIN users u ON o.owner_id = u.id OR o.am_id = u.id
        ORDER BY m.meeting_rating DESC, m.meeting_date DESC
        ```
        
    For Handover Meetings (COMPREHENSIVE CONTEXT):
        ```sql
        SELECT 
            m.meeting_date::text,
            m.meeting_subject,
            m.meeting_rating,
            c.company_name,
            o.source AS opportunity_name,
            COALESCE(ld_type.value, 'Unknown Type') AS meeting_type,
            COALESCE(ld_status.value, 'Unknown Status') AS meeting_status,
            u.first_name || ' ' || u.last_name AS broker_name,
            ohm.remarks AS handover_remarks,
            ohm.mom AS minutes_of_meeting
        FROM opportunity_hand_over_meet ohm
        JOIN meeting m ON ohm.meeting_id = m.id
        JOIN opportunity o ON m.opportunity_id = o.id
        JOIN company c ON o.company_id = c.id
        LEFT JOIN lookup_data ld_type ON m.meeting_type_lid = ld_type.id
        LEFT JOIN lookup_data ld_status ON m.meeting_status_lid = ld_status.id
        LEFT JOIN users u ON o.owner_id = u.id OR o.am_id = u.id
        ORDER BY m.meeting_rating DESC, m.meeting_date DESC
        ```
        
    For General Meeting Queries (ALWAYS USE FULL CONTEXT):
        ```sql
        SELECT 
            m.meeting_date::text,
            m.meeting_subject,
            m.meeting_rating,
            c.company_name,
            COALESCE(o.source, 'No Opportunity') AS opportunity_name,
            COALESCE(ld_type.value, 'Unknown Type') AS meeting_type,
            COALESCE(ld_status.value, 'Unknown Status') AS meeting_status,
            COALESCE(u.first_name || ' ' || u.last_name, 'No Broker') AS broker_name,
            m.meeting_agenda,
            STRING_AGG(DISTINCT 
                CASE 
                    WHEN mpm.participant_record_type = 'EMPLOYEE' THEN emp.first_name || ' ' || emp.last_name
                    WHEN mpm.participant_record_type LIKE '%CONTACT' THEN cont.contact_name
                END, ', ') AS participants
        FROM meeting m
        LEFT JOIN opportunity o ON m.opportunity_id = o.id
        LEFT JOIN company c ON o.company_id = c.id OR m.company_id = c.id
        LEFT JOIN lookup_data ld_type ON m.meeting_type_lid = ld_type.id
        LEFT JOIN lookup_data ld_status ON m.meeting_status_lid = ld_status.id
        LEFT JOIN users u ON o.owner_id = u.id OR o.am_id = u.id
        LEFT JOIN meeting_participant_map mpm ON m.id = mpm.meeting_id
        LEFT JOIN users emp ON (mpm.participant_record_type = 'EMPLOYEE' AND mpm.participant_id = emp.id)
        LEFT JOIN contact cont ON (mpm.participant_record_type LIKE '%CONTACT' AND mpm.participant_id = cont.id)
        GROUP BY m.id, m.meeting_date, m.meeting_subject, m.meeting_rating, 
                 c.company_name, o.source, ld_type.value, ld_status.value, 
                 u.first_name, u.last_name, m.meeting_agenda
        ORDER BY m.meeting_rating DESC, m.meeting_date DESC
        ```
        
    C. Meeting Participants Management
    Rules:
        - meeting_participant_map links meetings to participants
        - participant_record_type indicates participant category:
          'TPA_CONTACT', 'INSURER_CONTACT', 'BROKER_CONTACT', 'COMPANY_CONTACT', 'EMPLOYEE'
        - participant_id references different tables based on participant_record_type
        - For EMPLOYEE participants: JOIN to users table via participant_id
        - For contact participants: JOIN to contact table via participant_id
        - Always filter by participant_record_type when joining
        
    Example Participant Query:
        ```sql
        SELECT 
            m.meeting_subject,
            mpm.participant_record_type,
            CASE 
                WHEN mpm.participant_record_type = 'EMPLOYEE' THEN u.first_name || ' ' || u.last_name
                WHEN mpm.participant_record_type LIKE '%CONTACT' THEN c.contact_name
            END AS participant_name
        FROM meeting m
        JOIN meeting_participant_map mpm ON m.id = mpm.meeting_id
        LEFT JOIN users u ON (mpm.participant_record_type = 'EMPLOYEE' AND mpm.participant_id = u.id)
        LEFT JOIN contact c ON (mpm.participant_record_type LIKE '%CONTACT' AND mpm.participant_id = c.id)
        ```
        
    D. Meeting Outcomes & Follow-up Tracking
    
    CRITICAL RULES FOR MEETING OUTCOME LOOKUPS:
    - outcome_id, next_step_id, challenge_id are lookup_data.id references
    - NEVER assume specific lookup_key values - use flexible patterns
    - Use COALESCE for optional outcome data to handle NULL values gracefully
    
    Rules:
        - meeting_outcomes_map tracks predefined meeting outcomes
        - meeting_next_steps_map tracks planned follow-up actions  
        - meeting_challenges_map tracks identified issues
        - All mapping tables reference lookup_data for predefined values
        
    Meeting Analysis Query (FLEXIBLE PATTERN):
        ```sql
        SELECT 
            m.meeting_subject,
            m.meeting_date::text,
            COALESCE(ld_outcome.value, 'No outcome recorded') AS outcome,
            COALESCE(ld_next_step.value, 'No next steps') AS next_step,
            COALESCE(ld_challenge.value, 'No challenges') AS challenge
        FROM meeting m
        LEFT JOIN meeting_outcomes_map mom ON m.id = mom.meeting_id
        LEFT JOIN lookup_data ld_outcome ON mom.outcome_id = ld_outcome.id
        LEFT JOIN meeting_next_steps_map mnsm ON m.id = mnsm.meeting_id  
        LEFT JOIN lookup_data ld_next_step ON mnsm.next_step_id = ld_next_step.id
        LEFT JOIN meeting_challenges_map mcm ON m.id = mcm.meeting_id
        LEFT JOIN lookup_data ld_challenge ON mcm.challenge_id = ld_challenge.id
        ORDER BY m.meeting_date DESC
        ```
        
    E. Meeting Document Management
    Rules:
        - meeting_document_map links meetings to supporting documents
        - Join path: meeting → meeting_document_map → file_uploads
        - document_type_lid categorizes document types via lookup_data
        - CRITICAL: Only use file_uploads.file_key for document identification
        
    F. Meeting Scheduling & Date-Based Queries
    Rules:
        - **CRITICAL**: ALWAYS use meeting.meeting_date for date filtering
        - NEVER use opportunity_activity_map.planned_at for meeting dates
        - For "upcoming meetings": WHERE meeting.meeting_date >= CURRENT_DATE
        - For "meetings this month": WHERE meeting.meeting_date >= date_trunc('month', CURRENT_DATE)
        - For "past meetings": WHERE meeting.meeting_date < CURRENT_DATE
        - **INCORRECT JOIN PATTERN**: opportunity_activity_map directly to meeting (meeting_id doesn't exist in opportunity_activity_map)
        - **CORRECT JOIN PATTERN**: Use specific meeting tables (opportunity_kdm_meeting, opportunity_hand_over_meet) as intermediary
        
    G. Meeting Status & Type Management  
    
    CRITICAL LOOKUP DATA RULES FOR MEETINGS:
    - NEVER assume exact lookup_key values like 'MEETING_STATUS' or 'MEETING_TYPE'
    - ALWAYS use flexible pattern matching for lookup keys:
      * For meeting status: WHERE (ld.lookup_key ILIKE '%meeting%' AND ld.lookup_key ILIKE '%status%') OR ld.lookup_key ILIKE '%status%'
      * For meeting type: WHERE (ld.lookup_key ILIKE '%meeting%' AND ld.lookup_key ILIKE '%type%') OR ld.lookup_key ILIKE '%type%'
      * For location type: WHERE ld.lookup_key ILIKE '%location%' OR ld.lookup_key ILIKE '%venue%'
    - Use flexible value matching for common meeting terms:
      * Scheduled meetings: WHERE ld.value ILIKE '%scheduled%' OR ld.value ILIKE '%planned%' OR ld.value ILIKE '%upcoming%'
      * Completed meetings: WHERE ld.value ILIKE '%completed%' OR ld.value ILIKE '%held%' OR ld.value ILIKE '%done%'
      * KDM meetings: WHERE ld.value ILIKE '%kdm%' OR ld.value ILIKE '%key%decision%' OR ld.value ILIKE '%decision%'
      
    Rules:
        - meeting.meeting_type_lid links to lookup_data for meeting categories
        - meeting.meeting_status_lid tracks meeting completion status
        - meeting.location_type_lid indicates meeting location (office/client/virtual)
        - meeting.meeting_rating stores post-meeting feedback scores
        - Always use flexible lookup_key patterns when joining
        
    **CRITICAL: NEVER USE BASIC MEETING QUERIES**
    WRONG (TOO BASIC):
        ```sql
        SELECT m.meeting_subject, m.meeting_date::text, m.meeting_rating 
        FROM meeting m 
        ORDER BY m.meeting_rating DESC
        ```
        
    CORRECT (COMPREHENSIVE BUSINESS CONTEXT):
        ```sql
        SELECT 
            m.meeting_subject,
            m.meeting_date::text,
            m.meeting_rating,
            c.company_name,
            COALESCE(o.source, 'No Opportunity') AS opportunity_name,
            COALESCE(ld_type.value, 'Unknown Type') AS meeting_type,
            COALESCE(ld_status.value, 'Unknown Status') AS meeting_status,
            COALESCE(u.first_name || ' ' || u.last_name, 'No Broker') AS broker_name
        FROM meeting m
        LEFT JOIN opportunity o ON m.opportunity_id = o.id
        LEFT JOIN company c ON o.company_id = c.id OR m.company_id = c.id
        LEFT JOIN lookup_data ld_type ON m.meeting_type_lid = ld_type.id
        LEFT JOIN lookup_data ld_status ON m.meeting_status_lid = ld_status.id
        LEFT JOIN users u ON o.owner_id = u.id OR o.am_id = u.id
        WHERE m.meeting_rating IS NOT NULL
        ORDER BY m.meeting_rating DESC, m.meeting_date DESC
        ```
        
    Meeting Type Analysis (FLEXIBLE PATTERN WITH CONTEXT):
        ```sql
        SELECT 
            ld_type.value AS meeting_type,
            COUNT(*) AS meeting_count,
            AVG(m.meeting_rating) AS avg_rating,
            COUNT(DISTINCT c.id) AS unique_companies,
            COUNT(DISTINCT o.id) AS unique_opportunities
        FROM meeting m
        LEFT JOIN lookup_data ld_type ON m.meeting_type_lid = ld_type.id
        LEFT JOIN opportunity o ON m.opportunity_id = o.id
        LEFT JOIN company c ON o.company_id = c.id OR m.company_id = c.id
        WHERE (ld_type.lookup_key ILIKE '%meeting%' AND ld_type.lookup_key ILIKE '%type%') 
           OR ld_type.lookup_key ILIKE '%type%'
        GROUP BY ld_type.value
        ORDER BY meeting_count DESC
        ```
        
24. CRITICAL MEETING-OPPORTUNITY ACTIVITY RELATIONSHIP
    **IMPORTANT DISTINCTION:**
    - opportunity_activity_map does NOT directly link to meeting table
    - Meeting scheduling is handled through specific meeting junction tables:
      * opportunity_kdm_meeting (for KDM meetings)
      * opportunity_hand_over_meet (for handover meetings)
    - These junction tables contain meeting_id that links to the meeting table
    - For activity-based meeting queries, use the junction tables as bridges
    - NEVER attempt: opportunity_activity_map JOIN meeting ON meeting_id (column doesn't exist)
    - ALWAYS use: opportunity_activity_map → specific meeting junction table → meeting
25. BUSINESS TARGET MANAGEMENT SYSTEM RULES
    A. Business Target Table (Performance Target Tracking)
    Rules:
        - business_target.user_id links to users/employees for target assignments
        - business_target.month is the target period (always cast to TEXT in queries)
        - business_target.entity_type categorizes the business area (PREMIUM, POLICY, COMPANY, etc.)
        - business_target.kpi specifies the key performance indicator being measured
        - business_target.type_of_target classifies the target type
        - business_target.value_of_target contains the target amount/value
        - NEVER use deleted_at unless specifically querying for deleted targets
        
    B. Business Target Query Patterns & Flexible Matching
    
    CRITICAL FLEXIBLE PATTERN RULES:
    - ALWAYS use flexible pattern matching for text fields:
      * For entity_type: WHERE bt.entity_type ILIKE '%premium%' OR bt.entity_type ILIKE '%policy%' OR bt.entity_type ILIKE '%company%'
      * For kpi: WHERE bt.kpi ILIKE '%revenue%' OR bt.kpi ILIKE '%income%' OR bt.kpi ILIKE '%sales%'
      * For type_of_target: WHERE bt.type_of_target ILIKE '%monthly%' OR bt.type_of_target ILIKE '%quarterly%' OR bt.type_of_target ILIKE '%annual%'
    
    Target Performance Analysis:
        ```sql
        SELECT 
            u.first_name || ' ' || u.last_name AS employee_name,
            bt.month::text AS target_month,
            bt.entity_type,
            bt.kpi,
            bt.value_of_target,
            bt.type_of_target
        FROM business_target bt
        JOIN users u ON bt.user_id = u.id
        WHERE bt.month >= CURRENT_DATE - INTERVAL '12 months'
        ORDER BY bt.month DESC, u.first_name
        ```
        
    Monthly Target Summary:
        ```sql
        SELECT 
            bt.month::text AS target_month,
            bt.entity_type,
            COUNT(*) AS target_count,
            SUM(bt.value_of_target) AS total_target_value,
            AVG(bt.value_of_target) AS avg_target_value
        FROM business_target bt
        GROUP BY bt.month, bt.entity_type
        ORDER BY bt.month DESC, total_target_value DESC
        ```
        
    C. Target-User Integration
    Rules:
        - When querying targets by user, always join via business_target.user_id
        - Include user context: business_target → users for employee names
        - For team-based targets: Group by user_id or department
        - Always cast month to TEXT: month::text
        
    Employee Target Workload:
        ```sql
        SELECT 
            u.first_name || ' ' || u.last_name AS employee_name,
            COUNT(*) AS total_targets,
            COUNT(CASE WHEN bt.month = date_trunc('month', CURRENT_DATE)::date THEN 1 END) AS current_month_targets,
            SUM(bt.value_of_target) AS total_target_value
        FROM business_target bt
        JOIN users u ON bt.user_id = u.id
        WHERE bt.month >= date_trunc('year', CURRENT_DATE)::date
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY total_target_value DESC
        ```
        
    D. Date-Based Target Queries
    Rules:
        - **CRITICAL**: ALWAYS cast month to TEXT in SELECT: month::text
        - For "current month targets": WHERE bt.month = date_trunc('month', CURRENT_DATE)::date
        - For "quarterly targets": WHERE bt.month >= date_trunc('quarter', CURRENT_DATE)::date
        - For "yearly targets": WHERE bt.month >= date_trunc('year', CURRENT_DATE)::date
        - For "this year": WHERE EXTRACT(year FROM bt.month) = EXTRACT(year FROM CURRENT_DATE)
        
    Current Month Targets:
        ```sql
        SELECT 
            bt.month::text AS target_month,
            u.first_name || ' ' || u.last_name AS employee_name,
            bt.entity_type,
            bt.kpi,
            bt.value_of_target
        FROM business_target bt
        JOIN users u ON bt.user_id = u.id
        WHERE bt.month = date_trunc('month', CURRENT_DATE)::date
        ORDER BY bt.value_of_target DESC
        ```
        
    E. Target Performance Analytics
    Rules:
        - Group targets by entity_type, kpi, or type_of_target for analysis
        - Use SUM, AVG, COUNT for target value aggregations
        - Always include employee names for business context
        - Consider time-based comparisons (month-over-month, year-over-year)
        
    Target Comparison Analysis:
        ```sql
        SELECT 
            bt.entity_type,
            bt.kpi,
            EXTRACT(year FROM bt.month) AS target_year,
            SUM(bt.value_of_target) AS yearly_target_value,
            COUNT(DISTINCT bt.user_id) AS employees_with_targets
        FROM business_target bt
        WHERE bt.month >= CURRENT_DATE - INTERVAL '2 years'
        GROUP BY bt.entity_type, bt.kpi, EXTRACT(year FROM bt.month)
        ORDER BY target_year DESC, yearly_target_value DESC
        ```
    
    F. Business Target Integration with Other Tables
    Rules:
        - For performance analysis, join business_target with policy table to compare targets vs achievements
        - Use opportunity table to track target progress against new business generation
        - Join with users table for employee hierarchy and reporting relationships
        - Consider joining with company table for client-specific targets
        
    Target vs Achievement Analysis:
        ```sql
        SELECT 
            u.first_name || ' ' || u.last_name AS employee_name,
            bt.month::text AS target_month,
            bt.entity_type,
            bt.value_of_target AS target_value,
            COALESCE(SUM(p.gross_premium_amount), 0) AS actual_achievement,
            CASE 
                WHEN bt.value_of_target > 0 THEN 
                    ROUND((COALESCE(SUM(p.gross_premium_amount), 0) / bt.value_of_target * 100)::numeric, 2)
                ELSE 0 
            END AS achievement_percentage
        FROM business_target bt
        JOIN users u ON bt.user_id = u.id
        LEFT JOIN policy p ON p.created_by = bt.user_id 
            AND date_trunc('month', p.created_at) = bt.month
            AND bt.entity_type ILIKE '%premium%'
        WHERE bt.month >= date_trunc('year', CURRENT_DATE)::date
        GROUP BY u.id, u.first_name, u.last_name, bt.month, bt.entity_type, bt.value_of_target
        ORDER BY bt.month DESC, achievement_percentage DESC
        ```

21. DB_SCHEMA:
{load_policy_schema()}

Remember: Always prioritize data accuracy and query efficiency.
You sometimes have to 
    - Generate the SQL query then respond with PolicySuccess
    - Respond with PolicyDirectSuccess in cases where direct answers are needed without SQL, this is purely when you can answer from the user context and message history without querying the DB
    - Respond for the User in cases like greetings or clarifications or out of scope questions with PolicyNaturalResponse
"""

# Create the agent

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
policy_agent = Agent(
    model=GoogleModel(GEMINI_MODEL),
    output_type=PolicyResponse,
    instructions=POLICY_SYSTEM_PROMPT,
)

nudge_agent = Agent(
    model=GoogleModel(GEMINI_MODEL),
    output_type=NudgeResponse,
    system_prompt=POLICY_SYSTEM_PROMPT,
)

@policy_agent.output_validator
def validate_policy_agent_output(ctx: RunContext, output):
    if isinstance(output, PolicyInvalidRequest):
        return output
    
    if isinstance(output, PolicyNaturalResponse):
        return output
    
    if isinstance(output, PolicyDirectSuccess):
        return output

    sql_query = getattr(output, "sql_query", None)
    
    # If no SQL (like greeting), explanation should be empty
    if not sql_query or not sql_query.strip() or sql_query == 'null':
        output.sql_query = None
        # output.explanation = ""
        return output
    
    # Clean SQL
    sql_query = sql_query.replace("\\", "")
    if not (sql_query.strip().upper().startswith("SELECT") or sql_query.strip().upper().startswith("WITH")):
        raise ValueError("Generated SQL must start with SELECT or WITH.")
    output.sql_query = sql_query

    return output

@nudge_agent.output_validator
def validate_nudge_agent_output(ctx: RunContext, output):
    if isinstance(output, PolicyInvalidRequest):
        return output
    sql_query = getattr(output, "sql_query", None)
    
    # If no SQL (like greeting), explanation should be empty
    if not sql_query or not sql_query.strip() or sql_query == 'null':
        output.sql_query = None
        output.explanation = ""
        return output
    
    # Clean SQL
    sql_query = sql_query.replace("\\", "")
    if not (sql_query.strip().upper().startswith("SELECT") or sql_query.strip().upper().startswith("WITH")):
        raise ValueError("Generated SQL must start with SELECT or WITH.")
    output.sql_query = sql_query

    return output

async def generate_policy_query(
    user_prompt: str, relevant_tables: str = "", message_history=None
) -> Dict[str, Any]:
    """Generate SQL query for policy data"""
    try:
        enhanced_prompt = user_prompt
        if relevant_tables.strip():
            enhanced_prompt = f"""
{user_prompt}

FOCUS ON THESE RELEVANT TABLES:
{relevant_tables}

Please prioritize and focus primarily on the tables mentioned above when generating the SQL query. Use these tables as the main source of data and join with other tables only when necessary for the complete answer.
"""
        result = await policy_agent.run(enhanced_prompt, message_history= message_history if message_history else None)

        if isinstance(result.output, PolicySuccess):
            graph_semantics = result.output.graph_semantics
            if graph_semantics is not None and hasattr(graph_semantics, "dict"):
                graph_semantics = graph_semantics.dict()
            logger.info(" PolicySuccess with SQL query generated.")
            return {
                "success": True,
                "sql_query": result.output.sql_query,
                "graph_semantics": graph_semantics,  # or result.output.graph_semantics.dict() if needed
                "error": None,
            }
    
        if isinstance(result.output, PolicyNaturalResponse):
            logger.info("Natural language response generated, no SQL query.")
            return{
                "success": False,
                "data": None,
                "error": result.output.message,
            }
        if isinstance(result.output, PolicyDirectSuccess):
            logger.info("Direct success response generated, no SQL query.")
            return{
                "success": True,
                "explanation": result.output.explanation,
                "sql_query": None,
                "graph_semantics": None,
                "error": None,
            }
            
        else:
            logger.error("Invalid request or error in generating SQL query.")
            # Retry if invalid request, emphasizing query generation
            enhanced_prompt += "\n\nREMINDER: ALWAYS GENERATE A QUERY using ILIKE for partial matches, even if uncertain."
            result = await policy_agent.run(enhanced_prompt, message_history=message_history if message_history else None)
            if isinstance(result.output, PolicySuccess):
                    return {
    "success": True,
    "sql_query": result.output.sql_query,
    "graph_semantics": graph_semantics,  # or result.output.graph_semantics.dict() if needed
    "error": None,
}
            return {
    "success": False,
    "error": result.output.error,
    "sql_query": None,
}

    except Exception as e:
        return {
    "success": False,
    "error": result.output.error,
    "sql_query": None,
}


def fix_sql_literals(sql: str) -> str:
    # Also fix string comparisons inside subqueries for lookup_key and value
    def lookup_subquery_replacer(match):
        key = match.group(2)
        val = match.group(4)
        return f"({match.group(1) if match.group(1) else ''}lookup_key ILIKE '%{key}%' OR {match.group(1) if match.group(1) else ''}lookup_name ILIKE '%{key.replace('_', ' ')}%') AND {match.group(3) if match.group(3) else ''}value ILIKE '%{val}%'"

    sql = re.sub(
        r"(\w+\.)?lookup_key\s*=\s*'([^']+)'\s*AND\s*(\w+\.)?value\s*=\s*'([^']+)'",
        lookup_subquery_replacer,
        sql,
        flags=re.IGNORECASE,
    )
    # Replace WHERE lookup_key = 'category' with OR condition for lookup_name
    sql = re.sub(
        r"WHERE\s+(\w+\.)?lookup_key\s*=\s*'([^']+)'",
        lambda m: f"WHERE (({m.group(1) if m.group(1) else ''}lookup_key ILIKE '%{m.group(2)}%' OR {m.group(1) if m.group(1) else ''}lookup_name ILIKE '%{m.group(2).replace('_', ' ')}%'))",
        sql,
        flags=re.IGNORECASE,
    )
    """
    Ensure SQL string literals use single quotes and ILIKE for text comparisons.
    """
    try:
        # Replace double-quoted strings and date literals with single quotes
        sql = re.sub(r'=\s*"([^"]+)"', r"= '\1'", sql)
        sql = re.sub(r'>\s*"([^"]+)"', r"> '\1'", sql)
        sql = re.sub(r'<\s*"([^"]+)"', r"< '\1'", sql)
        sql = re.sub(r'BETWEEN\s*"([^"]+)"\s*AND\s*"([^"]+)"', r"BETWEEN '\1' AND '\2'", sql, flags=re.IGNORECASE)

        # Fix IN clauses
        sql = re.sub(
            r"IN\s*\(([^)]+)\)",
            lambda m: "IN (" + m.group(1).replace('"', "'") + ")",
            sql,
            flags=re.IGNORECASE,
        )

        # Replace LIKE/ILIKE with single-quoted string literals
        sql = re.sub(r"\bLIKE\s*'([^']+)'", r"ILIKE '\1'", sql, flags=re.IGNORECASE)
        sql = re.sub(r'\bLIKE\s*"([^"]+)"', r"ILIKE '\1'", sql, flags=re.IGNORECASE)
        sql = re.sub(r'\bILIKE\s*"([^"]+)"', r"ILIKE '\1'", sql, flags=re.IGNORECASE)

        # Replace '=' with ILIKE for string columns (policy_name, lookup_key, value, company_name, etc.)
        string_columns = ["policy_name", "lookup_key", "value", "company_name", "display_name"]
        for col in string_columns:
            # Replace: col = 'something' with col ILIKE '%something%'
            sql = re.sub(
                rf"{col}\s*=\s*'([^']+)'",
                lambda m: f"{col} ILIKE '%{m.group(1)}%'",
                sql,
                flags=re.IGNORECASE,
            )

        logger.info(f"SQL after fixing literals: {sql}")
        return sql
    except Exception as e:
        logger.error(f"Error in fix_sql_literals: {str(e)}")
        # If there's an error in the regex, return the original SQL
        return sql

def execute_policy_query(
    sql_query: str, 
    graph_type: str,
    page: int = 1, 
    page_size: int = 10
) -> Dict[str, Any]:
    """Execute SQL query against policy database and return full dataset (no pagination)"""
    try:
        sql_query = fix_sql_literals(sql_query)
        engine = get_database_engine(
            db_host=NL2SQL_DB_HOST,
            db_username=NL2SQL_DB_USERNAME,
            db_password=NL2SQL_DB_PASSWORD,
            db_name=NL2SQL_DB_NAME,
            db_port=NL2SQL_DB_PORT,
            db_ssl=NL2SQL_DB_SSL,
            db_ssl_ca=NL2SQL_DB_SSL_CA
        )

        with Session(engine) as session:
            result = session.exec(text(sql_query))
            data = result.fetchall()
            columns = result.keys()

            df_full = pd.DataFrame(data, columns=columns)
            df_full = convert_decimal_to_float(df_full)

            total_records = len(df_full)

            return {
                "data": df_full.to_dict("records"),
                "columns": list(df_full.columns),
                "row_count": total_records,
                "total_count": total_records,
                "data_full": df_full,   # keep for graph semantics
                "page": None,          # no pagination
                "page_size": None,     # no pagination
            }

    except Exception as e:
        logger.exception("Error executing policy query")
        return {
            "data": [],
            "columns": [],
            "row_count": 0,
            "total_count": 0,
            "page": None,
            "page_size": None,
            "error": str(e),  # ← Return the real DB error (e.g. "relation does not exist")
        }

def adjust_graph_semantics(graph_semantics: Dict[str, Any], df: pd.DataFrame, user_prompt: str) -> Dict[str, Any]:
    if not graph_semantics:
        graph_semantics = {"type": GraphType.raw_table.value}

    if "bar" in user_prompt.lower() or "bar chart" in user_prompt.lower():
        return {
            "type": GraphType.bar.value,
            "x_axis": df.columns[0],
            "y_axis": df.columns[1],
            "title": f"{df.columns[1]} by {df.columns[0]}"
        }

    if "pie" in user_prompt.lower() or "pie chart" in user_prompt.lower():
        return {
            "type": GraphType.pie_chart.value,
            "x_axis": df.columns[0],
            "y_axis": df.columns[1],
            "title": f"Distribution of {df.columns[1]} by {df.columns[0]}"
        }


    row_count, col_count = df.shape

    # --- Pie chart only for small datasets ---
    if 0 < row_count <= 20 and col_count == 2:
        x_axis = df.columns[0]
        y_axis = df.columns[1]
        return {
            "type": GraphType.pie_chart.value,
            "x_axis": x_axis,
            "y_axis": y_axis,
            "title": f"Distribution of {y_axis} by {x_axis}"
        }

    # Scalar → Raw table if >1 col
    if graph_semantics["type"] == GraphType.scalar and col_count > 1:
        graph_semantics["type"] = GraphType.raw_table.value

    # Heuristic: two columns with numeric Y → bar or time-series
    if col_count == 2 and row_count > 1:
        x, y = df.columns[0], df.columns[1]
        if re.search(r"(date|month|year)", x, re.IGNORECASE):
            return {"type": GraphType.time_series.value, "x_axis": x, "y_axis": y}
        elif df[y].dtype in ["int64", "float64"]:
            return {"type": GraphType.bar.value, "x_axis": x, "y_axis": y}

    return graph_semantics

async def run_complete_policy_analysis(
    user_prompt: str, relevant_tables: str = "", message_history=None
) -> Dict[str, Any]:

    query_result = await generate_policy_query(user_prompt, relevant_tables, message_history=message_history)
    base = {
        "user_query": user_prompt,
        "sql_query": query_result.get("sql_query"),
        "graph_semantics": query_result.get("graph_semantics", {}),
        "error": query_result.get("error"),
    }

    logger.info(f"Query Result: {query_result}")
    if not query_result["success"]:
        return {
            **query_result,
            "status_code": 500,
            "execution_success": False,
            "data": [],
            "row_count": 0,
            "column_count": 0,
            "columns": [],
            "total_count": 0,
        }

    generated_sql = None
    generated_graph_semantics = {}
    final_data = None
    final_row_count = 0
    final_columns = []
    try:
        if query_result.get("sql_query"):
            start_time = time.time()
            generated_sql= query_result["sql_query"]
            
            df_result = execute_policy_query(
                query_result["sql_query"],
                query_result.get("graph_semantics", {}).get("type", "raw_table"),
            )
            logger.info(f"DF Result: {df_result}")
            end_time = time.time()
            execution_time_ms = int((end_time - start_time) * 1000)

            # Normal path: valid SQL
            df_full = df_result.get("data_full", pd.DataFrame(df_result.get("data", [])))
            generated_graph_semantics = adjust_graph_semantics(
                query_result.get("graph_semantics", {}),
                df_full,
                user_prompt
            )
            final_data = df_result.get("data", [])
            final_row_count = df_result.get("row_count", 0)
            final_columns = df_result.get("columns", [])

            if final_row_count == 0:
                return {
                    "user_query": user_prompt,
                    "sql_query": query_result.get("sql_query"),
                    "graph_semantics": generated_graph_semantics,
                    "data": [],
                    "row_count": 0,
                    "column_count": len(df_result.get("columns", [])),
                    "columns": df_result.get("columns", []),
                }
                # <<< NEW: Check if execute_policy_query returned an error >>>
            if "error" in df_result and df_result["error"]:
                db_error = df_result["error"]

                print("error in execution:", db_error)
                error_lower = db_error.lower()
                if "relation" in error_lower and "does not exist" in error_lower:
                    friendly_msg = "The table you're asking about doesn't exist or isn't available. Please try rephrasing your question."
                elif "column" in error_lower and "does not exist" in error_lower:
                    friendly_msg = "I made an incorrect assumption while generating the query for your request. Could you please try rephrasing your question? If I continue generating incorrect queries, please check the database schema you provided to ensure it matches your current database structure."
                elif "syntax error" in error_lower:
                    friendly_msg = "There was a syntax issue with the generated query. Please try rephrasing."
                else:
                    friendly_msg = "I encountered an unexpected issue while processing your request. This could be due to query complexity, data constraints, or database connectivity. Please try rephrasing your question or simplifying your request. If issues persist, please verify that the database schema provided matches your current system."

                return {
                    "user_query": user_prompt,
                    "sql_query": query_result.get("sql_query"),
                    "graph_semantics": query_result.get("graph_semantics", {}),
                    "error": friendly_msg,  # This will trigger status: "failure" in the API
                    "data": [],
                    "row_count": 0,
                    "column_count": 0,
                    "columns": [],
                }

        if query_result.get("success") and query_result.get("explanation"):
            explanation = query_result.get("explanation")
            if explanation:
                logger.info(f"Generated Explanation: {explanation}")
            final_data = [explanation] if explanation else []
            final_row_count = 1 
            final_columns = ["explanation"]
            generated_graph_semantics = {
                'type': 'scalar',
                 "x_axis": None,
                "y_axis": None
                
            }
        response = {
            "user_query": user_prompt,
            "sql_query": generated_sql, 
            "graph_semantics": generated_graph_semantics,
            "data": final_data,
            "row_count": final_row_count,
            "column_count": len(final_columns),
            "columns": final_columns,
        }
        logger.info(f"Final Response: {response}")
        return response

    except Exception as e:
        logger.error(f"Unexpected error in policy analysis: {e}", exc_info=e)
        return {
            "user_query": user_prompt,
            "sql_query": query_result.get("sql_query"),
            "error": "An unexpected error occurred while processing your query.",
            "data": [],
            "row_count": 0,
            "column_count": 0,
            "columns": [],
        }

async def generate_nudge_query(
    prompt: str,
    attributes: Dict[str, Any],
    nudge_template: str,
    relevant_tables: str = ""
) -> Dict[str, Any]:
    """Generate SQL query for nudge analysis using the nudge agent"""
    try:
        enhanced_prompt = f"""
        You are a SQL assistant.
        User query: {prompt}
        Tables available: {relevant_tables}

        The expected output should map directly to these attributes: {attributes}

        Instructions:
        - Generate a SQL query that returns results matching these attributes.
        - For range-based attributes (like age), return values for 'greaterthan' and 'lessthan'.
        - Respond only in JSON format that matches the attribute keys.
        - Include a brief explanation of the query.
        """
        result = await nudge_agent.run(enhanced_prompt)
        print(f"Nudge Agent Result: {result}")

        if isinstance(result.output, NudgeSuccess):
            return {
                "success": True,
                "sql_query": result.output.sql_query,
                "explanation": result.output.explanation,
                "error": None,
            }

        # fallback in case agent failed
        enhanced_prompt = prompt + "\n\nREMINDER: ALWAYS generate a valid SQL query using ILIKE for partial matches."
        result = await nudge_agent().run(enhanced_prompt)
        if isinstance(result.output, NudgeSuccess):
            return {
                "success": True,
                "sql_query": result.output.sql_query,
                "explanation": result.output.explanation,
                "error": None,
            }

        return {
            "success": False,
            "sql_query": None,
            "error": result.output.error if hasattr(result.output, "error") else "Unknown agent error",
        }

    except Exception as e:
        return {
            "success": False,
            "sql_query": None,
            "error": f"Agent error: {str(e)}",
        }


async def run_complete_nudge_analysis(
    *,
    prompt: str,
    attributes: Dict[str, Any],
    nudge_template: str,
    relevant_tables: str = ""
) -> Dict[str, Any]:
    """
    Executes a single nudge:
    NL → SQL → DB → structured data
    Returns the row containing the 50% age category.
    """

    # 1️⃣ Generate SQL using nudge agent
    query_result = await generate_nudge_query(
        prompt=prompt,
        attributes=attributes,
        nudge_template=nudge_template,
        relevant_tables=relevant_tables,
    )

    logger.info(f"Nudge Query Result: {query_result}")

    base_response = {
        "user_query": prompt,
        "sql_query": query_result.get("sql_query"),
        "explanation": query_result.get("explanation"),
        "error": query_result.get("error"),
    }

    if not query_result.get("success") or not query_result.get("sql_query"):
        return {**base_response, "data": None, "row_count": 0}

    # 2️⃣ Execute SQL
    try:
        df_result = execute_policy_query(
            query_result["sql_query"],
            graph_type="raw-table",
        )

        # 3️⃣ DB-level error handling
        if df_result.get("error"):
            db_error = df_result["error"].lower()

            if "relation" in db_error and "does not exist" in db_error:
                friendly_msg = "The required table is not available."
            elif "column" in db_error and "does not exist" in db_error:
                friendly_msg = "One of the requested fields does not exist."
            elif "syntax error" in db_error:
                friendly_msg = "Generated query had a syntax issue."
            else:
                friendly_msg = "Unable to execute the query."

            return {**base_response, "error": friendly_msg, "data": None, "row_count": 0}

        # 4️⃣ Process results
        rows = df_result.get("data", [])
        logger.info(f"Rows returned from SQL: {rows}")

        if not rows:
            return {**base_response, "data": None, "row_count": 0}

        # Since the SQL is cumulative, we expect a single row with the 50% age category
        data = rows[0] if isinstance(rows, list) else rows

        return {
            **base_response,
            "data": data,
            "row_count": 1 if data else 0,
        }

    except Exception as e:
        logger.error("Unexpected error in nudge execution", exc_info=e)
        return {
            **base_response,
            "error": "Unexpected error while executing the nudge.",
            "data": None,
            "row_count": 0,
        }
