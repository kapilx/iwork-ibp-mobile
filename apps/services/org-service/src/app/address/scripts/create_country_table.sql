CREATE TABLE country (
    id SERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    iso_code VARCHAR(10),
    region_id INT NOT NULL,
    CONSTRAINT pk_country_id PRIMARY KEY (id),
    CONSTRAINT fk_country_region FOREIGN KEY (region_id) REFERENCES region(id)
);
CREATE INDEX idx_country_name ON country(name);
CREATE INDEX idx_country_region_id ON country(region_id);


INSERT INTO country (name, iso_code, region_id) VALUES ('India', NULL, 4);
INSERT INTO country (name, iso_code, region_id) VALUES ('Japan', NULL, 4);
INSERT INTO country (name, iso_code, region_id) VALUES ('Singapore', NULL, 4);
INSERT INTO country (name, iso_code, region_id) VALUES ('South Africa', NULL, 2);
INSERT INTO country (name, iso_code, region_id) VALUES ('Thailand', NULL, 2);
INSERT INTO country (name, iso_code, region_id) VALUES ('United Kingdom', NULL, 1);
INSERT INTO country (name, iso_code, region_id) VALUES ('United States of America', NULL, 3);