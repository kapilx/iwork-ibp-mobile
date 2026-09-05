CREATE TABLE task (
    id SERIAL,  -- Auto-incrementing primary key
    task_name VARCHAR(255) NOT NULL,
    activity_id INT NOT NULL,
    company_id INT NOT NULL,
    employee_id INT NOT NULL,
    task_date DATE NOT NULL,
    priority_lid INT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_task PRIMARY KEY (id),
    CONSTRAINT fk_task_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_task_employee FOREIGN KEY (employee_id) REFERENCES employee(id)
);

CREATE TABLE public.task_document_map (
    id SERIAL,
    task_id INT NOT NULL,
    document_id INT NOT NULL,
    -- Constraints
    CONSTRAINT pk_task_document_map PRIMARY KEY (id),
    CONSTRAINT fk_task_document_map_task
        FOREIGN KEY (task_id)
        REFERENCES public.task (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_task_document_map_document
        FOREIGN KEY (document_id)
        REFERENCES public.file_uploads (id)
        ON DELETE CASCADE
);

ALTER TABLE public.task
DROP CONSTRAINT fk_task_employee;

ALTER TABLE public.task
DROP COLUMN employee_id;

ALTER TABLE public.task
ALTER COLUMN activity_id DROP NOT NULL;

ALTER TABLE public.task
ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE public.task
ADD COLUMN opportunity_id integer,
ADD COLUMN assignee_id integer,
ADD COLUMN task_status_lid integer NOT NULL DEFAULT 1,
ADD COLUMN task_type_lid integer NOT NULL DEFAULT 1,
ADD COLUMN task_category_lid integer NOT NULL DEFAULT 1,
ADD COLUMN task_close varchar(20),
ADD COLUMN task_is_editable varchar(20);

ALTER TABLE public.task
ADD CONSTRAINT fk_task_opportunity
FOREIGN KEY (opportunity_id)
REFERENCES public.opportunity (id)
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE public.task
ADD CONSTRAINT fk_task_activity
FOREIGN KEY (activity_id)
REFERENCES public.opportunity_activity_map (id)
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE public.task
ADD CONSTRAINT fk_task_assignee
FOREIGN KEY (assignee_id)
REFERENCES public.users (id)
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE public.task
RENAME COLUMN task_date TO due_date;

// TASK_STATUS
INSERT INTO lookup_data (lookup_name, lookup_key, value_key, value, description, created_by, updated_by, lookup_order)
VALUES
  ('TASK_STATUS', 'TASK_STATUS_ACTIVE', 'ACTIVE', 'active', 'Task status: active', 'Admin', 'Admin',1),
  ('TASK_STATUS', 'TASK_STATUS_CLOSED', 'CLOSED', 'closed', 'Task status: closed', 'Admin', 'Admin',2);


// TASK_CATEGORY
INSERT INTO lookup_data (lookup_name, lookup_key, value_key, value, description, created_by, updated_by)
VALUES
  ('TASK_CATEGORY', 'TASK_CATEGORY_SELF', 'SELF', 'Self', 'Task category: Self', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_CLIENT_CHALLENGES', 'CLIENT_CHALLENGES', 'Client Challenges', 'Task category: Client Challenges', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_MOM_TASK', 'MOM_TASK', 'MOM Task', 'Task category: MOM Task', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_APPROVAL', 'APPROVAL', 'Approval', 'Task category: Approval', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_ACTIVITY', 'ACTIVITY', 'Activity', 'Task category: Activity', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_ASSIGNED', 'ASSIGNED', 'Assigned', 'Task category: Assigned', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_PLANNING', 'PLANNING', 'Planning', 'Task category: Planning', 'Admin', 'Admin'),
  ('TASK_CATEGORY', 'TASK_CATEGORY_FOLLOW_UP', 'FOLLOW_UP', 'Follow up', 'Task category: Follow up', 'Admin', 'Admin');


// TASK_TYPE
INSERT INTO lookup_data (lookup_name, lookup_key, value_key, value, description, created_by, updated_by, lookup_order)
VALUES
  ('TASK_TYPE', 'TASK_TYPE_SELF', 'SELF', 'Self', 'Task type: Self', 'Admin', 'Admin',1),
  ('TASK_TYPE', 'TASK_TYPE_ASSIGNED', 'ASSIGNED', 'assigned', 'Task type: Assigned', 'Admin', 'Admin',2),
  ('TASK_TYPE', 'TASK_TYPE_AI_CREATED', 'AI_CREATED', 'ai_created', 'Task type: AI Created', 'Admin', 'Admin',3);

----------

ALTER TABLE public.task
DROP COLUMN IF EXISTS task_category_lid;