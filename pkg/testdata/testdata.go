package testdata

import (
	"fmt"
	"go-hinomontaj/internal/service"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"math/rand"
	"strings"
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

	// 1. Сначала создаем базовые материалы
	if err := g.generateMaterials(); err != nil {
		return err
	}

	// 2. Генерируем договоры
	contractIDs, err := g.generateContracts()
	if err != nil {
		return err
	}

	// 3. Генерируем услуги для каждого договора
	if err := g.generateServices(contractIDs); err != nil {
		return err
	}

	// 4. Генерируем клиентов
	clientIDs, err := g.generateClients(contractIDs)
	if err != nil {
		return err
	}

	// 5. Создаем краевой случай: общая машина для двух агрегаторов
	if err := g.createSharedCarForAggregators(clientIDs); err != nil {
		return err
	}

	// 6. Генерируем аккаунты (в конце, чтобы избежать конфликтов)
	if err := g.generateAccounts(); err != nil {
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
		// Если пользователь уже существует, просто логируем и продолжаем
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "already exists") {
			logger.Info("Аккаунт работника уже существует")
		} else {
			logger.Error("Ошибка создания аккаунта работника: %v", err)
			return err
		}
	} else {
		// Создаем работника
		worker := models.Worker{
			Name:         "Иван",
			Surname:      "Петров",
			Email:        "worker@shinomontaj.ru",
			Phone:        "+7 (999) 123-45-67",
			SalarySchema: "percentage",
			Salary:       50000,
			HasCar:       true,
		}

		_, err = g.services.Worker.Create(worker)
		if err != nil {
			logger.Error("Ошибка создания работника: %v", err)
			return err
		}

		logger.Info("Создан аккаунт работника: ID=%d, Email=worker@shinomontaj.ru, Password=%s", workerUserCreated.ID, workerPassword)
	}

	// Создаем аккаунт менеджера
	managerPassword := "manager123"
	_, managerUserCreated, err := g.services.Auth.Register(models.SignUpInput{
		Name:     "Анна",
		Email:    "manager@shinomontaj.ru",
		Password: managerPassword,
		Role:     "manager",
	})
	if err != nil {
		// Если пользователь уже существует, просто логируем и продолжаем
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "already exists") {
			logger.Info("Аккаунт менеджера уже существует")
		} else {
			logger.Error("Ошибка создания аккаунта менеджера: %v", err)
			return err
		}
	} else {
		logger.Info("Создан аккаунт менеджера: ID=%d, Email=%s, Password=%s", managerUserCreated.ID, managerUserCreated.Email, managerPassword)
	}

	return nil
}

// generateContracts создает договоры для разных типов клиентов
func (g *TestDataGenerator) generateContracts() ([]int, error) {
	logger.Info("Генерация договоров...")

	contracts := []models.Contract{
		// Договор для налички уже создан в миграции (CASH-001), поэтому пропускаем его
		{
			Number:               "ДОГ-002-2024",
			Description:          "Договор для контрагентов",
			ClientType:           "КОНТРАГЕНТЫ",
			ClientCompanyName:    "ООО Контрагент",
			ClientCompanyAddress: "г. Москва, ул. Пример, д. 1",
			ClientCompanyPhone:   "+7 (495) 123-45-67",
			ClientCompanyEmail:   "contractor@example.com",
			ClientCompanyINN:     "1234567890",
			ClientCompanyKPP:     "123456789",
			ClientCompanyOGRN:    "1234567890123",
		},
		{
			Number:               "ДОГ-003-2024",
			Description:          "Договор для агрегаторов (Яндекс Такси)",
			ClientType:           "АГРЕГАТОРЫ",
			ClientCompanyName:    "ООО Яндекс Такси",
			ClientCompanyAddress: "г. Москва, ул. Льва Толстого, д. 16",
			ClientCompanyPhone:   "+7 (495) 555-66-77",
			ClientCompanyEmail:   "yandex@aggregator.ru",
			ClientCompanyINN:     "9876543210",
			ClientCompanyKPP:     "987654321",
			ClientCompanyOGRN:    "9876543210987",
		},
		{
			Number:               "ДОГ-004-2024",
			Description:          "Договор для агрегаторов (Ситимобил)",
			ClientType:           "АГРЕГАТОРЫ",
			ClientCompanyName:    "ООО Ситимобил",
			ClientCompanyAddress: "г. Москва, ул. Садовническая, д. 82",
			ClientCompanyPhone:   "+7 (495) 777-88-99",
			ClientCompanyEmail:   "citymobil@aggregator.ru",
			ClientCompanyINN:     "1122334455",
			ClientCompanyKPP:     "112233445",
			ClientCompanyOGRN:    "1122334455667",
		},
	}

	contractIDs := make([]int, 0, len(contracts))
	for _, contract := range contracts {
		id, err := g.services.Contract.Create(contract)
		if err != nil {
			logger.Error("Ошибка создания договора %s: %v", contract.Number, err)
			return nil, err
		}
		contractIDs = append(contractIDs, id)
		logger.Info("Создан договор: %s для типа клиентов: %s (ID: %d)", contract.Number, contract.ClientType, id)
	}

	return contractIDs, nil
}

// generateClients создает клиентов разных типов
func (g *TestDataGenerator) generateClients(contractIDs []int) (map[string]int, error) {
	logger.Info("Генерация клиентов...")

	clientIDs := make(map[string]int)

	clients := []models.Client{
		{
			Name:         "Наличка",
			ClientType:   "НАЛИЧКА",
			OwnerPhone:   "+7 (000) 000-00-00",
			ManagerPhone: "+7 (000) 000-00-00",
			ContractID:   1, // Используем существующий договор CASH-001 из миграции
		},
		{
			Name:         "ООО 'Автосервис Плюс'",
			ClientType:   "КОНТРАГЕНТЫ",
			OwnerPhone:   "+7 (495) 123-45-67",
			ManagerPhone: "+7 (495) 123-45-68",
			ContractID:   contractIDs[0], // Договор для контрагентов
		},
		{
			Name:         "Яндекс Такси",
			ClientType:   "АГРЕГАТОРЫ",
			OwnerPhone:   "+7 (495) 555-66-77",
			ManagerPhone: "+7 (495) 555-66-78",
			ContractID:   contractIDs[1], // Договор Яндекс Такси
		},
		{
			Name:         "ООО 'Грузоперевозки'",
			ClientType:   "КОНТРАГЕНТЫ",
			OwnerPhone:   "+7 (495) 777-88-99",
			ManagerPhone: "+7 (495) 777-88-90",
			ContractID:   contractIDs[0], // Договор для контрагентов
		},
		{
			Name:         "ИП Козлов В.В.",
			ClientType:   "НАЛИЧКА",
			OwnerPhone:   "+7 (999) 444-55-66",
			ManagerPhone: "+7 (999) 444-55-66",
			ContractID:   1, // Используем существующий договор CASH-001 из миграции
		},
		{
			Name:         "Ситимобил",
			ClientType:   "АГРЕГАТОРЫ",
			OwnerPhone:   "+7 (495) 999-00-11",
			ManagerPhone: "+7 (495) 999-00-12",
			ContractID:   contractIDs[2], // Договор Ситимобил
		},
	}

	for _, client := range clients {
		clientID, err := g.services.Client.Create(client)
		if err != nil {
			logger.Error("Ошибка создания клиента %s: %v", client.Name, err)
			return nil, err
		}

		// Сохраняем ID клиента
		clientIDs[client.Name] = clientID

		// Добавляем автомобили для клиента (кроме "Наличка")
		if client.Name != "Наличка" {
			if err := g.addCarsToClient(clientID, client.ClientType); err != nil {
				logger.Error("Ошибка добавления автомобилей для клиента %s: %v", client.Name, err)
				return nil, err
			}
		}

		logger.Info("Создан клиент: ID=%d, %s (тип: %s)", clientID, client.Name, client.ClientType)
	}

	return clientIDs, nil
}

// addCarsToClient добавляет автомобили клиенту
func (g *TestDataGenerator) addCarsToClient(clientID int, clientType string) error {
	carCount := 1
	if clientType == "КОНТРАГЕНТЫ" || clientType == "АГРЕГАТОРЫ" {
		carCount = rand.Intn(3) + 2 // 2-4 автомобиля
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
func (g *TestDataGenerator) generateServices(contractIDs []int) error {
	logger.Info("Генерация услуг...")

	// Базовые услуги с ценами для налички
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

	// Сначала создаем услуги для договора налички (CASH-001, ID=1)
	logger.Info("Создание услуг для договора налички (CASH-001, ID=1)")
	for name, price := range baseServices {
		service := models.Service{
			Name:       name,
			Price:      price, // Полная цена для налички
			ContractID: 1,     // ID договора CASH-001
		}

		_, err := g.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка создания услуги %s для договора налички: %v", name, err)
			return err
		}
	}
	logger.Info("Создано %d услуг для договора налички (CASH-001)", len(baseServices))

	// Коэффициенты скидки для разных типов договоров
	discountMultipliers := []float64{0.9, 0.85, 0.80} // контрагенты, Яндекс Такси, Ситимобил

	for i, contractID := range contractIDs {
		multiplier := discountMultipliers[i%len(discountMultipliers)]

		for name, basePrice := range baseServices {
			finalPrice := int(float64(basePrice) * multiplier)

			service := models.Service{
				Name:       name,
				Price:      finalPrice,
				ContractID: contractID,
			}

			_, err := g.services.Service.Create(service)
			if err != nil {
				logger.Error("Ошибка создания услуги %s для договора %d: %v", name, contractID, err)
				return err
			}
		}

		logger.Info("Создано %d услуг для договора ID:%d (множитель цены: %.2f)", len(baseServices), contractID, multiplier)
	}

	return nil
}

// generateMaterials создает базовые материалы
func (g *TestDataGenerator) generateMaterials() error {
	logger.Info("Генерация базовых материалов...")

	materials := []models.Material{
		{Name: "Резина 25", TypeDS: 1, Storage: 100},
		{Name: "Резина 19", TypeDS: 1, Storage: 150},
		{Name: "Резина 20", TypeDS: 1, Storage: 120},
		{Name: "Резина 25.1", TypeDS: 1, Storage: 80},
		{Name: "Резина 13", TypeDS: 1, Storage: 200},
		{Name: "Резина 15", TypeDS: 1, Storage: 180},
		{Name: "Колодки 9", TypeDS: 2, Storage: 50},
		{Name: "Колодки 12", TypeDS: 2, Storage: 40},
		{Name: "Колодки 15", TypeDS: 2, Storage: 30},
	}

	createdCount := 0
	for _, material := range materials {
		// Проверяем, существует ли уже материал с таким именем и типом
		existingMaterials, err := g.services.Material.GetAll()
		if err != nil {
			logger.Error("Ошибка при получении существующих материалов: %v", err)
			return err
		}

		// Проверяем, есть ли уже материал с таким именем
		materialExists := false
		for _, existing := range existingMaterials {
			if existing.Name == material.Name && existing.TypeDS == material.TypeDS {
				logger.Debug("Материал %s (тип ДС: %d) уже существует, пропускаем", material.Name, material.TypeDS)
				materialExists = true
				break
			}
		}

		if !materialExists {
			if err := g.services.Material.Create(material); err != nil {
				logger.Error("Ошибка создания материала %s: %v", material.Name, err)
				return err
			}
			createdCount++
			logger.Debug("Создан материал: %s (тип ДС: %d)", material.Name, material.TypeDS)
		}
	}

	logger.Info("Материалы проверены, создано новых: %d", createdCount)
	return nil
}

// createSharedCarForAggregators создает общую машину для двух агрегаторов
func (g *TestDataGenerator) createSharedCarForAggregators(clientIDs map[string]int) error {
	logger.Info("Создание общей машины для агрегаторов...")

	// Получаем ID клиентов-агрегаторов
	yandexID, yandexExists := clientIDs["Яндекс Такси"]
	citymobilID, citymobilExists := clientIDs["Ситимобил"]

	if !yandexExists || !citymobilExists {
		logger.Warning("Не найдены клиенты-агрегаторы для создания общей машины")
		return nil
	}

	// Создаем общую машину
	sharedCar := models.Car{
		Number: "A777BB777",    // Специальный номер для краевого случая (латинские буквы)
		Model:  "Toyota Prius", // Типичная машина для такси
		Year:   2021,
	}

	// Добавляем машину первому агрегатору (Яндекс Такси)
	err := g.services.Client.AddCarToClient(yandexID, sharedCar)
	if err != nil {
		logger.Error("Ошибка добавления общей машины к Яндекс Такси: %v", err)
		return err
	}

	// Добавляем ту же машину второму агрегатору (Ситимобил)
	// Машина уже существует в БД, поэтому создается только связь в clients_cars
	err = g.services.Client.AddCarToClient(citymobilID, sharedCar)
	if err != nil {
		logger.Error("Ошибка добавления общей машины к Ситимобил: %v", err)
		return err
	}

	logger.Info("Создана общая машина %s для агрегаторов: Яндекс Такси (ID:%d) и Ситимобил (ID:%d)",
		sharedCar.Number, yandexID, citymobilID)

	return nil
}

// generateCarNumber генерирует случайный номер автомобиля
func generateCarNumber() string {
	// Используем латинские буквы для соответствия регулярному выражению в БД
	letters := []string{"A", "B", "C", "E", "H", "K", "M", "O", "P", "T", "X", "Y"}

	// Генерируем номер в формате A123BC77
	letter1 := letters[rand.Intn(len(letters))]
	digits1 := rand.Intn(900) + 100 // 100-999
	letter2 := letters[rand.Intn(len(letters))]
	letter3 := letters[rand.Intn(len(letters))]
	digits2 := rand.Intn(90) + 10 // 10-99

	return fmt.Sprintf("%s%d%s%s%d", letter1, digits1, letter2, letter3, digits2)
}
