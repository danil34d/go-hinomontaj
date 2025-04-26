package database

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() error {
	var err error
	DB, err = sql.Open("sqlite3", "./shinomontazh.db")
	if err != nil {
		return err
	}

	// Создаем таблицу services, если она не существует
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS services (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			price_individual REAL NOT NULL,
			price_company REAL NOT NULL
		)
	`)
	if err != nil {
		return err
	}

	// Создаем таблицу orders, если она не существует
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			vehicle_number TEXT NOT NULL,
			payment_method TEXT NOT NULL,
			client_type TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Создаем таблицу order_services для связи заказов и услуг
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS order_services (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			order_id INTEGER NOT NULL,
			service_id INTEGER NOT NULL,
			wheel_position TEXT NOT NULL,
			FOREIGN KEY (order_id) REFERENCES orders(id),
			FOREIGN KEY (service_id) REFERENCES services(id)
		)
	`)
	if err != nil {
		return err
	}

	// Добавляем базовые услуги, если их нет
	_, err = DB.Exec(`
		INSERT OR IGNORE INTO services (name, price_individual, price_company) VALUES
		('Снятие колеса с автомобиля 19.5 - 22.5', 500, 450),
		('Установка колеса на автомобиль 19.5 - 22.5', 500, 450),
		('Снятие сдвоенных колес с автомобиля 19.5 - 22.5', 1000, 900),
		('Установка сдвоенных колес на автомобиль 19.5 - 22.5', 1000, 900),
		('Демонтаж, снятие шины с диска 19.5 - 22.5', 500, 450),
		('Монтаж, установка шины на диск 19.5 - 22.5', 500, 450),
		('Балансировка колеса 17.5-24 дюйма (включая грузики)', 500, 450),
		('Установка заплаты тип 1', 1000, 900),
		('Установка грибка, диаметр до 10 мм (Российск.)', 500, 450)
	`)
	if err != nil {
		return err
	}

	return nil
}
