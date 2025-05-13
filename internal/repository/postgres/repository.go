package postgres

import (
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(user models.User) (int, error) {
	var id int
	query := `
		INSERT INTO users (name, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	logger.Debug("Создание нового пользователя с email: %s", user.Email)
	err := r.db.QueryRow(query, user.Name, user.Email, user.Password, user.Role).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании пользователя: %v", err)
		return 0, fmt.Errorf("ошибка при создании пользователя: %w", err)
	}

	logger.Info("Пользователь успешно создан с ID: %d", id)
	return id, nil
}

func (r *Repository) GetUser(email string) (models.User, error) {
	var user models.User
	query := `
		SELECT id, name, email, password_hash, role
		FROM users
		WHERE email = $1`

	logger.Debug("Поиск пользователя по email: %s", email)
	err := r.db.Get(&user, query, email)
	if err != nil {
		logger.Error("Ошибка при получении пользователя: %v", err)
		return models.User{}, fmt.Errorf("ошибка при получении пользователя: %w", err)
	}

	logger.Debug("Пользователь найден: %v", user)
	return user, nil
}

func (r *Repository) GetUserById(id int) (models.User, error) {
	var user models.User
	query := `
		SELECT id, name, email, password_hash, role
		FROM users
		WHERE id = $1`

	logger.Debug("Поиск пользователя по ID: %d", id)
	err := r.db.Get(&user, query, id)
	if err != nil {
		logger.Error("Ошибка при получении пользователя по ID: %v", err)
		return models.User{}, fmt.Errorf("ошибка при получении пользователя: %w", err)
	}

	logger.Debug("Пользователь найден: %v", user)
	return user, nil
}

func (r *Repository) CreateWorker(worker models.Worker) (int, error) {
	var id int
	query := `
		INSERT INTO workers (name, surname, salary)
		VALUES ($1, $2, $3)
		RETURNING id`

	logger.Debug("Создание нового работника: %s %s", worker.Name, worker.Surname)
	err := r.db.QueryRow(query, worker.Name, worker.Surname, worker.Salary).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании работника: %v", err)
		return 0, fmt.Errorf("ошибка при создании работника: %w", err)
	}

	logger.Info("Работник успешно создан с ID: %d", id)
	return id, nil
}

func (r *Repository) GetAllWorkers() ([]models.Worker, error) {
	var workers []models.Worker
	query := `
		SELECT id, name, surname, salary, created_at, updated_at
		FROM workers`

	logger.Debug("Получение списка всех работников")
	err := r.db.Select(&workers, query)
	if err != nil {
		logger.Error("Ошибка при получении списка работников: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка работников: %w", err)
	}

	logger.Debug("Получено работников: %d", len(workers))
	return workers, nil
}

func (r *Repository) GetWorkerById(id int) (models.Worker, error) {
	var worker models.Worker
	query := `
		SELECT id, name, surname, salary, created_at, updated_at
		FROM workers
		WHERE id = $1`

	logger.Debug("Поиск работника по ID: %d", id)
	err := r.db.Get(&worker, query, id)
	if err != nil {
		logger.Error("Ошибка при получении работника по ID: %v", err)
		return models.Worker{}, fmt.Errorf("ошибка при получении работника: %w", err)
	}

	logger.Debug("Работник найден: %v", worker)
	return worker, nil
}

func (r *Repository) UpdateWorker(id int, worker models.Worker) error {
	query := `
		UPDATE workers
		SET name = $1, surname = $2, salary = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4`

	logger.Debug("Обновление данных работника ID: %d", id)
	result, err := r.db.Exec(query, worker.Name, worker.Surname, worker.Salary, id)
	if err != nil {
		logger.Error("Ошибка при обновлении работника: %v", err)
		return fmt.Errorf("ошибка при обновлении работника: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("работник с ID %d не найден", id)
	}

	logger.Info("Данные работника успешно обновлены")
	return nil
}

func (r *Repository) DeleteWorker(id int) error {
	query := `DELETE FROM workers WHERE id = $1`

	logger.Debug("Удаление работника ID: %d", id)
	result, err := r.db.Exec(query, id)
	if err != nil {
		logger.Error("Ошибка при удалении работника: %v", err)
		return fmt.Errorf("ошибка при удалении работника: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("работник с ID %d не найден", id)
	}

	logger.Info("Работник успешно удален")
	return nil
}

func (r *Repository) CreateClient(client models.Client) (int, error) {
	var id int
	query := `
		INSERT INTO clients (name, client_type)
		VALUES ($1, $2)
		RETURNING id`

	logger.Debug("Создание нового клиента: %s", client.Name)
	err := r.db.QueryRow(query, client.Name, client.ClientType).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании клиента: %v", err)
		return 0, fmt.Errorf("ошибка при создании клиента: %w", err)
	}

	logger.Info("Клиент успешно создан с ID: %d", id)
	return id, nil
}

func (r *Repository) GetAllClients() ([]models.Client, error) {
	var clients []models.Client
	query := `
		SELECT c.id, c.name, c.client_type, c.created_at, c.updated_at,
			   COALESCE(array_remove(array_agg(cars.number), NULL), ARRAY[]::varchar[]) as car_numbers
		FROM clients c
		LEFT JOIN clients_cars cc ON c.id = cc.client_id
		LEFT JOIN cars ON cc.car_id = cars.id
		GROUP BY c.id, c.name, c.client_type, c.created_at, c.updated_at`

	logger.Debug("Получение списка всех клиентов")
	err := r.db.Select(&clients, query)
	if err != nil {
		logger.Error("Ошибка при получении списка клиентов: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка клиентов: %w", err)
	}

	logger.Debug("Получено клиентов: %d", len(clients))
	return clients, nil
}

func (r *Repository) GetClientById(id int) (models.Client, error) {
	var client models.Client
	query := `
		SELECT c.id, c.name, c.client_type, c.created_at, c.updated_at,
			   array_agg(cars.number) as car_numbers
		FROM clients c
		LEFT JOIN clients_cars cc ON c.id = cc.client_id
		LEFT JOIN cars ON cc.car_id = cars.id
		WHERE c.id = $1
		GROUP BY c.id, c.name, c.client_type, c.created_at, c.updated_at`

	logger.Debug("Поиск клиента по ID: %d", id)
	err := r.db.Get(&client, query, id)
	if err != nil {
		logger.Error("Ошибка при получении клиента по ID: %v", err)
		return models.Client{}, fmt.Errorf("ошибка при получении клиента: %w", err)
	}

	logger.Debug("Клиент найден: %v", client)
	return client, nil
}

func (r *Repository) GetClientCars(clientId int) ([]models.Car, error) {
	var cars []models.Car
	query := `
		SELECT c.id, c.number, c.model, c.year, c.created_at, c.updated_at
		FROM cars c
		JOIN clients_cars cc ON c.id = cc.car_id
		WHERE cc.client_id = $1
		ORDER BY c.created_at DESC`

	logger.Debug("Получение автомобилей клиента ID:%d", clientId)
	err := r.db.Select(&cars, query, clientId)
	if err != nil {
		logger.Error("Ошибка при получении автомобилей клиента: %v", err)
		return nil, fmt.Errorf("ошибка при получении автомобилей клиента: %w", err)
	}

	logger.Debug("Получено автомобилей: %d", len(cars))
	return cars, nil
}

func (r *Repository) AddCarToClient(clientId int, car models.Car) error {
	tx, err := r.db.Begin()
	if err != nil {
		logger.Error("Ошибка при начале транзакции: %v", err)
		return fmt.Errorf("ошибка при начале транзакции: %w", err)
	}
	defer tx.Rollback()

	// Создаем запись автомобиля
	query := `
		INSERT INTO cars (number, model, year, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id`

	var carId int
	err = tx.QueryRow(query, car.Number, car.Model, car.Year).Scan(&carId)
	if err != nil {
		logger.Error("Ошибка при создании автомобиля: %v", err)
		return fmt.Errorf("ошибка при создании автомобиля: %w", err)
	}

	// Связываем автомобиль с клиентом
	query = `
		INSERT INTO clients_cars (client_id, car_id)
		VALUES ($1, $2)`

	_, err = tx.Exec(query, clientId, carId)
	if err != nil {
		logger.Error("Ошибка при связывании автомобиля с клиентом: %v", err)
		return fmt.Errorf("ошибка при связывании автомобиля с клиентом: %w", err)
	}

	if err = tx.Commit(); err != nil {
		logger.Error("Ошибка при завершении транзакции: %v", err)
		return fmt.Errorf("ошибка при завершении транзакции: %w", err)
	}

	logger.Info("Успешно добавлен автомобиль ID:%d клиенту ID:%d", carId, clientId)
	return nil
}

func (r *Repository) UpdateClient(id int, client models.Client) error {
	query := `
		UPDATE clients
		SET name = $1, client_type = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3`

	logger.Debug("Обновление данных клиента ID: %d", id)
	result, err := r.db.Exec(query, client.Name, client.ClientType, id)
	if err != nil {
		logger.Error("Ошибка при обновлении клиента: %v", err)
		return fmt.Errorf("ошибка при обновлении клиента: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("клиент с ID %d не найден", id)
	}

	logger.Info("Данные клиента успешно обновлены")
	return nil
}

func (r *Repository) DeleteClient(id int) error {
	query := `DELETE FROM clients WHERE id = $1`

	logger.Debug("Удаление клиента ID: %d", id)
	result, err := r.db.Exec(query, id)
	if err != nil {
		logger.Error("Ошибка при удалении клиента: %v", err)
		return fmt.Errorf("ошибка при удалении клиента: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("клиент с ID %d не найден", id)
	}

	logger.Info("Клиент успешно удален")
	return nil
}

func (r *Repository) CreateService(service models.Service) (int, error) {
	var id int
	query := `
		INSERT INTO services (name, client_type, price)
		VALUES ($1, $2, $3)
		RETURNING id`

	logger.Debug("Создание новой услуги: %s", service.Name)
	err := r.db.QueryRow(query, service.Name, service.ClientType, service.Price).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании услуги: %v", err)
		return 0, fmt.Errorf("ошибка при создании услуги: %w", err)
	}

	logger.Info("Услуга успешно создана с ID: %d", id)
	return id, nil
}

func (r *Repository) GetAllServices() ([]models.Service, error) {
	var services []models.Service
	query := `
		SELECT id, name, client_type, price, created_at, updated_at
		FROM services`

	logger.Debug("Получение списка всех услуг")
	err := r.db.Select(&services, query)
	if err != nil {
		logger.Error("Ошибка при получении списка услуг: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка услуг: %w", err)
	}

	logger.Debug("Получено услуг: %d", len(services))
	return services, nil
}

func (r *Repository) UpdateService(id int, service models.Service) error {
	query := `
		UPDATE services
		SET name = $1, client_type = $2, price = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4`

	logger.Debug("Обновление данных услуги ID: %d", id)
	result, err := r.db.Exec(query, service.Name, service.ClientType, service.Price, id)
	if err != nil {
		logger.Error("Ошибка при обновлении услуги: %v", err)
		return fmt.Errorf("ошибка при обновлении услуги: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("услуга с ID %d не найдена", id)
	}

	logger.Info("Данные услуги успешно обновлены")
	return nil
}

func (r *Repository) DeleteService(id int) error {
	query := `DELETE FROM services WHERE id = $1`

	logger.Debug("Удаление услуги ID: %d", id)
	result, err := r.db.Exec(query, id)
	if err != nil {
		logger.Error("Ошибка при удалении услуги: %v", err)
		return fmt.Errorf("ошибка при удалении услуги: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("услуга с ID %d не найдена", id)
	}

	logger.Info("Услуга успешно удалена")
	return nil
}

func (r *Repository) CreateOrder(order models.Order) (int, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("ошибка при начале транзакции: %w", err)
	}
	defer tx.Rollback()

	var orderId int
	query := `
		INSERT INTO orders (worker_id, client_id, vehicle_number, payment_method, total_amount)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	logger.Debug("Создание нового заказа")
	err = tx.QueryRow(query, order.WorkerID, order.ClientID, order.VehicleNumber, order.PaymentMethod, order.TotalAmount).Scan(&orderId)
	if err != nil {
		logger.Error("Ошибка при создании заказа: %v", err)
		return 0, fmt.Errorf("ошибка при создании заказа: %w", err)
	}

	// Добавляем услуги к заказу
	if order.Services != nil {
		for _, service := range order.Services {
			if service.ServiceID == 0 {
				return 0, fmt.Errorf("не указан ID услуги")
			}
			if service.Description == "" {
				return 0, fmt.Errorf("не указано описание услуги")
			}
			if service.Price <= 0 {
				return 0, fmt.Errorf("неверная цена услуги")
			}

			_, err = tx.Exec(`
				INSERT INTO order_services (order_id, service_id, service_description, wheel_position, price)
				VALUES ($1, $2, $3, $4, $5)`,
				orderId, service.ServiceID, service.Description, service.WheelPosition, service.Price)
			if err != nil {
				logger.Error("Ошибка при добавлении услуги к заказу: %v", err)
				return 0, fmt.Errorf("ошибка при добавлении услуги к заказу: %w", err)
			}
		}
	}

	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("ошибка при коммите транзакции: %w", err)
	}

	logger.Info("Заказ успешно создан с ID: %d", orderId)
	return orderId, nil
}

func (r *Repository) GetAllOrders() ([]models.Order, error) {
	var orders []models.Order
	query := `
		SELECT o.id, o.worker_id, o.client_id, o.vehicle_number, o.payment_method, o.total_amount,
			   o.created_at, o.updated_at
		FROM orders o`

	logger.Debug("Получение списка всех заказов")
	err := r.db.Select(&orders, query)
	if err != nil {
		logger.Error("Ошибка при получении списка заказов: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка заказов: %w", err)
	}

	// Для каждого заказа получаем его услуги
	for i := range orders {
		services, err := r.getOrderServices(orders[i].ID)
		if err != nil {
			return nil, err
		}
		orders[i].Services = services
	}

	logger.Debug("Получено заказов: %d", len(orders))
	return orders, nil
}

func (r *Repository) GetOrdersByWorkerId(workerId int) ([]models.Order, error) {
	var orders []models.Order
	query := `
		SELECT o.id, o.worker_id, o.client_id, o.vehicle_number, o.payment_method, o.total_amount,
			   o.created_at, o.updated_at
		FROM orders o
		WHERE o.worker_id = $1`

	logger.Debug("Получение заказов для работника ID: %d", workerId)
	err := r.db.Select(&orders, query, workerId)
	if err != nil {
		logger.Error("Ошибка при получении заказов работника: %v", err)
		return nil, fmt.Errorf("ошибка при получении заказов работника: %w", err)
	}

	// Для каждого заказа получаем его услуги
	for i := range orders {
		services, err := r.getOrderServices(orders[i].ID)
		if err != nil {
			return nil, err
		}
		orders[i].Services = services
	}

	logger.Debug("Получено заказов: %d", len(orders))
	return orders, nil
}

func (r *Repository) UpdateOrder(id int, order models.Order) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("ошибка при начале транзакции: %w", err)
	}
	defer tx.Rollback()

	// Обновляем основную информацию о заказе
	query := `
		UPDATE orders
		SET worker_id = $1, client_id = $2, vehicle_number = $3, payment_method = $4, total_amount = $5,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $6`

	logger.Debug("Обновление данных заказа ID: %d", id)
	result, err := tx.Exec(query, order.WorkerID, order.ClientID, order.VehicleNumber, order.PaymentMethod, order.TotalAmount, id)
	if err != nil {
		logger.Error("Ошибка при обновлении заказа: %v", err)
		return fmt.Errorf("ошибка при обновлении заказа: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("заказ с ID %d не найден", id)
	}

	// Удаляем старые услуги
	_, err = tx.Exec("DELETE FROM order_services WHERE order_id = $1", id)
	if err != nil {
		logger.Error("Ошибка при удалении старых услуг заказа: %v", err)
		return fmt.Errorf("ошибка при удалении старых услуг заказа: %w", err)
	}

	// Добавляем новые услуги
	for _, service := range order.Services {
		_, err = tx.Exec(`
			INSERT INTO order_services (order_id, service_id, service_description, wheel_position, price)
			VALUES ($1, $2, $3, $4, $5)`,
			id, service.ServiceID, service.Description, service.WheelPosition, service.Price)
		if err != nil {
			logger.Error("Ошибка при добавлении услуги к заказу: %v", err)
			return fmt.Errorf("ошибка при добавлении услуги к заказу: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("ошибка при коммите транзакции: %w", err)
	}

	logger.Info("Заказ успешно обновлен")
	return nil
}

func (r *Repository) DeleteOrder(id int) error {
	query := `DELETE FROM orders WHERE id = $1`

	logger.Debug("Удаление заказа ID: %d", id)
	result, err := r.db.Exec(query, id)
	if err != nil {
		logger.Error("Ошибка при удалении заказа: %v", err)
		return fmt.Errorf("ошибка при удалении заказа: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("заказ с ID %d не найден", id)
	}

	logger.Info("Заказ успешно удален")
	return nil
}

func (r *Repository) GetOrderStatistics() (models.Statistics, error) {
	var stats models.Statistics

	// Получаем общую статистику по заказам
	err := r.db.Get(&stats, `
		SELECT 
			COUNT(*) as total_orders,
			COALESCE(SUM(total_amount), 0) as total_revenue,
			COUNT(DISTINCT worker_id) as total_workers,
			COUNT(DISTINCT client_id) as total_clients,
			COALESCE(AVG(total_amount), 0) as average_order_value
		FROM orders`)
	if err != nil {
		logger.Error("Ошибка при получении общей статистики: %v", err)
		return models.Statistics{}, fmt.Errorf("ошибка при получении статистики: %w", err)
	}

	logger.Info("Статистика успешно получена")
	return stats, nil
}

// Вспомогательная функция для получения услуг заказа
func (r *Repository) getOrderServices(orderId int) ([]models.OrderService, error) {
	var services []models.OrderService
	query := `
		SELECT service_id, service_description, wheel_position, price
		FROM order_services
		WHERE order_id = $1`

	err := r.db.Select(&services, query, orderId)
	if err != nil {
		logger.Error("Ошибка при получении услуг заказа %d: %v", orderId, err)
		return nil, fmt.Errorf("ошибка при получении услуг заказа: %w", err)
	}

	return services, nil
}

func (r *Repository) GetClientTypes() ([]string, error) {
	var types []string
	query := `SELECT DISTINCT client_type FROM clients ORDER BY client_type`

	logger.Debug("Получение списка типов клиентов из БД")
	err := r.db.Select(&types, query)
	if err != nil {
		logger.Error("Ошибка при получении типов клиентов: %v", err)
		return nil, fmt.Errorf("ошибка при получении типов клиентов: %w", err)
	}

	logger.Debug("Получено типов клиентов: %d", len(types))
	return types, nil
}

func (r *Repository) GetWorkerByName(name string) (models.Worker, error) {
	var worker models.Worker
	query := `
		SELECT id, name, surname, salary, created_at, updated_at
		FROM workers
		WHERE name = $1`

	logger.Debug("Поиск работника по имени: %s", name)
	logger.Debug("SQL запрос: %s", query)

	err := r.db.Get(&worker, query, name)
	if err != nil {
		logger.Error("Ошибка при получении работника по имени: %v", err)
		return models.Worker{}, fmt.Errorf("ошибка при получении работника: %w", err)
	}

	logger.Debug("Работник найден: %+v", worker)
	return worker, nil
}
