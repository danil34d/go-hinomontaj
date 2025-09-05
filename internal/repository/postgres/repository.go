package postgres

import (
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func (r *Repository) GetServicePricesByContract(contractID int) ([]models.Service, error) {
	var servicePrices []models.Service
	query := `
		SELECT s.id, s.name, s.price, s.contract_id, s.created_at, s.updated_at
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
	// Сначала проверяем, существует ли контракт с таким номером
	checkQuery := `SELECT id FROM contracts WHERE number = $1`
	err := r.db.Get(&id, checkQuery, contract.Number)
	if err == nil && id != 0 {
		logger.Info("Контракт с номером %s уже существует, ID: %d", contract.Number, id)
		return id, nil
	}

	query := `
		INSERT INTO contracts (number, client_type, client_company_name, client_company_address, client_company_phone, client_company_email, client_company_inn, client_company_kpp, client_company_ogrn)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`
	err = r.db.QueryRow(query, contract.Number, contract.ClientType, contract.ClientCompanyName, contract.ClientCompanyAddress, contract.ClientCompanyPhone, contract.ClientCompanyEmail, contract.ClientCompanyINN, contract.ClientCompanyKPP, contract.ClientCompanyOGRN).Scan(&id)
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

func (r *Repository) AddServicesToContract(contractID int, services []models.Service) error {
	tx, err := r.db.Begin()
	if err != nil {
		logger.Error("Ошибка при начале транзакции: %v", err)
		return fmt.Errorf("ошибка при начале транзакции: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO services (name, price, contract_id)
		VALUES ($1, $2, $3)
	`

	for _, s := range services {
		if _, err := tx.Exec(query, s.Name, s.Price, contractID); err != nil {
			logger.Error("Ошибка при добавлении услуги %s к договору %d: %v", s.Name, contractID, err)
			return fmt.Errorf("ошибка при добавлении услуг к договору: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		logger.Error("Ошибка при завершении транзакции: %v", err)
		return fmt.Errorf("ошибка при завершении транзакции: %w", err)
	}

	logger.Info("Услуги успешно добавлены к договору ID:%d", contractID)
	return nil
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
		INSERT INTO workers (name, surname, email, phone, salary_schema, salary, has_car)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	logger.Debug("Создание нового работника: %s %s", worker.Name, worker.Surname)
	err := r.db.QueryRow(query, worker.Name, worker.Surname, worker.Email, worker.Phone, worker.SalarySchema, worker.Salary, worker.HasCar).Scan(&id)
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
		SELECT id, name, surname, email, phone, salary_schema, salary, has_car, created_at, updated_at
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
		SELECT id, name, surname, email, phone, salary_schema, salary, has_car, created_at, updated_at
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
		SET name = $1, surname = $2, email = $3, phone = $4, salary_schema = $5, salary = $6, has_car = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8`

	logger.Debug("Обновление данных работника ID: %d", id)
	result, err := r.db.Exec(query, worker.Name, worker.Surname, worker.Email, worker.Phone, worker.SalarySchema, worker.Salary, worker.HasCar, id)
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
	err := r.db.QueryRow(query, client.Name, strings.ToUpper(client.ClientType), client.OwnerPhone, client.ManagerPhone, client.ContractID).Scan(&id)
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

	var carId int

	// Сначала пытаемся найти существующую машину
	query := `SELECT id FROM cars WHERE number = $1`
	err = tx.QueryRow(query, car.Number).Scan(&carId)

	if err != nil {
		// Если машина не найдена, создаем новую
		if err.Error() == "sql: no rows in result set" {
			query = `
				INSERT INTO cars (number, model, year, created_at, updated_at)
				VALUES ($1, $2, $3, NOW(), NOW())
				RETURNING id`

			err = tx.QueryRow(query, car.Number, car.Model, car.Year).Scan(&carId)
			if err != nil {
				logger.Error("Ошибка при создании автомобиля: %v", err)
				return fmt.Errorf("ошибка при создании автомобиля: %w", err)
			}
			logger.Debug("Создана новая машина ID:%d с номером %s", carId, car.Number)
		} else {
			logger.Error("Ошибка при поиске автомобиля: %v", err)
			return fmt.Errorf("ошибка при поиске автомобиля: %w", err)
		}
	} else {
		logger.Debug("Найдена существующая машина ID:%d с номером %s", carId, car.Number)
	}

	// Проверяем, не связана ли уже эта машина с данным клиентом
	var linkExists bool
	query = `SELECT EXISTS(SELECT 1 FROM clients_cars WHERE client_id = $1 AND car_id = $2)`
	err = tx.QueryRow(query, clientId, carId).Scan(&linkExists)
	if err != nil {
		logger.Error("Ошибка при проверке связи клиент-машина: %v", err)
		return fmt.Errorf("ошибка при проверке связи клиент-машина: %w", err)
	}

	if linkExists {
		logger.Warning("Машина с номером %s уже принадлежит клиенту ID:%d", car.Number, clientId)
		return fmt.Errorf("машина с номером %s уже принадлежит этому клиенту", car.Number)
	}

	// Создаем связь автомобиль-клиент
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

	logger.Info("Успешно добавлена машина ID:%d (номер: %s) клиенту ID:%d", carId, car.Number, clientId)
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
		INSERT INTO services (name, price, contract_id)
		VALUES ($1, $2, $3)
		RETURNING id`

	logger.Debug("Создание новой услуги: %s", service.Name)
	err := r.db.QueryRow(query, service.Name, service.Price, service.ContractID).Scan(&id)
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
		SELECT id, name, price, contract_id, created_at, updated_at
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
		SELECT s.id, s.contract_id, c.number as contract_name, s.name as service_name, s.price
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
				Name: sp.ServiceName,
				Prices: []struct {
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
func (r *Repository) WhooseCar(car string) ([]models.Client, error) {
	var clients []models.Client
	query := `
		SELECT DISTINCT c.id, c.name, c.client_type, c.owner_phone, c.manager_phone, c.contract_id, c.created_at, c.updated_at,
			   COALESCE(array_remove(array_agg(cars.number), NULL), ARRAY[]::varchar[]) as car_numbers
		FROM clients c
		JOIN clients_cars cc ON c.id = cc.client_id 
		JOIN cars ON cars.id = cc.car_id 
		WHERE cars.number = $1
		GROUP BY c.id, c.name, c.client_type, c.owner_phone, c.manager_phone, c.contract_id, c.created_at, c.updated_at`

	err := r.db.Select(&clients, query, car)
	if err != nil {
		logger.Error("Ошибка при поиске владельцев машины %s: %v", car, err)
		return nil, fmt.Errorf("ошибка при поиске владельцев машины: %w", err)
	}

	logger.Debug("Найдено %d владельцев для машины %s", len(clients), car)
	return clients, nil
}

func (r *Repository) UpdateService(id int, service models.Service) error {
	query := `
		UPDATE services
		SET name = $1, price = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3`

	logger.Debug("Обновление данных услуги ID: %d", id)
	result, err := r.db.Exec(query, service.Name, service.Price, id)
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
		INSERT INTO orders (status, worker_id, client_id, vehicle_number, payment_method, total_amount)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	logger.Debug("Создание нового заказа")
	err = tx.QueryRow(query, order.Status, order.WorkerID, order.ClientID, order.VehicleNumber, order.PaymentMethod, order.TotalAmount).Scan(&orderId)
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
			if service.Price <= 0 {
				return 0, fmt.Errorf("неверная цена услуги")
			}

			_, err = tx.Exec(`
				INSERT INTO order_services (order_id, service_id, client_id, service_description, wheel_position, price)
				VALUES ($1, $2, $3, $4, $5, $6)`,
				orderId, service.ServiceID, order.ClientID, service.Description, service.WheelPosition, service.Price)
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
		SELECT o.id, o.status, o.worker_id, o.client_id, o.vehicle_number, o.payment_method, o.total_amount,
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
		SELECT id, status, worker_id, client_id, vehicle_number, payment_method, total_amount, created_at, updated_at
		FROM orders
		WHERE worker_id = $1
		ORDER BY created_at DESC`

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

	logger.Debug("Получено заказов для работника ID %d: %d", workerId, len(orders))
	return orders, nil
}

func (r *Repository) GetOrdersByWorkerIdAndDateRange(workerId int, start, end time.Time) ([]models.Order, error) {
	var orders []models.Order
	query := `
		SELECT id, status, worker_id, client_id, vehicle_number, payment_method, total_amount, created_at, updated_at
		FROM orders
		WHERE worker_id = $1 AND created_at >= $2 AND created_at < $3
		ORDER BY created_at DESC`

	logger.Debug("Получение заказов для работника ID: %d в период с %v по %v", workerId, start, end)
	err := r.db.Select(&orders, query, workerId, start, end)
	if err != nil {
		logger.Error("Ошибка при получении заказов работника за период: %v", err)
		return nil, fmt.Errorf("ошибка при получении заказов работника за период: %w", err)
	}

	logger.Debug("Получено заказов для работника ID %d за период: %d", workerId, len(orders))
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
		SET status = $1, worker_id = $2, client_id = $3, vehicle_number = $4, payment_method = $5, total_amount = $6,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $7`

	logger.Debug("Обновление данных заказа ID: %d", id)
	result, err := tx.Exec(query, order.Status, order.WorkerID, order.ClientID, order.VehicleNumber, order.PaymentMethod, order.TotalAmount, id)
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
			INSERT INTO order_services (order_id, service_id, client_id, service_description, wheel_position, price)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			id, service.ServiceID, order.ClientID, service.Description, service.WheelPosition, service.Price)
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

func (r *Repository) UpdateOrderStatus(id int, status string) error {
	query := `
		UPDATE orders
		SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2`

	logger.Debug("Обновление статуса заказа ID: %d на %s", id, status)
	result, err := r.db.Exec(query, status, id)
	if err != nil {
		logger.Error("Ошибка при обновлении статуса заказа: %v", err)
		return fmt.Errorf("ошибка при обновлении статуса заказа: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("заказ с ID %d не найден", id)
	}

	logger.Info("Статус заказа успешно обновлен")
	return nil
}

func (r *Repository) AddMaterial(material models.Material) error {
	// Проверяем, существует ли уже материал с таким именем и типом
	var existingId int
	checkQuery := `SELECT id FROM material WHERE name = $1 AND type_ds = $2`
	err := r.db.Get(&existingId, checkQuery, material.Name, material.TypeDS)
	if err == nil {
		// Материал уже существует
		logger.Warning("Материал %s (тип ДС: %d) уже существует с ID: %d", material.Name, material.TypeDS, existingId)
		return fmt.Errorf("материал с названием '%s' и типом ДС %d уже существует", material.Name, material.TypeDS)
	}

	// Проверяем, что это действительно ошибка "не найдено", а не другая ошибка
	if err.Error() != "sql: no rows in result set" {
		logger.Error("Ошибка при проверке существования материала: %v", err)
		return fmt.Errorf("ошибка при проверке существования материала: %w", err)
	}

	query := `
		INSERT INTO material (name, type_ds, storage)
		VALUES ($1, $2, $3)
		RETURNING id`

	logger.Debug("Создание нового материала: %s (тип ДС: %d)", material.Name, material.TypeDS)
	var id int
	err = r.db.QueryRow(query, material.Name, material.TypeDS, material.Storage).Scan(&id)
	if err != nil {
		logger.Error("Ошибка при создании материала: %v", err)
		return fmt.Errorf("ошибка при создании материала: %w", err)
	}

	logger.Info("Материал успешно создан с ID: %d", id)
	return nil
}

func (r *Repository) GetAllMaterials() ([]models.Material, error) {
	var materials []models.Material
	query := `
		SELECT id, name, type_ds, storage, created_at, updated_at
		FROM material
		ORDER BY name`

	logger.Debug("Получение списка всех материалов")
	err := r.db.Select(&materials, query)
	if err != nil {
		logger.Error("Ошибка при получении списка материалов: %v", err)
		return nil, fmt.Errorf("ошибка при получении списка материалов: %w", err)
	}

	logger.Debug("Получено материалов: %d", len(materials))
	return materials, nil
}

func (r *Repository) GetMaterialById(id int) (models.Material, error) {
	var material models.Material
	query := `
		SELECT id, name, type_ds, storage, created_at, updated_at
		FROM material
		WHERE id = $1`

	logger.Debug("Поиск материала по ID: %d", id)
	err := r.db.Get(&material, query, id)
	if err != nil {
		logger.Error("Ошибка при получении материала по ID: %v", err)
		return models.Material{}, fmt.Errorf("ошибка при получении материала: %w", err)
	}

	logger.Debug("Материал найден: %v", material)
	return material, nil
}

func (r *Repository) GetMaterialByNameAndType(name string, typeDS int) (models.Material, error) {
	var material models.Material
	query := `
		SELECT id, name, type_ds, storage, created_at, updated_at
		FROM material
		WHERE name = $1 AND type_ds = $2`

	logger.Debug("Поиск материала по названию: %s и типу ДС: %d", name, typeDS)
	err := r.db.Get(&material, query, name, typeDS)
	if err != nil {
		logger.Debug("Материал не найден: %s (тип ДС: %d)", name, typeDS)
		return models.Material{}, fmt.Errorf("материал не найден: %w", err)
	}

	logger.Debug("Материал найден: %v", material)
	return material, nil
}

func (r *Repository) AddMaterialQuantity(id int, quantity int) error {
	// Сначала получаем текущее количество
	var currentStorage int
	selectQuery := `SELECT storage FROM material WHERE id = $1`
	err := r.db.Get(&currentStorage, selectQuery, id)
	if err != nil {
		logger.Error("Ошибка при получении текущего количества материала ID %d: %v", id, err)
		return fmt.Errorf("ошибка при получении текущего количества материала: %w", err)
	}

	logger.Debug("Текущее количество материала ID %d: %d, добавляем: %d", id, currentStorage, quantity)

	query := `
		UPDATE material
		SET storage = storage + $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2`

	logger.Debug("Выполнение SQL: %s с параметрами: quantity=%d, id=%d", query, quantity, id)
	result, err := r.db.Exec(query, quantity, id)
	if err != nil {
		logger.Error("Ошибка при выполнении UPDATE для материала ID %d: %v", id, err)
		return fmt.Errorf("ошибка при добавлении количества материала: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("материал с ID %d не найден", id)
	}

	// Проверяем результат
	var newStorage int
	err = r.db.Get(&newStorage, selectQuery, id)
	if err != nil {
		logger.Error("Ошибка при проверке результата обновления материала ID %d: %v", id, err)
	} else {
		logger.Debug("Новое количество материала ID %d: %d", id, newStorage)
	}

	logger.Info("Количество материала успешно добавлено с %d до %d", currentStorage, newStorage)
	return nil
}

func (r *Repository) SubtractMaterialQuantity(id int, quantity int) error {
	// Сначала получаем текущее количество
	var currentStorage int
	selectQuery := `SELECT storage FROM material WHERE id = $1`
	err := r.db.Get(&currentStorage, selectQuery, id)
	if err != nil {
		logger.Error("Ошибка при получении текущего количества материала ID %d: %v", id, err)
		return fmt.Errorf("ошибка при получении текущего количества материала: %w", err)
	}

	logger.Debug("Текущее количество материала ID %d: %d, вычитаем: %d", id, currentStorage, quantity)

	if currentStorage < quantity {
		return fmt.Errorf("недостаточно материала на складе: текущий остаток %d, требуется вычесть %d", currentStorage, quantity)
	}

	query := `
		UPDATE material
		SET storage = storage - $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2`

	logger.Debug("Выполнение SQL: %s с параметрами: quantity=%d, id=%d", query, quantity, id)
	result, err := r.db.Exec(query, quantity, id)
	if err != nil {
		logger.Error("Ошибка при выполнении UPDATE для материала ID %d: %v", id, err)
		return fmt.Errorf("ошибка при уменьшении количества материала: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("материал с ID %d не найден", id)
	}

	// Проверяем результат
	var newStorage int
	err = r.db.Get(&newStorage, selectQuery, id)
	if err != nil {
		logger.Error("Ошибка при проверке результата обновления материала ID %d: %v", id, err)
	} else {
		logger.Debug("Новое количество материала ID %d: %d", id, newStorage)
	}

	logger.Info("Количество материала успешно уменьшено с %d до %d", currentStorage, newStorage)
	return nil
}

func (r *Repository) UpdateMaterial(id int, material models.Material) error {
	query := `
		UPDATE material
		SET name = $1, type_ds = $2, storage = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4`

	logger.Debug("Обновление данных материала ID: %d", id)
	result, err := r.db.Exec(query, material.Name, material.TypeDS, material.Storage, id)
	if err != nil {
		logger.Error("Ошибка при обновлении материала: %v", err)
		return fmt.Errorf("ошибка при обновлении материала: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества обновленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("материал с ID %d не найден", id)
	}

	logger.Info("Данные материала успешно обновлены")
	return nil
}

func (r *Repository) DeleteMaterial(id int) error {
	// Сначала проверяем существование материала
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM material WHERE id = $1)`
	err := r.db.Get(&exists, checkQuery, id)
	if err != nil {
		logger.Error("Ошибка при проверке существования материала ID %d: %v", id, err)
		return fmt.Errorf("ошибка при проверке существования материала: %w", err)
	}

	if !exists {
		logger.Warning("Материал с ID %d не найден", id)
		return fmt.Errorf("материал с ID %d не найден", id)
	}

	query := `DELETE FROM material WHERE id = $1`

	logger.Debug("Удаление материала ID: %d", id)
	result, err := r.db.Exec(query, id)
	if err != nil {
		logger.Error("Ошибка при удалении материала ID %d: %v", id, err)
		return fmt.Errorf("ошибка при удалении материала: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ошибка при получении количества удаленных строк: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("материал с ID %d не найден", id)
	}

	logger.Info("Материал ID %d успешно удален", id)
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

// GetOrderMaterials получает материалы для конкретного заказа
func (r *Repository) GetOrderMaterials(orderID int) ([]models.OrderMaterial, error) {
	var orderMaterials []models.OrderMaterial
	query := `
		SELECT om.id, om.order_id, om.material_id, om.quantity, om.created_at,
			   m.id as "material.id", m.name as "material.name", m.type_ds as "material.type_ds", 
			   m.storage as "material.storage", m.created_at as "material.created_at", 
			   m.updated_at as "material.updated_at"
		FROM order_materials om
		JOIN materials m ON om.material_id = m.id
		WHERE om.order_id = $1
		ORDER BY om.created_at`

	rows, err := r.db.Query(query, orderID)
	if err != nil {
		logger.Error("Ошибка при получении материалов заказа %d: %v", orderID, err)
		return nil, fmt.Errorf("ошибка при получении материалов заказа: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var om models.OrderMaterial
		var material models.Material
		
		err := rows.Scan(
			&om.ID, &om.OrderID, &om.MaterialID, &om.Quantity, &om.CreatedAt,
			&material.ID, &material.Name, &material.TypeDS, &material.Storage,
			&material.CreatedAt, &material.UpdatedAt,
		)
		if err != nil {
			logger.Error("Ошибка при сканировании материала заказа: %v", err)
			return nil, fmt.Errorf("ошибка при сканировании материала заказа: %w", err)
		}
		
		om.Material = &material
		orderMaterials = append(orderMaterials, om)
	}

	if err = rows.Err(); err != nil {
		logger.Error("Ошибка при итерации по материалам заказа: %v", err)
		return nil, fmt.Errorf("ошибка при итерации по материалам заказа: %w", err)
	}

	logger.Debug("Получено материалов для заказа %d: %d", orderID, len(orderMaterials))
	return orderMaterials, nil
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
		SELECT id, name, surname, email, phone, salary_schema, salary, has_car, created_at, updated_at
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
		SELECT w.id, w.name, w.surname, w.email, w.phone, w.salary_schema, w.salary, w.has_car, w.created_at, w.updated_at
		FROM workers w
		JOIN users u ON w.name = u.name
		WHERE u.id = $1
	`
	err := r.db.Get(&worker, query, userId)
	return worker, err
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

func (r *Repository) AddPenalty(penalty models.PenaltyOrBonus) error {
	query := `
		INSERT INTO penalties (workerID, delta, description, order_id)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.db.Exec(query, penalty.WorkerID, penalty.Amount, penalty.Desc, penalty.OrderID)
	if err != nil {
		logger.Error("Ошибка при добавлении штрафа: %v", err)
		return fmt.Errorf("ошибка при добавлении штрафа: %w", err)
	}

	logger.Debug("Штраф успешно добавлен: %+v", penalty)
	return nil
}

func (r *Repository) AddBonus(bonus models.PenaltyOrBonus) error {
	query := `
		INSERT INTO bonuses (workerID, delta, description, order_id)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.db.Exec(query, bonus.WorkerID, bonus.Amount, bonus.Desc, bonus.OrderID)
	if err != nil {
		logger.Error("Ошибка при добавлении бонуса: %v", err)
		return fmt.Errorf("ошибка при добавлении бонуса: %w", err)
	}

	logger.Debug("Бонус успешно добавлен: %+v", bonus)
	return nil
}

func (r *Repository) GetPenalties(workerID int) ([]models.PenaltyOrBonus, error) {
	var penalties []models.PenaltyOrBonus
	query := `
		SELECT id, workerID, delta, description, order_id, created_at
		FROM penalties
		WHERE workerID = $1`

	logger.Debug("Получение списка штрафов работника: %d", workerID)
	err := r.db.Select(&penalties, query, workerID)
	if err != nil {
		logger.Error("Ошибка при получении штрафов: %v", err)
		return nil, fmt.Errorf("ошибка при получении штрафов: %w", err)
	}

	logger.Debug("Штрафы успешно получены: %d", len(penalties))
	return penalties, nil
}

func (r *Repository) GetBonuses(workerID int) ([]models.PenaltyOrBonus, error) {
	var bonuses []models.PenaltyOrBonus
	query := `
		SELECT id, workerID, delta, description, order_id, created_at
		FROM bonuses
		WHERE workerID = $1`

	logger.Debug("Получение списка бонусов работника: %d", workerID)
	err := r.db.Select(&bonuses, query, workerID)
	if err != nil {
		logger.Error("Ошибка при получении бонусов: %v", err)
		return nil, fmt.Errorf("ошибка при получении бонусов: %w", err)
	}

	logger.Debug("Бонусы успешно получены: %d", len(bonuses))
	return bonuses, nil
}

func (r *Repository) GetWorkerStatistic(workerID int, start, end time.Time) (models.WorkerStatistics, error) {
	var stats models.WorkerStatistics

	query := `
		SELECT 
			w.id AS worker_id,
			w.name AS worker_name,
			w.surname AS worker_surname,
			w.phone AS worker_phone,
			w.salary_schema AS salary_schema,
			
			-- Общее количество заказов
			(SELECT COUNT(*) FROM orders WHERE worker_id = w.id AND created_at BETWEEN $2 AND $3) AS total_orders,
			
			-- Общая выручка по заказам
			(SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE worker_id = w.id AND created_at BETWEEN $2 AND $3) AS total_revenue,
			
			-- Общая сумма бонусов
			(SELECT COALESCE(SUM(delta), 0) FROM bonuses WHERE workerID = w.id AND created_at BETWEEN $2 AND $3) AS total_bonus,
			
			-- Общая сумма штрафов
			(SELECT COALESCE(SUM(delta), 0) FROM penalties WHERE workerID = w.id AND created_at BETWEEN $2 AND $3) AS total_penalties,
			
			-- Финальная зарплата
			(w.salary + 
			 COALESCE((SELECT SUM(delta) FROM bonuses WHERE workerID = w.id AND created_at BETWEEN $2 AND $3), 0) -
			 COALESCE((SELECT SUM(delta) FROM penalties WHERE workerID = w.id AND created_at BETWEEN $2 AND $3), 0)
			) AS total_salary

		FROM workers w
		WHERE w.id = $1
	`

	err := r.db.Get(&stats, query, workerID, start, end)
	if err != nil {
		return stats, fmt.Errorf("failed to get worker statistics: %w", err)
	}

	return stats, nil
}

func (r *Repository) OnlineDate(date *models.OnlineDate) error {
	query := `
		INSERT INTO online_date (date, name, phone, car_number, client_desc, manager_desc, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
		RETURNING id`
	err := r.db.QueryRow(query, date.Date, date.Name, date.Phone, date.CarNumber, date.ClientDesc, date.ManagerDesc).Scan(&date.ID)
	if err != nil {
		logger.Error("Ошибка при добавлении онлайн записи: %v", err)
		return err
	}
	logger.Debug("Создана онлайн запись с ID: %d", date.ID)
	return nil
}

func (r *Repository) GetOnlineDate() ([]models.OnlineDate, error) {
	var dates []models.OnlineDate
	query := `SELECT * FROM online_date ORDER BY date ASC`
	err := r.db.Select(&dates, query)
	if err != nil {
		logger.Error("Ошибка при получении даты онлайн:", err)
		return nil, err
	}
	return dates, nil
}

func (r *Repository) UpdateOnlineDate(date models.OnlineDate) error {
	query := `UPDATE online_date SET name = $1, phone = $2, car_number = $3, client_desc = $4, manager_desc = $5 WHERE id = $6`
	_, err := r.db.Exec(query, date.Name, date.Phone, date.CarNumber, date.ClientDesc, date.ManagerDesc, date.ID)
	if err != nil {
		logger.Error("Ошибка при обновлении даты онлайн: %v", err)
		return err
	}
	return nil
}
