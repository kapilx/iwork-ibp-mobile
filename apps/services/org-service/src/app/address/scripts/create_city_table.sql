CREATE TABLE city (
    id SERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    CONSTRAINT pk_city_id PRIMARY KEY (id),
    CONSTRAINT fk_city_state FOREIGN KEY (state_id) REFERENCES state(id)
);
CREATE INDEX idx_city_name ON city(name);
CREATE INDEX idx_city_state_id ON city(state_id);



INSERT INTO city (name, state_id) VALUES 
-- Andhra Pradesh
('Visakhapatnam', 1),
('Vijayawada', 1),
('Guntur', 1),
-- Arunachal Pradesh
('Itanagar', 2),
('Naharlagun', 2),
-- Assam
('Guwahati', 3),
('Silchar', 3),
-- Bihar
('Patna', 4),
('Gaya', 4),
-- Chhattisgarh
('Raipur', 5),
('Bhilai', 5),
-- Goa
('Panaji', 6),
('Margao', 6),
-- Gujarat
('Ahmedabad', 7),
('Surat', 7),
('Vadodara', 7),
-- Haryana
('Faridabad', 8),
('Gurugram', 8),
-- Himachal Pradesh
('Shimla', 9),
('Manali', 9),
-- Jharkhand
('Ranchi', 10),
('Jamshedpur', 10),
-- Karnataka
('Bengaluru', 11),
('Mysuru', 11),
-- Kerala
('Thiruvananthapuram', 12),
('Kochi', 12),
-- Madhya Pradesh
('Bhopal', 13),
('Indore', 13),
-- Maharashtra
('Mumbai', 14),
('Pune', 14),
('Nagpur', 14),
-- Manipur
('Imphal', 15),
-- Meghalaya
('Shillong', 16),
-- Mizoram
('Aizawl', 17),
-- Nagaland
('Kohima', 18),
('Dimapur', 18),
-- Odisha
('Bhubaneswar', 19),
('Cuttack', 19),
-- Punjab
('Ludhiana', 20),
('Amritsar', 20),
-- Rajasthan
('Jaipur', 21),
('Jodhpur', 21),
-- Sikkim
('Gangtok', 22),
-- Tamil Nadu
('Chennai', 23),
('Coimbatore', 23),
-- Telangana
('Hyderabad', 24),
('Warangal', 24),
-- Tripura
('Agartala', 25),
-- Uttar Pradesh
('Lucknow', 26),
('Kanpur', 26),
-- Uttarakhand
('Dehradun', 27),
('Haridwar', 27),
-- West Bengal
('Kolkata', 28),
('Darjeeling', 28);
