CREATE TABLE policy_enrollment_template_doc_map (
    id SERIAL,
    policy_id INT NOT NULL,
    document_id INT NOT NULL,
    CONSTRAINT pk_policy_enrollment_template_doc_map PRIMARY KEY (id),
    CONSTRAINT fk_petdm_policy FOREIGN KEY (policy_id) REFERENCES policy(id) ON DELETE CASCADE,
    CONSTRAINT fk_petdm_document FOREIGN KEY (document_id) REFERENCES file_uploads(id) ON DELETE CASCADE
);
