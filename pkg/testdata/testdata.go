package testdata

import (
	"fmt"
	"go-hinomontaj/internal/service"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

// TestDataGenerator структура для генерации тестовых данных
type TestDataGenerator struct {
	services *service.Services
	db       *service.DBConfig
}

// NewTestDataGenerator создает новый генератор тестовых данных
func NewTestDataGenerator(services *service.Services, db *service.DBConfig) *TestDataGenerator {
	return &TestDataGenerator{
		services: services,
		db:       db,
	}
}

// clearDatabase очищает все таблицы в базе данных
func (g *TestDataGenerator) clearDatabase() error {
	logger.Info("Очистка базы данных...")

	// Отключаем проверку foreign key на время очистки
	_, err := g.db.DB.Exec("SET CONSTRAINTS ALL DEFERRED")
	if err != nil {
		return fmt.Errorf("ошибка при отключении проверки foreign key: %w", err)
	}

	// Очищаем таблицы в правильном порядке
	tables := []string{
		"order_services",
		"orders",
		"clients_cars",
		"cars",
		"clients",
		"services",
		"workers",
		"users",
	}

	for _, table := range tables {
		_, err := g.db.DB.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if err != nil {
			return fmt.Errorf("ошибка при очистке таблицы %s: %w", table, err)
		}
		logger.Info("Таблица %s очищена", table)
	}

	// Включаем обратно проверку foreign key
	_, err = g.db.DB.Exec("SET CONSTRAINTS ALL IMMEDIATE")
	if err != nil {
		return fmt.Errorf("ошибка при включении проверки foreign key: %w", err)
	}

	logger.Info("База данных успешно очищена")
	return nil
}

// GenerateTestData генерирует все тестовые данные
func (g *TestDataGenerator) GenerateTestData() error {
	logger.Info("Начало генерации тестовых данных")

	// Очищаем базу данных перед генерацией
	if err := g.clearDatabase(); err != nil {
		return fmt.Errorf("ошибка при очистке базы данных: %w", err)
	}

	// Создаем тестовых пользователей
	if err := g.createTestUsers(); err != nil {
		return err
	}

	// Создаем тестовых работников
	if err := g.createTestWorkers(); err != nil {
		return err
	}

	// Создаем тестовых клиентов и их машины
	if err := g.createTestClientsAndCars(); err != nil {
		return err
	}

	// Создаем тестовые услуги
	if err := g.createTestServices(); err != nil {
		return err
	}

	// Создаем тестовые заказы
	if err := g.createTestOrders(); err != nil {
		return err
	}

	logger.Info("Тестовые данные успешно сгенерированы")
	return nil
}

// createTestUsers создает тестовых пользователей
func (g *TestDataGenerator) createTestUsers() error {
	logger.Info("Создание тестовых пользователей")

	users := []models.SignUpInput{
		{
			Name:     "Worker Test",
			Email:    "worker@test.com",
			Password: "test123",
			Role:     "worker",
		},
		{
			Name:     "Manager Test",
			Email:    "manager@test.com",
			Password: "test123",
			Role:     "manager",
		},
	}

	for _, user := range users {
		_, _, err := g.services.Auth.Register(user)
		if err != nil {
			logger.Error("Ошибка при создании тестового пользователя %s: %v", user.Email, err)
			return err
		}
		logger.Info("Создан тестовый пользователь: %s с ролью %s", user.Email, user.Role)
	}

	return nil
}

// createTestWorkers создает тестовых работников
func (g *TestDataGenerator) createTestWorkers() error {
	logger.Info("Создание тестовых работников")

	workers := []models.Worker{
		{
			Name:    "Иван",
			Surname: "Иванов",
			Salary:  50000,
		},
		{
			Name:    "Петр",
			Surname: "Петров",
			Salary:  55000,
		},
		{
			Name:    "Сергей",
			Surname: "Сергеев",
			Salary:  60000,
		},
	}

	for _, worker := range workers {
		_, err := g.services.Worker.Create(worker)
		if err != nil {
			logger.Error("Ошибка при создании тестового работника %s %s: %v", worker.Name, worker.Surname, err)
			return err
		}
		logger.Info("Создан тестовый работник: %s %s", worker.Name, worker.Surname)
	}

	return nil
}

// createTestClientsAndCars создает тестовых клиентов и их машины
func (g *TestDataGenerator) createTestClientsAndCars() error {
	logger.Info("Создание тестовых клиентов и машин")

	clients := []models.Client{
		{
			Name:       "ИП Иванов",
			ClientType: "НАЛИЧКА",
		},
		{
			Name:       "ООО \"ТрансЛогистик\"",
			ClientType: "КОНТРАГЕНТЫ",
		},
		{
			Name:       "ООО \"АвтоПарк\"",
			ClientType: "КОНТРАГЕНТЫ",
		},
		{
			Name:       "Яндекс.Такси",
			ClientType: "АГРЕГАТОРЫ",
		},
		{
			Name:       "Ситимобил",
			ClientType: "АГРЕГАТОРЫ",
		},
	}

	// Номера для тестовых машин
	cars := [][]models.Car{
		{ // Для ИП Иванов
			{Number: "А123БВ777", Model: "КАМАЗ 5490", Year: 2020},
			{Number: "В234ГД777", Model: "MAN TGX", Year: 2021},
		},
		{ // Для ТрансЛогистик
			{Number: "Е345ЖЗ777", Model: "Volvo FH", Year: 2019},
			{Number: "К456ЛМ777", Model: "Scania R500", Year: 2022},
			{Number: "Н567ПР777", Model: "Mercedes Actros", Year: 2021},
		},
		{ // Для АвтоПарк
			{Number: "С678ТУ777", Model: "DAF XF", Year: 2020},
			{Number: "Х789ЦЧ777", Model: "КАМАЗ 54901", Year: 2022},
		},
		{ // Для Яндекс.Такси
			{Number: "Ш890ЩЭ777", Model: "Volvo FH16", Year: 2021},
			{Number: "Ю901ЯА777", Model: "MAN TGS", Year: 2020},
		},
		{ // Для Ситимобил
			{Number: "А012БВ777", Model: "Scania S730", Year: 2022},
			{Number: "Г234ДЕ777", Model: "Mercedes Arocs", Year: 2021},
		},
	}

	for i, client := range clients {
		// Создаем клиента
		clientID, err := g.services.Client.Create(client)
		if err != nil {
			logger.Error("Ошибка при создании тестового клиента %s: %v", client.Name, err)
			return err
		}
		logger.Info("Создан тестовый клиент: %s", client.Name)

		// Добавляем машины клиенту
		for _, car := range cars[i] {
			err = g.services.Client.AddCarToClient(clientID, car)
			if err != nil {
				logger.Error("Ошибка при добавлении машины %s клиенту %s: %v", car.Number, client.Name, err)
				return err
			}
			logger.Info("Добавлена машина %s клиенту %s", car.Number, client.Name)
		}
	}

	return nil
}

// createTestServices создает тестовые услуги
func (g *TestDataGenerator) createTestServices() error {
	logger.Info("Создание тестовых услуг")

	// Базовые цены для типа НАЛИЧКА
	baseServices := map[string]int{
		"Снятие колеса одиночка":          300,
		"Установка колеса одиночка":       300,
		"Демонтаж резины с диска":         300,
		"Монтаж установка резины на диск": 300,
		"Снятие спарка":                   350,
		"Установка спарка":                350,
		"Протяжка колесных гаек 1 колесо": 150,
		"Подкачка 1 колеса":               50,
		"Балансировка 1 колеса":           700,
		"Установка заплаты р13":           900,
		"Установка заплаты р15":           1000,
		"Установка заплаты р19, р20, р23": 1300,
		"Установка заплаты р25":           1800,
		"Установка заплаты RS-25":         2300,
	}

	// Коэффициенты для разных типов клиентов
	priceCoefficients := map[string]float64{
		"НАЛИЧКА":     1.0,
		"КОНТРАГЕНТЫ": 0.9,  // 10% скидка
		"АГРЕГАТОРЫ":  0.85, // 15% скидка
	}

	// Создаем услуги для каждого типа клиентов
	for serviceName, basePrice := range baseServices {
		for clientType, coefficient := range priceCoefficients {
			service := models.Service{
				Name:       serviceName,
				ClientType: clientType,
				Price:      int(float64(basePrice) * coefficient),
			}

			_, err := g.services.Service.Create(service)
			if err != nil {
				logger.Error("Ошибка при создании услуги %s для типа клиента %s: %v", serviceName, clientType, err)
				return err
			}
			logger.Info("Создана услуга: %s для типа клиента %s с ценой %d", serviceName, clientType, service.Price)
		}
	}

	return nil
}

// createTestOrders создает тестовые заказы
func (g *TestDataGenerator) createTestOrders() error {
	logger.Info("Создание тестовых заказов")

	// Получаем всех работников
	workers, err := g.services.Worker.GetAll()
	if err != nil {
		return err
	}
	logger.Debug("Получено работников: %d", len(workers))

	// Получаем всех клиентов
	clients, err := g.services.Client.GetAll()
	if err != nil {
		return err
	}
	logger.Debug("Получено клиентов: %d", len(clients))

	// Получаем все услуги
	services, err := g.services.Service.GetAll()
	if err != nil {
		return err
	}
	logger.Debug("Получено услуг: %d", len(services))

	// Проверяем, что у нас есть достаточно данных для создания заказов
	if len(workers) < 3 || len(clients) < 3 || len(services) < 6 {
		logger.Error("Недостаточно данных для создания заказов: workers=%d, clients=%d, services=%d", len(workers), len(clients), len(services))
		return fmt.Errorf("недостаточно данных для создания заказов")
	}

	orders := []models.Order{
		{
			WorkerID:      workers[0].ID,
			ClientID:      clients[0].ID,
			VehicleNumber: "А123БВ777",
			PaymentMethod: "invoice",
			TotalAmount:   1600,
			Services: []models.OrderService{
				{
					ServiceID:     services[1].ID, // Замена колеса (company)
					Description:   "Замена колеса",
					WheelPosition: "переднее_левое",
					Price:         800,
				},
				{
					ServiceID:     services[3].ID, // Балансировка (company)
					Description:   "Балансировка",
					WheelPosition: "переднее_левое",
					Price:         800,
				},
			},
		},
		{
			WorkerID:      workers[1].ID,
			ClientID:      clients[1].ID,
			VehicleNumber: "В321ГД999",
			PaymentMethod: "card",
			TotalAmount:   1500,
			Services: []models.OrderService{
				{
					ServiceID:     services[0].ID, // Замена колеса (individual)
					Description:   "Замена колеса",
					WheelPosition: "заднее_правое",
					Price:         1000,
				},
				{
					ServiceID:     services[4].ID, // Ремонт прокола (individual)
					Description:   "Ремонт прокола",
					WheelPosition: "заднее_правое",
					Price:         500,
				},
			},
		},
	}

	for _, order := range orders {
		logger.Debug("Создание нового заказа")
		_, err := g.services.Order.Create(order)
		if err != nil {
			logger.Error("Ошибка при создании тестового заказа для машины %s: %v", order.VehicleNumber, err)
			return err
		}
		logger.Info("Создан тестовый заказ для машины %s", order.VehicleNumber)
	}

	return nil
}
