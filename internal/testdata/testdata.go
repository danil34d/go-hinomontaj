package testdata

import (
	"go-hinomontaj/internal/service"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type TestDataManager struct {
	services *service.Services
}

func NewTestDataManager(services *service.Services) *TestDataManager {
	return &TestDataManager{
		services: services,
	}
}

func (m *TestDataManager) AddTestData() error {
	logger.Info("Начинаем добавление тестовых данных")

	// Создаем тестовых пользователей
	workerInput := models.SignUpInput{
		Name:     "Worker Test",
		Email:    "worker@test.com",
		Password: "test123",
		Role:     "worker",
	}
	_, workerUser, err := m.services.Auth.Register(workerInput)
	if err != nil {
		logger.Error("Ошибка при создании тестового работника: %v", err)
		return err
	}
	logger.Info("Создан тестовый работник: %s", workerUser.Email)

	managerInput := models.SignUpInput{
		Name:     "Manager Test",
		Email:    "manager@test.com",
		Password: "test123",
		Role:     "manager",
	}
	_, managerUser, err := m.services.Auth.Register(managerInput)
	if err != nil {
		logger.Error("Ошибка при создании тестового менеджера: %v", err)
		return err
	}
	logger.Info("Создан тестовый менеджер: %s", managerUser.Email)

	// Создаем тестовых работников
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
		_, err := m.services.Worker.Create(worker)
		if err != nil {
			logger.Error("Ошибка при создании работника %s %s: %v", worker.Name, worker.Surname, err)
			return err
		}
		logger.Info("Создан работник: %s %s", worker.Name, worker.Surname)
	}

	// Создаем тестовых клиентов
	clients := []models.Client{
		{
			Name:       "ООО \"Автопарк\"",
			ClientType: "company",
		},
		{
			Name:       "Иван Петрович",
			ClientType: "individual",
		},
		{
			Name:       "АО \"Транспорт\"",
			ClientType: "company",
		},
	}

	for _, client := range clients {
		_, err := m.services.Client.Create(client)
		if err != nil {
			logger.Error("Ошибка при создании клиента %s: %v", client.Name, err)
			return err
		}
		logger.Info("Создан клиент: %s", client.Name)
	}

	// Создаем тестовые услуги
	services := []models.Service{
		{
			Name:       "Замена колеса",
			ClientType: "individual",
			Price:      1000,
		},
		{
			Name:       "Замена колеса",
			ClientType: "company",
			Price:      800,
		},
		{
			Name:       "Балансировка",
			ClientType: "individual",
			Price:      500,
		},
		{
			Name:       "Балансировка",
			ClientType: "company",
			Price:      400,
		},
		{
			Name:       "Ремонт прокола",
			ClientType: "individual",
			Price:      300,
		},
		{
			Name:       "Ремонт прокола",
			ClientType: "company",
			Price:      250,
		},
	}

	for _, service := range services {
		_, err := m.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка при создании услуги %s для %s: %v", service.Name, service.ClientType, err)
			return err
		}
		logger.Info("Создана услуга: %s для %s", service.Name, service.ClientType)
	}

	logger.Info("Тестовые данные успешно добавлены")
	return nil
}
