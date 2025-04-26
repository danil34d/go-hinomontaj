-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    client_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы услуг
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_individual INTEGER NOT NULL,
    price_company INTEGER NOT NULL
);

-- Создание таблицы связи заказов с услугами
CREATE TABLE IF NOT EXISTS order_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    wheel_position TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_number ON orders(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_services_order_id ON order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_order_services_service_id ON order_services(service_id);

-- Вставка базовых услуг
INSERT OR IGNORE INTO services (name, price_individual, price_company) VALUES
    ('Снятие колеса с автомобиля 19.5 - 22.5', 500, 400),
    ('Установка колеса на автомобиль 19.5 - 22.5', 500, 400),
    ('Снятие сдвоенных колес с автомобиля 19.5 - 22.5', 800, 600),
    ('Установка сдвоенных колес на автомобиль 19.5 - 22.5', 800, 600),
    ('Демонтаж, снятие шины с диска 19.5 - 22.5', 300, 250),
    ('Монтаж, установка шины на диск 19.5 - 22.5', 300, 250),
    ('Балансировка колеса 17.5-24 дюйма (включая грузики)', 400, 350),
    ('Установка заплаты тип 1', 500, 400),
    ('Установка грибка, диаметр до 10 мм (Российск.)', 300, 250); 