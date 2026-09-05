-- Initial cron job configurations for opportunity-related schedulers
-- Insert these records manually before starting the application
INSERT INTO
    cron_jobs_configuration (
        job_key,
        job_name,
        cron_expression,
        is_enabled,
        description,
        created_by,
        created_at,
        updated_at
    )
VALUES
    (
        'HANDLE_EXPIRED_OPPORTUNITIES',
        'Handle Expired Opportunities',
        '30 21 * * *',
        true,
        'Marks expired opportunities as lost and creates renewal opportunities. Runs daily at 09:30 PM UTC (03:00 AM IST)',
        1,
        NOW(),
        NOW()
    ),
    (
        'HANDLE_OPPORTUNITY_ACTIVITIES_CLOSE_TO_EXPIRY',
        'Handle Opportunity Activities Close to Expiry',
        '30 22 * * *',
        true,
        'Monitors expired activities and sends notifications to owners/creators. Runs daily at 10:30 PM UTC (04:00 AM IST)',
        1,
        NOW(),
        NOW()
    ) ON CONFLICT (job_key) DO NOTHING;