package handlers

import (
	"fmt"
	"go-hinomontaj/internal/service"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Handler struct для работы с сервисом
type Handler struct {
	services *service.Services
}

// NewHandler создает новый обработчик с сервисом
func NewHandler(services *service.Services) *Handler {
	return &Handler{services: services}
}

// InitRoutes инициализирует маршруты для обработки HTTP запросов
func (h *Handler) InitRoutes() *gin.Engine {
	logger.Info("Инициализация маршрутов API")
	router := gin.Default()

	// Настройка CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true // Разрешаем все домены
		},
		MaxAge: 12 * 60 * 60,
	}))

	// Добавляем обработчик OPTIONS запросов
	router.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	router.Static("/static", "./static")

	api := router.Group("/api")
	
	// Роут для онлайн записи (без аутентификации)
	api.POST("/date", h.Date)

	auth := api.Group("/auth")
	{
		auth.POST("/login", h.Login)
		auth.POST("/register", h.Register)
	}

	api.Use(h.authMiddleware)

	api.GET("/services", h.GetServices)
	api.GET("/services/:id/prices", h.GetServicePricesByContract)
	api.GET("/client-types", h.clientTypes)
	api.GET("/clients", h.GetClient)

	worker := api.Group("/worker")
	worker.Use(h.workerRoleMiddleware)
	{
		worker.GET("", h.GetMyOrders)
		worker.POST("", h.CreateOrder)
		//worker.GET("/statistics", h.GetWorkerStatistics)
	}

	manager := api.Group("/manager")
	manager.Use(h.managerRoleMiddleware)
	{
		orders := manager.Group("/orders")
		{
			orders.GET("", h.GetOrders)
			orders.POST("", h.CreateOrder)
			orders.PUT("/:id", h.UpdateOrder)
			orders.DELETE("/:id", h.DeleteOrder)
		}
		manager.GET("/statistics", h.GetOrderStatistics)

		// Управление клиентами
		clients := manager.Group("/clients")
		{
			clients.GET("", h.GetClient)
			clients.POST("", h.CreateClient)
			clients.PUT("/:id", h.UpdateClient)
			clients.DELETE("/:id", h.DeleteClient)
			clients.GET("/:id/vehicles", h.GetClientCars)
			clients.POST("/:id/vehicles", h.CreateClientCar)
			clients.POST("/:id/vehicles/upload", h.UploadClientCars)
			clients.GET("/vehicles/template", h.GetCarsTemplate)

			clients.GET("/whoose/:car", h.WhooseCar)
			clients.GET("/compare/:car", h.CompareClientsForCar)

			clients.GET("/onlinedate", h.GetOnlineDate) // получить все онлайн встречи
			clients.POST("/onlinedate", h.CreateOnlineDate) // создать новую онлайн встречу
			clients.PUT("/onlinedate", h.UpdateOnlineDate) // отредактировать встречу, например чтобы написать заметку
		}

		// Управление сотрудниками
		workers := manager.Group("/workers")
		{
			workers.GET("", h.GetWorkers)
			workers.POST("", h.CreateWorker)
			workers.GET("/:id", h.GetWorker)
			workers.PUT("/:id", h.UpdateWorker)
			workers.DELETE("/:id", h.DeleteWorker)

			workers.POST("/penalties", h.AddPenalty)
			workers.GET("/penalties/:id", h.GetPenalties)

			workers.POST("bonuses", h.AddBonus)
			workers.GET("bonuses/:id", h.GetBonuses)

			workers.GET("statistics/:id", h.GetStatistics)

		}
		services := manager.Group("/services")
		{
			services.GET("", h.GetServices)
			services.GET("/with-prices", h.GetServicesWithPrices)
			services.POST("", h.CreateService)
			services.PUT("/:id", h.UpdateService)
			services.DELETE("/:id", h.DeleteService)
		}

		// Управление договорами
		contracts := manager.Group("/contracts")
		{
			contracts.GET("", h.GetContracts)
			contracts.POST("", h.CreateContract)
			contracts.GET("/:id", h.GetContract)
			contracts.PUT("/:id", h.UpdateContract)
			contracts.DELETE("/:id", h.DeleteContract)
		}

		// Управление материалами
		materialCards := manager.Group("/material-cards")
		{
			materialCards.GET("", h.GetMaterialCards)
			materialCards.POST("", h.CreateMaterialCard)
			materialCards.PUT("/:id", h.UpdateMaterialCard)
			materialCards.DELETE("/:id", h.DeleteMaterialCard)
			materialCards.GET("/storage", h.GetStorage)
			materialCards.POST("/delivery", h.AddDelivery)
		}

	}

	logger.Info("Маршруты API успешно инициализированы")
	return router
}

func (h *Handler) Login(c *gin.Context) {
	logger.Debug("Получен запрос на вход в систему")
	var input models.SignInInput

	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при входе: %v, body: %v", err, c.Request.Body)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	logger.Debug("Попытка входа для пользователя: %s", input.Email)

	token, user, err := h.services.Auth.Login(input)
	if err != nil {
		logger.Warning("Ошибка аутентификации для %s: %v", input.Email, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешный вход пользователя: %s с ролью %s", user.Email, user.Role)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func (h *Handler) Register(c *gin.Context) {
	logger.Debug("Получен запрос на регистрацию")
	var input models.SignUpInput

	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при регистрации: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	token, user, err := h.services.Auth.Register(input)
	if err != nil {
		logger.Error("Ошибка при регистрации пользователя: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешная регистрация пользователя: %s", user.Email)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func (h *Handler) GetOrders(c *gin.Context) {
	logger.Debug("Получен запрос на получение всех заказов")
	orders, err := h.services.Order.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении заказов: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Для каждого заказа получаем информацию о клиенте
	for i := range orders {
		client, err := h.services.Client.GetById(orders[i].ClientID)
		if err != nil {
			logger.Error("Ошибка при получении данных клиента для заказа %d: %v", orders[i].ID, err)
			continue
		}
		orders[i].Client = &client
	}

	logger.Debug("Успешно получено %d заказов", len(orders))
	c.JSON(http.StatusOK, orders)
}

func (h *Handler) GetMyOrders(c *gin.Context) {
	workerId, _ := c.Get("userId")
	logger.Debug("Получен запрос на получение заказов работника ID:%v", workerId)

	// Получаем worker_id из user_id
	worker, err := h.services.Worker.GetByUserId(workerId.(int))
	if err != nil {
		logger.Error("Ошибка при получении данных работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при получении данных работника"})
		return
	}

	orders, err := h.services.Order.GetByWorkerId(worker.ID)
	if err != nil {
		logger.Error("Ошибка при получении заказов работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Для каждого заказа получаем информацию о клиенте
	for i := range orders {
		client, err := h.services.Client.GetById(orders[i].ClientID)
		if err != nil {
			logger.Error("Ошибка при получении данных клиента для заказа %d: %v", orders[i].ID, err)
			continue
		}
		orders[i].Client = &client
	}

	logger.Debug("Успешно получено %d заказов для работника ID:%v", len(orders), worker.ID)
	c.JSON(http.StatusOK, orders)
}

func (h *Handler) CreateOrder(c *gin.Context) {
	logger.Debug("Получен запрос на создание заказа")
	var input models.Order
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании заказа: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}



	// Валидация обязательных полей
	if input.ClientID == 0 {
		logger.Warning("Не указан ID клиента")
		c.JSON(http.StatusBadRequest, gin.H{"error": "не указан ID клиента"})
		return
	}
	if input.VehicleNumber == "" {
		logger.Warning("Не указан номер автомобиля")
		c.JSON(http.StatusBadRequest, gin.H{"error": "не указан номер автомобиля"})
		return
	}
	if input.PaymentMethod == "" {
		logger.Warning("Не указан способ оплаты")
		c.JSON(http.StatusBadRequest, gin.H{"error": "не указан способ оплаты"})
		return
	}
	if len(input.Services) == 0 {
		logger.Warning("Не указаны услуги")
		c.JSON(http.StatusBadRequest, gin.H{"error": "не указаны услуги"})
		return
	}

	// Валидация услуг
	for _, service := range input.Services {
		if service.ServiceID == 0 {
			logger.Warning("Не указан ID услуги")
			c.JSON(http.StatusBadRequest, gin.H{"error": "не указан ID услуги"})
			return
		}
		if service.Price < 0 {
			logger.Warning("Неверная цена услуги")
			c.JSON(http.StatusBadRequest, gin.H{"error": "неверная цена услуги"})
			return
		}
	}

	// Проверяем роль пользователя
	userRole, _ := c.Get("userRole")
	if userRole == "worker" {
		// Если заказ создает работник, берем его ID из контекста
		userId, _ := c.Get("userId")
		worker, err := h.services.Worker.GetByUserId(userId.(int))
		if err != nil {
			logger.Error("Ошибка при получении данных работника: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при получении данных работника"})
			return
		}
		input.WorkerID = worker.ID
	} else {
		// Если заказ создает менеджер, worker_id должен быть указан в запросе
		if input.WorkerID == 0 {
			logger.Warning("Не указан ID работника")
			c.JSON(http.StatusBadRequest, gin.H{"error": "не указан ID работника"})
			return
		}
	}

	id, err := h.services.Order.Create(input)
	if err != nil {
		logger.Error("Ошибка при создании заказа: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создан заказ ID:%d работником ID:%d", id, input.WorkerID)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID заказа при обновлении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на обновление заказа ID:%d", id)
	var input models.Order
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении заказа: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	if err := h.services.Order.Update(id, input); err != nil {
		logger.Error("Ошибка при обновлении заказа ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно обновлен заказ ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно обновлено"})
}

func (h *Handler) DeleteOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID заказа при удалении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на удаление заказа ID:%d", id)
	if err := h.services.Order.Delete(id); err != nil {
		logger.Error("Ошибка при удалении заказа ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно удален заказ ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно удалено"})
}

func (h *Handler) GetOrderStatistics(c *gin.Context) {
	logger.Debug("Получен запрос на получение статистики")
	var stats models.Statistics
	//stats, err := h.services.Order.GetStatistics()
	//if err != nil {
	//	logger.Error("Ошибка при получении статистики: %v", err)
	//	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	//	return
	//}
	//logger.Debug("Статистика успешно получена")
	c.JSON(http.StatusOK, stats)
}

// Методы для работы с сотрудниками
func (h *Handler) GetWorkers(c *gin.Context) {
	logger.Debug("Получен запрос на получение списка работников")
	workers, err := h.services.Worker.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка работников: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d работников", len(workers))
	c.JSON(http.StatusOK, workers)
}

func (h *Handler) CreateWorker(c *gin.Context) {
	var input struct {
		Name         string `json:"name"`
		Surname      string `json:"surname"`
		Email        string `json:"email"`
		Phone        string `json:"phone"`
		SalarySchema string `json:"salary_schema"`
		TmpSalary    int    `json:"tmp_salary"`
		HasCar       bool   `json:"has_car"`
		Password     string `json:"password"`
		Role         string `json:"role"`
	}

	if err := c.BindJSON(&input); err != nil {
		logger.Error("Ошибка при разборе JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	logger.Debug("Получены данные для создания работника: %+v", input)

	// Создаем учетную запись пользователя с данными из запроса
	loginInput := models.SignUpInput{
		Name:     input.Name,
		Email:    input.Email,
		Password: input.Password,
		Role:     input.Role,
	}

	logger.Debug("Данные для регистрации: %+v", loginInput)

	_, user, err := h.services.Auth.Register(loginInput)
	if err != nil {
		logger.Error("Ошибка при создании учетной записи работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Создаем запись в таблице workers
	workerInput := models.Worker{
		Name:         input.Name,
		Surname:      input.Surname,
		Email:        input.Email,
		Phone:        input.Phone,
		SalarySchema: input.SalarySchema,
		Salary:       input.TmpSalary,
		HasCar:       input.HasCar,
	}

	workerId, err := h.services.Worker.Create(workerInput)
	if err != nil {
		logger.Error("Ошибка при создании записи работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создан работник ID:%d с учетной записью %s", workerId, user.Email)
	c.JSON(http.StatusCreated, gin.H{"id": workerId})
}

func (h *Handler) GetWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	worker, err := h.services.Worker.GetById(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, worker)
}

func (h *Handler) UpdateWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	var input models.Worker
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	if err := h.services.Worker.Update(id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "успешно обновлено"})
}

func (h *Handler) DeleteWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	if err := h.services.Worker.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "успешно удалено"})
}

func (h *Handler) GetServices(c *gin.Context) {
	logger.Debug("Получен запрос на получение списка услуг")
	services, err := h.services.Service.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка услуг: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить список услуг"})
		return
	}

	logger.Info("Успешно получен список услуг")
	c.JSON(http.StatusOK, services)
}

func (h *Handler) GetServicesWithPrices(c *gin.Context) {
	logger.Debug("Получен запрос на получение всех услуг с ценами по договорам")
	services, err := h.services.Service.GetAllWithPrices()
	if err != nil {
		logger.Error("Ошибка при получении услуг с ценами: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d услуг с ценами", len(services))
	c.JSON(http.StatusOK, services)
}

func (h *Handler) GetServicePricesByContract(c *gin.Context) {
	contractId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Error("Неверный ID контракта: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID контракта"})
		return
	}
	prices, err := h.services.Service.GetServicePricesByContract(contractId)
	if err != nil {
		logger.Error("Ошибка при получении цен услуг по контракту: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить цены услуг по контракту"})
		return
	}
	c.JSON(http.StatusOK, prices)
}

func (h *Handler) CreateService(c *gin.Context) {
	logger.Debug("Получен запрос на создание услуги")
	var input struct {
		Name           string `json:"name"`
		Price          int    `json:"price"`
		ContractId     int    `json:"contract_id"`
		MaterialCardId int    `json:"material_card_id"`
	}

	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании услуги: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	service := models.Service{
		Name:           input.Name,
		Price:          input.Price,
		ContractID:     input.ContractId,
		MaterialCardId: input.MaterialCardId,
	}

	id, err := h.services.Service.Create(service)
	if err != nil {
		logger.Error("Ошибка при создании услуги: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при создании услуги"})
		return
	}

	logger.Info("Успешно создана услуга с ID: %d", id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateService(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID услуги при обновлении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на обновление услуги ID:%d", id)
	var input struct {
		Name           string `json:"name"`
		Price          int    `json:"price"`
		ContractId     int    `json:"contract_id"`
		MaterialCardId int    `json:"material_card_id"`
	}

	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении услуги: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	service := models.Service{
		Name:           input.Name,
		Price:          input.Price,
		ContractID:     input.ContractId,
		MaterialCardId: input.MaterialCardId,
	}

	if err := h.services.Service.Update(id, service); err != nil {
		logger.Error("Ошибка при обновлении услуги ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при обновлении услуги"})
		return
	}

	logger.Info("Успешно обновлена услуга ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"message": "услуга успешно обновлена"})
}

func (h *Handler) DeleteService(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID услуги при удалении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на удаление услуги ID:%d", id)
	if err := h.services.Service.Delete(id); err != nil {
		logger.Error("Ошибка при удалении услуги ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно удалена услуга ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно удалено"})
}

// Методы для работы с клиентами
func (h *Handler) GetClient(c *gin.Context) {
	logger.Debug("Получен запрос на получение списка клиентов")
	clients, err := h.services.Client.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка клиентов: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d клиентов", len(clients))
	c.JSON(http.StatusOK, clients)
}

func (h *Handler) CreateClient(c *gin.Context) {
	logger.Debug("Получен запрос на создание клиента")
	var input models.Client
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании клиента: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	id, err := h.services.Client.Create(input)
	if err != nil {
		logger.Error("Ошибка при создании клиента: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создан клиент ID:%d", id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateClient(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID клиента при обновлении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на обновление клиента ID:%d", id)
	var input models.Client
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении клиента: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	if err := h.services.Client.Update(id, input); err != nil {
		logger.Error("Ошибка при обновлении клиента ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно обновлен клиент ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно обновлено"})
}

func (h *Handler) DeleteClient(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID клиента при удалении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на удаление клиента ID:%d", id)
	if err := h.services.Client.Delete(id); err != nil {
		logger.Error("Ошибка при удалении клиента ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно удален клиент ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно удалено"})
}

func (h *Handler) clientTypes(c *gin.Context) {
	types, err := h.services.Client.GetTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, types)
}

// GetClientCars получает список автомобилей клиента
func (h *Handler) GetClientCars(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID клиента при получении автомобилей: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на получение автомобилей клиента ID:%d", id)
	cars, err := h.services.Client.GetClientCars(id)
	if err != nil {
		logger.Error("Ошибка при получении автомобилей клиента ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Debug("Успешно получено %d автомобилей для клиента ID:%d", len(cars), id)
	c.JSON(http.StatusOK, cars)
}

// CreateClientCar добавляет автомобиль клиенту
func (h *Handler) CreateClientCar(c *gin.Context) {
	clientId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Error("Неверный ID клиента: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID клиента"})
		return
	}

	var car models.Car
	if err := c.ShouldBindJSON(&car); err != nil {
		logger.Error("Ошибка при разборе данных автомобиля: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные автомобиля"})
		return
	}

	if err := h.services.Client.AddCarToClient(clientId, car); err != nil {
		logger.Error("Ошибка при добавлении автомобиля клиенту: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении автомобиля клиенту"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Автомобиль успешно добавлен"})
}

//func (h *Handler) GetWorkerStatistics(c *gin.Context) {
//	userId, _ := c.Get("userId")
//	logger.Debug("Получен запрос на получение статистики работника user_id:%v", userId)
//
//	// Получаем worker_id из user_id
//	worker, err := h.services.Worker.GetByUserId(userId.(int))
//	if err != nil {
//		logger.Error("Ошибка при получении данных работника: %v", err)
//		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при получении данных работника"})
//		return
//	}
//
//	stats, err := h.services.Worker.GetStatistics(worker.ID)
//	if err != nil {
//		logger.Error("Ошибка при получении статистики работника: %v", err)
//		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
//		return
//	}
//
//	logger.Debug("Успешно получена статистика для работника ID:%v", worker.ID)
//	c.JSON(http.StatusOK, stats)
//}

// UploadClientCars обрабатывает загрузку Excel файла с машинами клиента
func (h *Handler) UploadClientCars(c *gin.Context) {
	clientId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Error("Неверный ID клиента: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID клиента"})
		return
	}

	// Получаем файл из формы
	file, err := c.FormFile("file")
	if err != nil {
		logger.Error("Ошибка при получении файла: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не удалось получить файл"})
		return
	}

	// Открываем файл
	src, err := file.Open()
	if err != nil {
		logger.Error("Ошибка при открытии файла: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось открыть файл"})
		return
	}
	defer src.Close()

	// Читаем содержимое файла
	fileData := make([]byte, file.Size)
	_, err = src.Read(fileData)
	if err != nil {
		logger.Error("Ошибка при чтении файла: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось прочитать файл"})
		return
	}

	// Обрабатываем файл
	if err := h.services.Client.UploadCarsFromExcel(clientId, fileData); err != nil {
		logger.Error("Ошибка при обработке файла: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Ошибка при обработке файла: %v", err)})
		return
	}

	logger.Info("Успешно загружены машины для клиента ID:%d", clientId)
	c.JSON(http.StatusOK, gin.H{"message": "Машины успешно загружены"})
}

// GetCarsTemplate обрабатывает запрос на скачивание шаблона Excel файла
func (h *Handler) GetCarsTemplate(c *gin.Context) {
	logger.Debug("Получен запрос на скачивание шаблона Excel файла")

	// Генерируем шаблон
	template, err := h.services.Client.GetCarsTemplate()
	if err != nil {
		logger.Error("Ошибка при генерации шаблона: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать шаблон"})
		return
	}

	// Устанавливаем заголовки для скачивания файла
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename=cars_template.xlsx")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Expires", "0")
	c.Header("Cache-Control", "must-revalidate")
	c.Header("Pragma", "public")

	// Отправляем файл
	c.DataFromReader(http.StatusOK, int64(template.Len()), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", template, nil)

	logger.Info("Шаблон Excel файла успешно отправлен")
}

// Методы для работы с договорами
func (h *Handler) GetContracts(c *gin.Context) {
	logger.Debug("Получен запрос на получение списка договоров")
	contracts, err := h.services.Contract.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка договоров: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d договоров", len(contracts))
	c.JSON(http.StatusOK, contracts)
}

func (h *Handler) CreateContract(c *gin.Context) {
	logger.Debug("Получен запрос на создание договора")
	var input models.Contract
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании договора: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	id, err := h.services.Contract.Create(input)
	if err != nil {
		logger.Error("Ошибка при создании договора: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создан договор ID:%d", id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) GetContract(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID договора: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на получение договора ID:%d", id)
	contracts, err := h.services.Contract.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка договоров: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Ищем договор по ID
	for _, contract := range contracts {
		if contract.ID == id {
			logger.Debug("Успешно найден договор ID:%d", id)
			c.JSON(http.StatusOK, contract)
			return
		}
	}

	logger.Warning("Договор с ID:%d не найден", id)
	c.JSON(http.StatusNotFound, gin.H{"error": "договор не найден"})
}

func (h *Handler) UpdateContract(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID договора при обновлении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на обновление договора ID:%d", id)
	var input models.Contract
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении договора: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	if err := h.services.Contract.Update(id, input); err != nil {
		logger.Error("Ошибка при обновлении договора ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно обновлен договор ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно обновлено"})
}

func (h *Handler) DeleteContract(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID договора при удалении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на удаление договора ID:%d", id)
	if err := h.services.Contract.Delete(id); err != nil {
		logger.Error("Ошибка при удалении договора ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно удален договор ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно удалено"})
}

func (h *Handler) GetMaterialCards(c *gin.Context) {
	logger.Debug("Получен запрос на получение списка материалов")
	materialCards, err := h.services.MaterialCard.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка материалов: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d материалов", len(materialCards))
	c.JSON(http.StatusOK, materialCards)
}

func (h *Handler) CreateMaterialCard(c *gin.Context) {
	logger.Debug("Получен запрос на создание материала")
	var input models.MaterialCard
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании материала: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	id, err := h.services.MaterialCard.Create(input)
	if err != nil {
		logger.Error("Ошибка при создании материала: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создан материал ID:%d", id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateMaterialCard(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID материала при обновлении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на обновление материала ID:%d", id)
	var input models.MaterialCard
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении материала: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	if err := h.services.MaterialCard.Update(id, input); err != nil {
		logger.Error("Ошибка при обновлении материала ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно обновлен материал ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно обновлено"})
}

func (h *Handler) DeleteMaterialCard(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warning("Неверный ID материала при удалении: %s", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на удаление материала ID:%d", id)
	if err := h.services.MaterialCard.Delete(id); err != nil {
		logger.Error("Ошибка при удалении материала ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно удален материал ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно удалено"})
}

func (h *Handler) GetStorage(c *gin.Context) {
	var storage models.Storage
	logger.Debug("Получен запрос на получение списка материалов на складе")
	storage, err := h.services.MaterialCard.GetStorage()
	if err != nil {
		logger.Error("Ошибка при получении списка материалов на складе: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Debug("Успешно получен список материалов на складе")
	c.JSON(http.StatusOK, storage)
}

func (h *Handler) AddDelivery(c *gin.Context) {
	var delivery models.Storage
	logger.Debug("Получен запрос на добавление доставки")
	if err := c.BindJSON(&delivery); err != nil {
		logger.Warning("Ошибка привязки JSON при добавлении доставки: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}
	err := h.services.MaterialCard.AddDelivery(delivery)
	if err != nil {
		logger.Error("Ошибка при добавлении материалов на склад: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно добавлены материалы на склад")
	c.JSON(http.StatusOK, delivery)
}

func (h *Handler) AddPenalty(context *gin.Context) {
	var input struct {
		WorkerID    int    `json:"worker_id"`
		Amount      int    `json:"amount"`
		Description string `json:"description"`
	}
	logger.Debug("Получен запрос на добавление штрафа")
	if err := context.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при добавлении штрафа: %v", err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	// Получаем worker для проверки существования
	worker, err := h.services.Worker.GetById(input.WorkerID)
	if err != nil {
		logger.Error("Ошибка при получении данных работника %d: %v", input.WorkerID, err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "работник не найден"})
		return
	}

	// Конвертируем в модель PenaltyOrBonus
	penalty := models.PenaltyOrBonus{
		WorkerID: input.WorkerID,
		Amount:   input.Amount,
		Desc:     input.Description,
	}

	err = h.services.Worker.AddPenalty(penalty)
	if err != nil {
		logger.Error("Ошибка при добавлении штрафа: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Info("Успешно добавлен штраф работнику %s %s", worker.Name, worker.Surname)
	context.JSON(http.StatusOK, penalty)
}

func (h *Handler) GetPenalties(context *gin.Context) {
	var penalties []models.PenaltyOrBonus
	logger.Debug("Получен запрос на получение списка штрафов")

	id, err := strconv.Atoi(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}
	penalties, err = h.services.Worker.GetPenalties(id)
	if err != nil {
		logger.Error("Ошибка при получении списка штрафов: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d штрафов", len(penalties))
	context.JSON(http.StatusOK, penalties)
}

func (h *Handler) AddBonus(context *gin.Context) {
	var input struct {
		WorkerID    int    `json:"worker_id"`
		Amount      int    `json:"amount"`
		Description string `json:"description"`
	}
	logger.Debug("Получен запрос на добавление бонуса")
	if err := context.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при добавлении бонуса: %v", err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	// Получаем worker для проверки существования
	worker, err := h.services.Worker.GetById(input.WorkerID)
	if err != nil {
		logger.Error("Ошибка при получении данных работника %d: %v", input.WorkerID, err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "работник не найден"})
		return
	}

	// Конвертируем в модель PenaltyOrBonus
	bonus := models.PenaltyOrBonus{
		WorkerID: input.WorkerID,
		Amount:   input.Amount,
		Desc:     input.Description,
	}

	err = h.services.Worker.AddBonus(bonus)
	if err != nil {
		logger.Error("Ошибка при добавлении бонуса: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Info("Успешно добавлен бонус работнику %s %s", worker.Name, worker.Surname)
	context.JSON(http.StatusOK, bonus)
}

func (h *Handler) GetBonuses(context *gin.Context) {
	id, err := strconv.Atoi(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	logger.Debug("Получен запрос на получение списка бонусов")
	bonuses, err := h.services.Worker.GetBonuses(id)
	if err != nil {
		logger.Error("Ошибка при получении списка бонусов: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d бонусов", len(bonuses))
	context.JSON(http.StatusOK, bonuses)
}

func (h *Handler) GetStatistics(context *gin.Context) {
	id, err := strconv.Atoi(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный ID"})
		return
	}

	startStr := context.Query("start")
	endStr := context.Query("end")

	const layout = "2006-01-02" // формат даты: YYYY-MM-DD (например: 2025-07-16)

	start, err := time.Parse(layout, startStr)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат start, ожидается YYYY-MM-DD"})
		return
	}

	end, err := time.Parse(layout, endStr)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат end, ожидается YYYY-MM-DD"})
		return
	}

	logger.Debug("Получен запрос на получение статистики")
	statistics, err := h.services.Worker.GetStatistics(id, start, end)
	if err != nil {
		logger.Error("Ошибка при получении статистики: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	context.JSON(http.StatusOK, statistics)
}


func (h *Handler) UpdateOnlineDate(context *gin.Context) {
	var onlineDate models.OnlineDate
	logger.Debug("Получен запрос на получение даты")
	if err := context.BindJSON(&onlineDate); err != nil {
		logger.Warning("Ошибка привязки JSON при получении даты: %v", err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}
	err := h.services.Client.UpdateOnlineDate(onlineDate)
	if err != nil {
		logger.Error("Ошибка при получении даты: %v", err)
	}
	context.JSON(http.StatusOK, onlineDate)
}

func (h *Handler) Date(context *gin.Context) {
	var input struct {
		Name       string `json:"name"`
		Phone      string `json:"phone"`
		CarNumber  string `json:"car_number"`
		ClientDesc string `json:"client_desc"`
		Date       string `json:"date"`
	}
	
	logger.Debug("Получен запрос на создание онлайн записи")
	if err := context.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании записи: %v", err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}
	
	// Парсим дату из HTML datetime-local формата
	parsedDate, err := time.Parse("2006-01-02T15:04", input.Date)
	if err != nil {
		logger.Warning("Ошибка парсинга даты %s: %v", input.Date, err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат даты"})
		return
	}
	
	onlineDate := models.OnlineDate{
		Date:       parsedDate,
		Name:       input.Name,
		Phone:      input.Phone,
		CarNumber:  input.CarNumber,
		ClientDesc: input.ClientDesc,
	}
	
	err = h.services.Client.OnlineDate(&onlineDate)
	if err != nil {
		logger.Error("Ошибка при создании онлайн записи: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сохранения записи"})
		return
	}
	
	logger.Info("Создана онлайн запись: %s (%s) на %s для машины %s", 
		onlineDate.Name, onlineDate.Phone, onlineDate.Date.Format("2006-01-02 15:04"), onlineDate.CarNumber)
	context.JSON(http.StatusOK, gin.H{"message": "запись успешно создана", "id": onlineDate.ID})
}

func (h *Handler) GetOnlineDate(context *gin.Context) {
	logger.Debug("Получен запрос на получение списка онлайн встреч")
	dates, err := h.services.Client.GetOnlineDate()
	if err != nil {
		logger.Error("Ошибка при получении списка онлайн встреч: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d онлайн встреч", len(dates))
	context.JSON(http.StatusOK, dates)
}

func (h *Handler) CreateOnlineDate(context *gin.Context) {
	var onlineDate models.OnlineDate
	logger.Debug("Получен запрос на создание онлайн встречи")
	if err := context.BindJSON(&onlineDate); err != nil {
		logger.Warning("Ошибка привязки JSON при создании онлайн встречи: %v", err)
		context.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}
	
	if onlineDate.Name == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "не указано имя клиента"})
		return
	}
	if onlineDate.Phone == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "не указан телефон"})
		return
	}
	if onlineDate.CarNumber == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "не указан номер автомобиля"})
		return
	}
	
	err := h.services.Client.OnlineDate(&onlineDate)
	if err != nil {
		logger.Error("Ошибка при создании онлайн встречи: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Info("Успешно создана онлайн встреча для клиента: %s", onlineDate.Name)
	context.JSON(http.StatusCreated, onlineDate)
}

func (h *Handler) WhooseCar(context *gin.Context) {
	car := context.Param("car")
	whooseCar, err := h.services.Client.WhooseCar(car)
	if err != nil {
		logger.Error("Ошибка при получении данных о машине: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, whooseCar)
}

func (h *Handler) CompareClientsForCar(context *gin.Context) {
	car := context.Param("car")
	
	// Получаем клиентов машины
	clients, err := h.services.Client.WhooseCar(car)
	if err != nil {
		logger.Error("Ошибка при получении данных о машине: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(clients) == 0 {
		context.JSON(http.StatusNotFound, gin.H{"error": "машина не найдена"})
		return
	}

	// Для каждого клиента получаем цены услуг
	type ClientComparison struct {
		Client   models.Client    `json:"client"`
		Services []models.Service `json:"services"`
	}

	var comparisons []ClientComparison

	for _, client := range clients {
		services, err := h.services.Service.GetServicePricesByContract(client.ContractID)
		if err != nil {
			logger.Error("Ошибка при получении услуг для договора %d: %v", client.ContractID, err)
			// Продолжаем с пустым массивом услуг
			services = []models.Service{}
		}

		comparisons = append(comparisons, ClientComparison{
			Client:   client,
			Services: services,
		})
	}

	logger.Info("Сравнение клиентов для машины %s: найдено %d клиентов", car, len(comparisons))
	context.JSON(http.StatusOK, comparisons)
}
