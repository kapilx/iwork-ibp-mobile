-- Create user_account_security_status table
-- Tracks account security status including failed login attempts and lockout state
-- Mutable - updated with each authentication attempt

CREATE TABLE user_account_security_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    failed_attempt_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    last_failure_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);
