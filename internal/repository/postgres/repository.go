package postgres

import (
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}


func (r *Repository) GetServicePricesByContract(contractID int) ([]models.Service, error) {
	var servicePrices []models.Service
	query := `
		SELECT s.id, s.name, s.price, s.contract_id, s.material_card, s.created_at, s.updated_at
		FROM services s WHERE s.contract_id = $1
	`
	err := r.db.Select(&servicePrices, query, contractID)
	if err != nil {
		logger.Error("Ошибка при получении цен услуг по контракту: %v", err)
		return nil, fmt.Errorf("ошибка при получении цен услуг по контракту: %w", err)
	}
	return servicePrices, nil
}

func (r *Repository) CreateContract(contract models.Contract) (int, error) {
	var id int
	query := `
		INSERT INTO contracts (number, client_type, client_company_name, client_company_address, client_company_phone, client_company_email, client_company_inn, client_company_kpp, client_company_ogrn)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`
	err := r.db.QueryRow(query, contract.Number, contract.ClientType, contract.ClientCompanyName, contract.ClientCompanyAddress, contract.ClientCompanyPhone, contract.ClientCompanyEmail, contract.ClientCompanyINN, contract.ClientCompanyKPP, contract.ClientCompanyOGRN).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании контракта: %v", err)
		return 0, fmt.Errorf("ошибка при создании контракта: %w", err)
	}
	logger.Info("Контракт успешно создан с ID: %d", id)
	return id, nil
}


func (r *Repository) GetAllContracts() ([]models.Contract, error) {
	var contracts []models.Contract
	query := `
		SELECT id, number, client_type, client_company_name, client_company_address, client_company_phone, client_company_email, client_company_inn, client_company_kpp, client_company_ogrn
		FROM contracts
	`
	err := r.db.Select(&contracts, query)
	if err != nil {
		logger.Error("Ошибка при получении списка контрактов: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка контрактов: %w", err)
	}
	return contracts, nil
}

func (r *Repository) UpdateContract(id int, contract models.Contract) error {
	//TODO implement me
	panic("implement me")
}

func (r *Repository) DeleteContract(id int) error {
	//TODO implement me
	panic("implement me")
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
		INSERT INTO workers (name, surname, email, phone, salary_schema, tmp_salary, has_car)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	logger.Debug("Создание нового работника: %s %s", worker.Name, worker.Surname)
	err := r.db.QueryRow(query, worker.Name, worker.Surname, worker.Email, worker.Phone, worker.SalarySchema, worker.TmpSalary, worker.HasCar).Scan(&id)
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
		SELECT id, name, surname, email, phone, salary_schema, tmp_salary, has_car, created_at, updated_at
		FROM workers
		ORDER BY id`

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
		SELECT id, name, surname, email, phone, salary_schema, tmp_salary, has_car, created_at, updated_at
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
		SET name = $1, surname = $2, email = $3, phone = $4, salary_schema = $5, tmp_salary = $6, has_car = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8`

	logger.Debug("Обновление данных работника ID: %d", id)
	result, err := r.db.Exec(query, worker.Name, worker.Surname, worker.Email, worker.Phone, worker.SalarySchema, worker.TmpSalary, worker.HasCar, id)
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
		INSERT INTO clients (name, client_type, owner_phone, manager_phone, contract_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	logger.Debug("Создание нового клиента: %s", client.Name)
	err := r.db.QueryRow(query, client.Name, client.ClientType, client.OwnerPhone, client.ManagerPhone, client.ContractID).Scan(&id)
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
			   COALESCE(array_remove(array_agg(cars.number), NULL), ARRAY[]::varchar[]) as car_numbers,
			   c.owner_phone, c.manager_phone, c.contract_id
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
			   array_agg(cars.number) as car_numbers,
			   c.owner_phone, c.manager_phone, c.contract_id
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

	// Проверяем существование автомобиля в рамках транзакции
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM cars WHERE number = $1)`
	err = tx.QueryRow(query, car.Number).Scan(&exists)
	if err != nil {
		logger.Error("Ошибка при проверке существования автомобиля: %v", err)
		return fmt.Errorf("ошибка при проверке существования автомобиля: %w", err)
	}

	if exists {
		logger.Warning("Автомобиль с номером %s уже существует", car.Number)
		return fmt.Errorf("автомобиль с номером %s уже существует", car.Number)
	}

	// Создаем запись автомобиля
	query = `
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
		SET name = $1, client_type = $2, owner_phone = $3, manager_phone = $4, contract_id = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6`

	logger.Debug("Обновление данных клиента ID: %d", id)
	result, err := r.db.Exec(query, client.Name, client.ClientType, client.OwnerPhone, client.ManagerPhone, client.ContractID, id)
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
		INSERT INTO services (name, price, contract_id, material_card)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	logger.Debug("Создание новой услуги: %s", service.Name)
	err := r.db.QueryRow(query, service.Name, service.Price, service.ContractID, service.MaterialCardId).Scan(&id)
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
		SELECT id, name, price, contract_id, material_card, created_at, updated_at
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

func (r *Repository) GetAllWithPrices() ([]models.ServiceWithPrices, error) {
	var servicePrices []models.ServicePrice
	query := `
		SELECT s.id, s.contract_id, c.number as contract_name, s.name as service_name, s.material_card as material_card_id, s.price
		FROM services s
		JOIN contracts c ON s.contract_id = c.id
		ORDER BY s.name, c.number`

	err := r.db.Select(&servicePrices, query)
	if err != nil {
		logger.Error("Ошибка при получении списка услуг с ценами: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка услуг с ценами: %w", err)
	}

	// Группируем услуги по названию
	servicesMap := make(map[string]*models.ServiceWithPrices)
	
	for _, sp := range servicePrices {
		if _, exists := servicesMap[sp.ServiceName]; !exists {
			servicesMap[sp.ServiceName] = &models.ServiceWithPrices{
				Name:         sp.ServiceName,
				MaterialCard: sp.MaterialCardID,
				Prices:       []struct {
					ContractID   int    `json:"contract_id"`
					ContractName string `json:"contract_name"`
					Price        int    `json:"price"`
				}{},
				CreatedAt: time.Now(), // Временное значение, можно добавить в запрос если нужно
				UpdatedAt: time.Now(),
			}
		}
		
		servicesMap[sp.ServiceName].Prices = append(servicesMap[sp.ServiceName].Prices, struct {
			ContractID   int    `json:"contract_id"`
			ContractName string `json:"contract_name"`
			Price        int    `json:"price"`
		}{
			ContractID:   sp.ContractID,
			ContractName: sp.ContractName,
			Price:        sp.Price,
		})
	}

	// Преобразуем map в slice
	var services []models.ServiceWithPrices
	for _, service := range servicesMap {
		services = append(services, *service)
	}

	logger.Debug("Получено услуг с ценами: %d", len(services))
	return services, nil
}

func (r *Repository) UpdateService(id int, service models.Service) error {
	query := `
		UPDATE services
		SET name = $1, price = $2, material_card = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4`

	logger.Debug("Обновление данных услуги ID: %d", id)
	result, err := r.db.Exec(query, service.Name, service.Price, service.MaterialCardId, id)
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

func (r *Repository) GetMaterialCard(id int) (models.MaterialCard, error) {
	var materialCard models.MaterialCard
	query := `
		SELECT id, "Rs25", "R19", "R20", "R25", "R251", "R13", "R15", "Foot9", "Foot12", "Foot15"
		FROM material_card
		WHERE id = $1`

	err := r.db.Get(&materialCard, query, id)
	if err != nil {
		logger.Error("Ошибка при получении материала карты: %v", err)
		return models.MaterialCard{}, fmt.Errorf("ошибка при получении материала карты: %w", err)
	}

	return materialCard, nil
}

func (r *Repository) CreateMaterialCard(materialCard models.MaterialCard) (int, error) {
	var id int
	query := `
		INSERT INTO material_card ("Rs25", "R19", "R20", "R25", "R251", "R13", "R15", "Foot9", "Foot12", "Foot15")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`

	err := r.db.QueryRow(query, materialCard.Rs25, materialCard.R19, materialCard.R20, materialCard.R25, materialCard.R251, materialCard.R13, materialCard.R15, materialCard.Foot9, materialCard.Foot12, materialCard.Foot15).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании материала карты: %v", err)
		return 0, fmt.Errorf("ошибка при создании материала карты: %w", err)
	}

	return id, nil
}

func (r *Repository) UpdateMaterialCard(id int, materialCard models.MaterialCard) error {
	query := `
		UPDATE material_card
		SET "Rs25" = $1, "R19" = $2, "R20" = $3, "R25" = $4, "R251" = $5, "R13" = $6, "R15" = $7, "Foot9" = $8, "Foot12" = $9, "Foot15" = $10
		WHERE id = $11`

	logger.Debug("Обновление материала карты ID: %d", id)
	_, err := r.db.Exec(query, materialCard.Rs25, materialCard.R19, materialCard.R20, materialCard.R25, materialCard.R251, materialCard.R13, materialCard.R15, materialCard.Foot9, materialCard.Foot12, materialCard.Foot15, id)
	if err != nil {
		logger.Error("Ошибка при обновлении материала карты: %v", err)
		return fmt.Errorf("ошибка при обновлении материала карты: %w", err)
	}

	return nil
}

func (r *Repository) DeleteMaterialCard(id int) error {
	query := `DELETE FROM material_card WHERE id = $1`

	logger.Debug("Удаление материала карты ID: %d", id)
	result, err := r.db.Exec(query, id)
	if err != nil {
		logger.Error("Ошибка при удалении материала карты: %v", err)
		return fmt.Errorf("ошибка при удалении материала карты: %w", err)	
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("материал карты с ID %d не найден", id)
	}

	logger.Info("Материал карты успешно удален")
	return nil
}

func (r *Repository) GetAllMaterialCards() ([]models.MaterialCard, error) {
	var materialCards []models.MaterialCard
	query := `
		SELECT id, "Rs25", "R19", "R20", "R25", "R251", "R13", "R15", "Foot9", "Foot12", "Foot15"
		FROM material_card
	`

	err := r.db.Select(&materialCards, query)
	if err != nil {
		logger.Error("Ошибка при получении всех материалов карты: %v", err)
		return nil, fmt.Errorf("ошибка при получении всех материалов карты: %w", err)
	}

	return materialCards, nil
}

// вычесть из склада(storage одна запись) материалы тех карты по id
func (r *Repository) SpellMaterial(id int) error {
	materialCard, err := r.GetMaterialCard(id)
	if err != nil {
		return fmt.Errorf("ошибка при получении материала карты: %w", err)
	}

	query := `
		UPDATE storage
		SET "Rs25" = "Rs25" - $1, "R19" = "R19" - $2, "R20" = "R20" - $3, "R25" = "R25" - $4, "R251" = "R251" - $5, "R13" = "R13" - $6, "R15" = "R15" - $7, "Foot9" = "Foot9" - $8, "Foot12" = "Foot12" - $9, "Foot15" = "Foot15" - $10
		WHERE id = $11
	`

	result, err := r.db.Exec(query, materialCard.Rs25, materialCard.R19, materialCard.R20,
		 materialCard.R25, materialCard.R251, materialCard.R13, materialCard.R15, materialCard.Foot9,
		 materialCard.Foot12, materialCard.Foot15, id)

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("материал карты с ID %d не найден", id)
	}

	return nil
}

func (r *Repository) GetStorage() (models.Storage, error) {
	var storage models.Storage
	query := `
		SELECT id, "Rs25", "R19", "R20", "R25", "R251", "R13", "R15", "Foot9", "Foot12", "Foot15"
		FROM storage
		WHERE id = 1
	`

	err := r.db.Get(&storage, query)
	if err != nil {
		logger.Error("Ошибка при получении склада: %v", err)
		return models.Storage{}, fmt.Errorf("ошибка при получении склада: %w", err)
	}

	return storage, nil
}

func (r *Repository) AddDelivery(delivery models.Storage) error {
	// добавить ко всем полям delivery.Rs25, delivery.R19, delivery.R20, delivery.R25, delivery.R251, delivery.R13, delivery.R15, delivery.Foot9, delivery.Foot12, delivery.Foot15
	query := `
		UPDATE storage
		SET "Rs25" = "Rs25" + $1, "R19" = "R19" + $2, "R20" = "R20" + $3, "R25" = "R25" + $4, "R251" = "R251" + $5, "R13" = "R13" + $6, "R15" = "R15" + $7, "Foot9" = "Foot9" + $8, "Foot12" = "Foot12" + $9, "Foot15" = "Foot15" + $10
		WHERE id = 1
	`
	_, err := r.db.Exec(query, delivery.Rs25, delivery.R19, delivery.R20, delivery.R25, delivery.R251, delivery.R13, delivery.R15, delivery.Foot9, delivery.Foot12, delivery.Foot15)
	if err != nil {
		logger.Error("Ошибка при добавлении материалов на склад: %v", err)
		return fmt.Errorf("ошибка при добавлении материалов на склад: %w", err)
	}
	logger.Debug("Материалы успешно добавлены на склад")
	return nil
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
		SELECT id, name, surname, email, phone, salary_schema, tmp_salary, has_car, created_at, updated_at
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

func (r *Repository) GetWorkerByUserId(userId int) (models.Worker, error) {
	var worker models.Worker
	query := `
		SELECT w.id, w.name, w.surname, w.email, w.phone, w.salary_schema, w.tmp_salary, w.has_car, w.created_at, w.updated_at
		FROM workers w
		JOIN users u ON w.name = u.name
		WHERE u.id = $1
	`
	err := r.db.Get(&worker, query, userId)
	return worker, err
}

func (r *Repository) GetWorkerStatistics(workerId int) (models.WorkerStatistics, error) {
	var stats models.WorkerStatistics

	// Получаем общую статистику и последний заказ
	err := r.db.Get(&stats, `
		SELECT 
			COUNT(*) as total_orders,
			COALESCE(SUM(total_amount), 0) as total_revenue,
			MAX(created_at) as last_order,
			(SELECT COUNT(*) FROM orders 
			 WHERE worker_id = $1 
			 AND DATE(created_at) = CURRENT_DATE) as total_orders_today,
			(SELECT COALESCE(SUM(total_amount), 0) FROM orders 
			 WHERE worker_id = $1 
			 AND DATE(created_at) = CURRENT_DATE) as total_revenue_today,
			(SELECT COUNT(*) FROM orders 
			 WHERE worker_id = $1 
			 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_orders_month,
			(SELECT COALESCE(SUM(total_amount), 0) FROM orders 
			 WHERE worker_id = $1 
			 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_revenue_month
		FROM orders
		WHERE worker_id = $1`, workerId)
	if err != nil {
		logger.Error("Ошибка при получении статистики работника: %v", err)
		return models.WorkerStatistics{}, fmt.Errorf("ошибка при получении статистики: %w", err)
	}

	logger.Info("Статистика успешно получена для работника ID:%d", workerId)
	return stats, nil
}

func (r *Repository) CarExists(number string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM cars WHERE number = $1)`

	logger.Debug("Проверка существования автомобиля с номером: %s", number)
	err := r.db.Get(&exists, query, number)
	if err != nil {
		logger.Error("Ошибка при проверке существования автомобиля: %v", err)
		return false, fmt.Errorf("ошибка при проверке существования автомобиля: %w", err)
	}

	logger.Debug("Результат проверки существования автомобиля %s: %v", number, exists)
	return exists, nil
}
