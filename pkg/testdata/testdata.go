package testdata

import (
	"fmt"
	"go-hinomontaj/internal/service"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"math/rand"
	"time"
)

// TestDataGenerator генератор тестовых данных
type TestDataGenerator struct {
	services *service.Services
	dbConfig *service.DBConfig
}

// NewTestDataGenerator создает новый экземпляр генератора
func NewTestDataGenerator(services *service.Services, dbConfig *service.DBConfig) *TestDataGenerator {
	return &TestDataGenerator{
		services: services,
		dbConfig: dbConfig,
	}
}

// GenerateTestData генерирует все тестовые данные
func (g *TestDataGenerator) GenerateTestData() error {
	logger.Info("Начинаем генерацию тестовых данных...")

	// Инициализируем генератор случайных чисел
	rand.Seed(time.Now().UnixNano())

	// Генерируем аккаунты
	if err := g.generateAccounts(); err != nil {
		return err
	}

	// Генерируем договоры
	if err := g.generateContracts(); err != nil {
		return err
	}

	// Генерируем материальные карты (нужны для услуг)
	if err := g.generateMaterialCards(); err != nil {
		return err
	}

	// Генерируем услуги для каждого договора
	if err := g.generateServices(); err != nil {
		return err
	}

	// Генерируем клиентов
	if err := g.generateClients(); err != nil {
		return err
	}

	logger.Info("Тестовые данные успешно сгенерированы")
	return nil
}

// generateAccounts создает аккаунты для работника и менеджера
func (g *TestDataGenerator) generateAccounts() error {
	logger.Info("Генерация аккаунтов...")

	// Создаем аккаунт работника
	workerPassword := "worker123"
	_, workerUserCreated, err := g.services.Auth.Register(models.SignUpInput{
		Name:     "Иван",
		Email:    "worker@shinomontaj.ru",
		Password: workerPassword,
		Role:     "worker",
	})
	if err != nil {
		logger.Error("Ошибка создания аккаунта работника: %v", err)
		return err
	}

	// Создаем работника
	worker := models.Worker{
		Name:        "Иван",
		Surname:     "Петров",
		Phone:       "+7 (999) 123-45-67",
		SalarySchema: "percentage",
		TmpSalary:   50000,
		HasCar:      true,
	}

	_, err = g.services.Worker.Create(worker)
	if err != nil {
		logger.Error("Ошибка создания работника: %v", err)
		return err
	}

	logger.Info("Создан аккаунт работника: ID=%d, Email=worker@shinomontaj.ru, Password=%s", workerUserCreated.ID, workerPassword)

	// Создаем аккаунт менеджера
	managerPassword := "manager123"
	_, managerUserCreated, err := g.services.Auth.Register(models.SignUpInput{
		Name:     "Анна",
		Email:    "manager@shinomontaj.ru",
		Password: managerPassword,
		Role:     "manager",
	})
	if err != nil {
		logger.Error("Ошибка создания аккаунта менеджера: %v", err)
		return err
	}

	logger.Info("Создан аккаунт менеджера: ID=%d, Email=%s, Password=%s", managerUserCreated.ID, managerUserCreated.Email, managerPassword)

	return nil
}

// generateContracts создает договоры для разных типов клиентов
func (g *TestDataGenerator) generateContracts() error {
	logger.Info("Генерация договоров...")

	contracts := []models.Contract{
		{
			Number:     "ДОГ-001-2024",
			ClientType: "Наличка",
		},
		{
			Number:     "ДОГ-002-2024",
			ClientType: "Контрагент",
		},
		{
			Number:     "ДОГ-003-2024",
			ClientType: "Агрегатор",
		},
		{
			Number:     "ДОГ-004-2024",
			ClientType: "Контрагент",
		},
		{
			Number:     "ДОГ-005-2024",
			ClientType: "Агрегатор",
		},
	}

	for _, contract := range contracts {
		_, err := g.services.Contract.Create(contract)
		if err != nil {
			logger.Error("Ошибка создания договора %s: %v", contract.Number, err)
			return err
		}
		logger.Info("Создан договор: %s для типа клиентов: %s", contract.Number, contract.ClientType)
	}

	return nil
}

// generateClients создает клиентов разных типов
func (g *TestDataGenerator) generateClients() error {
	logger.Info("Генерация клиентов...")

	clients := []models.Client{
		{
			Name:         "ООО 'Автосервис Плюс'",
			ClientType:   "Контрагент",
			OwnerPhone:   "+7 (495) 123-45-67",
			ManagerPhone: "+7 (495) 123-45-68",
			ContractID:   2, // ДОГ-002-2024
		},
		{
			Name:         "ИП Сидоров А.А.",
			ClientType:   "Наличка",
			OwnerPhone:   "+7 (999) 111-22-33",
			ManagerPhone: "+7 (999) 111-22-33",
			ContractID:   1, // ДОГ-001-2024
		},
		{
			Name:         "ООО 'Такси Экспресс'",
			ClientType:   "Агрегатор",
			OwnerPhone:   "+7 (495) 555-66-77",
			ManagerPhone: "+7 (495) 555-66-78",
			ContractID:   3, // ДОГ-003-2024
		},
		{
			Name:         "ООО 'Грузоперевозки'",
			ClientType:   "Контрагент",
			OwnerPhone:   "+7 (495) 777-88-99",
			ManagerPhone: "+7 (495) 777-88-90",
			ContractID:   4, // ДОГ-004-2024
		},
		{
			Name:         "ИП Козлов В.В.",
			ClientType:   "Наличка",
			OwnerPhone:   "+7 (999) 444-55-66",
			ManagerPhone: "+7 (999) 444-55-66",
			ContractID:   1, // ДОГ-001-2024
		},
		{
			Name:         "ООО 'Доставка Быстро'",
			ClientType:   "Агрегатор",
			OwnerPhone:   "+7 (495) 999-00-11",
			ManagerPhone: "+7 (495) 999-00-12",
			ContractID:   5, // ДОГ-005-2024
		},
	}

	for _, client := range clients {
		clientID, err := g.services.Client.Create(client)
		if err != nil {
			logger.Error("Ошибка создания клиента %s: %v", client.Name, err)
			return err
		}

		// Добавляем автомобили для клиента
		if err := g.addCarsToClient(clientID, client.ClientType); err != nil {
			logger.Error("Ошибка добавления автомобилей для клиента %s: %v", client.Name, err)
			return err
		}

		logger.Info("Создан клиент: ID=%d, %s (тип: %s)", clientID, client.Name, client.ClientType)
	}

	return nil
}

// addCarsToClient добавляет автомобили клиенту
func (g *TestDataGenerator) addCarsToClient(clientID int, clientType string) error {
	carCount := 1
	if clientType == "Контрагент" || clientType == "Агрегатор" {
		carCount = rand.Intn(5) + 3 // 3-7 автомобилей
	}

	cars := []models.Car{
		{Number: generateCarNumber(), Model: "Toyota Camry", Year: 2020},
		{Number: generateCarNumber(), Model: "Honda Accord", Year: 2019},
		{Number: generateCarNumber(), Model: "Nissan Altima", Year: 2021},
		{Number: generateCarNumber(), Model: "Ford Focus", Year: 2018},
		{Number: generateCarNumber(), Model: "Volkswagen Passat", Year: 2022},
		{Number: generateCarNumber(), Model: "BMW 3 Series", Year: 2021},
		{Number: generateCarNumber(), Model: "Mercedes C-Class", Year: 2020},
	}

	for i := 0; i < carCount && i < len(cars); i++ {
		if err := g.services.Client.AddCarToClient(clientID, cars[i]); err != nil {
			return err
		}
	}

	return nil
}

// generateServices создает услуги для каждого договора
func (g *TestDataGenerator) generateServices() error {
	logger.Info("Генерация услуг...")

	// Базовые услуги с ценами для налички (договор ID=1)
	cashServices := map[string]int{
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

	// Создаем услуги для договора налички (ID=1)
	for name, price := range cashServices {
		service := models.Service{
			Name:           name,
			Price:          price,
			ContractID:     1, // Договор для налички
			MaterialCardId: 1, // Материальная карта ID=1
		}
		_, err := g.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка создания услуги %s: %v", name, err)
			return err
		}
	}

	// Создаем услуги для договора контрагентов (ID=2) с скидкой 10%
	for name, price := range cashServices {
		service := models.Service{
			Name:           name,
			Price:          int(float64(price) * 0.9), // 10% скидка
			ContractID:     2, // Договор для контрагентов
			MaterialCardId: 1, // Материальная карта ID=1
		}
		_, err := g.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка создания услуги %s: %v", name, err)
			return err
		}
	}

	// Создаем услуги для договора агрегаторов (ID=3) с скидкой 15%
	for name, price := range cashServices {
		service := models.Service{
			Name:           name,
			Price:          int(float64(price) * 0.85), // 15% скидка
			ContractID:     3, // Договор для агрегаторов
			MaterialCardId: 1, // Материальная карта ID=1
		}
		_, err := g.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка создания услуги %s: %v", name, err)
			return err
		}
	}

	// Создаем услуги для второго договора контрагентов (ID=4) с скидкой 12%
	for name, price := range cashServices {
		service := models.Service{
			Name:           name,
			Price:          int(float64(price) * 0.88), // 12% скидка
			ContractID:     4,
			MaterialCardId: 1, // Материальная карта ID=1
		}
		_, err := g.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка создания услуги %s: %v", name, err)
			return err
		}
	}

	// Создаем услуги для второго договора агрегаторов (ID=5) с скидкой 18%
	for name, price := range cashServices {
		service := models.Service{
			Name:           name,
			Price:          int(float64(price) * 0.82), // 18% скидка
			ContractID:     5,
			MaterialCardId: 1, // Материальная карта ID=1
		}
		_, err := g.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка создания услуги %s: %v", name, err)
			return err
		}
	}

	logger.Info("Услуги успешно созданы для всех договоров")
	return nil
}

// generateMaterialCards создает материальные карты
func (g *TestDataGenerator) generateMaterialCards() error {
	logger.Info("Генерация материальных карт...")

	materialCard := models.MaterialCard{
		Rs25:  100,
		R19:   150,
		R20:   120,
		R25:   80,
		R251:  60,
		R13:   200,
		R15:   180,
		Foot9: 50,
		Foot12: 40,
		Foot15: 30,
	}

	_, err := g.services.MaterialCard.Create(materialCard)
	if err != nil {
		logger.Error("Ошибка создания материальной карты: %v", err)
		return err
	}

	logger.Info("Материальная карта успешно создана")
	return nil
}

// generateCarNumber генерирует случайный номер автомобиля
func generateCarNumber() string {
	letters := []string{"А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ы", "Ь", "Э", "Ю", "Я"}
	
	// Генерируем номер в формате А123БВ77
	letter1 := letters[rand.Intn(len(letters))]
	digits1 := rand.Intn(900) + 100 // 100-999
	letter2 := letters[rand.Intn(len(letters))]
	letter3 := letters[rand.Intn(len(letters))]
	digits2 := rand.Intn(90) + 10 // 10-99
	
	return fmt.Sprintf("%s%d%s%s%d", letter1, digits1, letter2, letter3, digits2)
}