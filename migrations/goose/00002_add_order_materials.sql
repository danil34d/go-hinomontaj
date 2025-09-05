-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS order_materials (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES material(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, material_id)
);

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_order_materials_order_id ON order_materials(order_id);
CREATE INDEX IF NOT EXISTS idx_order_materials_material_id ON order_materials(material_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS order_materials;
-- +goose StatementEnd