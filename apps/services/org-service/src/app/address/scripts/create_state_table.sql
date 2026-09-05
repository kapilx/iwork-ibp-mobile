CREATE TABLE state (
    id SERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    country_id INT NOT NULL,
    CONSTRAINT pk_state_id PRIMARY KEY (id),
    CONSTRAINT fk_state_country FOREIGN KEY (country_id) REFERENCES country(id)
);
CREATE INDEX idx_state_name ON state(name);
CREATE INDEX idx_state_country_id ON state(country_id);




INSERT INTO state (name, state_code, country_id) VALUES 
('Andhra Pradesh', 'AP', 1),
('Arunachal Pradesh', 'AR', 1),
('Assam', 'AS', 1),
('Bihar', 'BR', 1),
('Chhattisgarh', 'CG', 1),
('Goa', 'GA', 1),
('Gujarat', 'GJ', 1),
('Haryana', 'HR', 1),
('Himachal Pradesh', 'HP', 1),
('Jharkhand', 'JH', 1),
('Karnataka', 'KA', 1),
('Kerala', 'KL', 1),
('Madhya Pradesh', 'MP', 1),
('Maharashtra', 'MH', 1),
('Manipur', 'MN', 1),
('Meghalaya', 'ML', 1),
('Mizoram', 'MZ', 1),
('Nagaland', 'NL', 1),
('Odisha', 'OD', 1),
('Punjab', 'PB', 1),
('Rajasthan', 'RJ', 1),
('Sikkim', 'SK', 1),
('Tamil Nadu', 'TN', 1),
('Telangana', 'TG', 1),
('Tripura', 'TR', 1),
('Uttar Pradesh', 'UP', 1),
('Uttarakhand', 'UK', 1),
('West Bengal', 'WB', 1);
