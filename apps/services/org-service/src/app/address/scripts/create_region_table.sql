CREATE TABLE region (
    id SERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    CONSTRAINT pk_region_id PRIMARY KEY (id)
);
CREATE INDEX idx_region_name ON region(name);

INSERT INTO region (name, description) VALUES ('North', 'North');
INSERT INTO region (name, description) VALUES ('South', 'South');
INSERT INTO region (name, description) VALUES ('West', 'West');
INSERT INTO region (name, description) VALUES ('East', 'East');