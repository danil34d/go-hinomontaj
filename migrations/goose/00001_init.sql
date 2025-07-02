-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    salary_schema VARCHAR(20),
    tmp_salary INTEGER NOT NULL,
    has_car BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onliene_date ( -- онлайн-запись
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    car_number VARCHAR(20) NOT NULL,
    client_description TEXT,  -- заявка клиента(его просьбы итд)
    manager_description TEXT, -- для пометок менеджера
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    number VARCHAR(255) NOT NULL,
    description TEXT,
    client_type VARCHAR(50) NOT NULL,
    client_company_name VARCHAR(255) NOT NULL,
    client_company_address VARCHAR(255) NOT NULL,
    client_company_phone VARCHAR(20) NOT NULL,
    client_company_email VARCHAR(255) NOT NULL,
    client_company_inn VARCHAR(20) NOT NULL,
    client_company_kpp VARCHAR(20) NOT NULL,
    client_company_ogrn VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_card (
    id SERIAL PRIMARY KEY,
    "Rs25"       int,       
	"R19"        int,       
	"R20"        int,       
	"R25"        int,       
	"R251"       int,       
	"R13"        int,      
	"R15"        int,      
	"Foot9"      int,       
	"Foot12"     int,       
	"Foot15"     int,       
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    manager_phone VARCHAR(20) NOT NULL,
    client_type VARCHAR(50) NOT NULL,
    contract_id INTEGER REFERENCES contracts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(255),
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients_cars (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, car_id)
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    contract_id int NOT NULL REFERENCES contracts(id),
    material_card int NOT NULL REFERENCES material_card(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_services (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    service_description TEXT,
    wheel_position VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage ( -- склад
    id SERIAL PRIMARY KEY,
    "Rs25"       int DEFAULT 0,       
	"R19"        int DEFAULT 0,       
	"R20"        int DEFAULT 0,       
	"R25"        int DEFAULT 0,       
	"R251"       int DEFAULT 0,       
	"R13"        int DEFAULT 0,      
	"R15"        int DEFAULT 0,      
	"Foot9"      int DEFAULT 0,       
	"Foot12"     int DEFAULT 0,       
	"Foot15"     int DEFAULT 0,       
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_delivery ( -- поставка материалов
    id SERIAL PRIMARY KEY,
    "Rs25"       int,       
	"R19"        int,       
	"R20"        int,       
	"R25"        int,       
	"R251"       int,       
	"R13"        int,      
	"R15"        int,      
	"Foot9"      int,       
	"Foot12"     int,       
	"Foot15"     int,       
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cars_number ON cars(number);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_number ON orders(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON orders(worker_id);

-- Добавляем начальную запись в storage
INSERT INTO storage ("Rs25", "R19", "R20", "R25", "R251", "R13", "R15", "Foot9", "Foot12", "Foot15") 
VALUES (0, 0, 0, 0, 0, 0, 0, 0, 0, 0) 
ON CONFLICT DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS order_services;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS clients_cars;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS material_card;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS workers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS material_delivery;
DROP TABLE IF EXISTS storage;
DROP TABLE IF EXISTS onliene_date;
-- +goose StatementEnd 