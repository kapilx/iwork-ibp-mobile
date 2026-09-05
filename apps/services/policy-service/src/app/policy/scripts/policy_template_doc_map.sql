CREATE TABLE policy_configuration_template_doc_map (
    id SERIAL,
    policy_id INT NOT NULL,
    document_id INT NOT NULL,
    CONSTRAINT pk_policy_template_doc_map PRIMARY KEY (id),
    CONSTRAINT fk_policy_template_doc_map_policy FOREIGN KEY (policy_id) REFERENCES policy(id) ON DELETE CASCADE,
    CONSTRAINT fk_policy_template_doc_map_document FOREIGN KEY (document_id) REFERENCES file_uploads(id) ON DELETE CASCADE
);
