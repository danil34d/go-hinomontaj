package handlers

import (
	"fmt"
	"go-hinomontaj/internal/service"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"net/http"
	"strconv"

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

	api := router.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/login", h.Login)
		auth.POST("/register", h.Register)
	}

	api.Use(h.authMiddleware)

	api.GET("/services", h.GetServices)
	api.GET("/client-types", h.clientTypes)
	api.GET("/clients", h.GetClient)

	worker := api.Group("/worker")
	worker.Use(h.workerRoleMiddleware)
	{
		worker.GET("", h.GetMyOrders)
		worker.POST("", h.CreateOrder)
		worker.GET("/statistics", h.GetWorkerStatistics)
	}

	manager := api.Group("/manager")
	manager.Use(h.managerRoleMiddleware)
	{
		manager.GET("", h.GetOrders)
		manager.PUT(":id", h.UpdateOrder)
		manager.DELETE(":id", h.DeleteOrder)
		manager.GET("/statistics", h.GetStatistics)

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
		}

		// Управление сотрудниками
		workers := manager.Group("/workers")
		{
			workers.GET("", h.GetWorkers)
			workers.POST("", h.CreateWorker)
			workers.GET("/:id", h.GetWorker)
			workers.PUT("/:id", h.UpdateWorker)
			workers.DELETE("/:id", h.DeleteWorker)
		}
		services := manager.Group("/services")
		{
			services.GET("", h.GetServices)
			services.POST("", h.CreateService)
			services.PUT("/:id", h.UpdateService)
			services.DELETE("/:id", h.DeleteService)
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
		if service.Description == "" {
			logger.Warning("Не указано описание услуги")
			c.JSON(http.StatusBadRequest, gin.H{"error": "не указано описание услуги"})
			return
		}
		if service.Price <= 0 {
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

func (h *Handler) GetStatistics(c *gin.Context) {
	logger.Debug("Получен запрос на получение статистики")
	stats, err := h.services.Order.GetStatistics()
	if err != nil {
		logger.Error("Ошибка при получении статистики: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Статистика успешно получена")
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
		Name     string `json:"name"`
		Surname  string `json:"surname"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
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
		Name:    input.Name,
		Surname: input.Surname,
		Salary:  0, // Устанавливаем начальную зарплату
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

// Методы для работы с услугами
func (h *Handler) GetServices(c *gin.Context) {
	logger.Debug("Получен запрос на получение списка услуг")
	services, err := h.services.Service.GetAll()
	if err != nil {
		logger.Error("Ошибка при получении списка услуг: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить список услуг"})
		return
	}

	// Группируем услуги по имени
	groupedServices := make(map[string]map[string]interface{})
	for _, service := range services {
		if _, exists := groupedServices[service.Name]; !exists {
			groupedServices[service.Name] = make(map[string]interface{})
			groupedServices[service.Name]["id"] = service.ID
			groupedServices[service.Name]["prices"] = make(map[string]int)
		}
		groupedServices[service.Name]["prices"].(map[string]int)[service.ClientType] = service.Price
	}

	// Преобразуем в массив для ответа
	var result []map[string]interface{}
	for name, data := range groupedServices {
		result = append(result, map[string]interface{}{
			"id":     data["id"],
			"name":   name,
			"prices": data["prices"],
		})
	}

	logger.Info("Успешно получен список услуг")
	c.JSON(http.StatusOK, result)
}

func (h *Handler) CreateService(c *gin.Context) {
	logger.Debug("Получен запрос на создание услуги")
	var input struct {
		Name   string             `json:"name"`
		Prices map[string]float64 `json:"prices"`
	}

	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании услуги: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	// Получаем все типы клиентов
	clientTypes, err := h.services.Client.GetTypes()
	if err != nil {
		logger.Error("Ошибка при получении типов клиентов: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить типы клиентов"})
		return
	}

	// Проверяем, что для каждого типа клиента указана цена
	for _, clientType := range clientTypes {
		if _, exists := input.Prices[clientType]; !exists {
			logger.Warning("Не указана цена для типа клиента: %s", clientType)
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("не указана цена для типа клиента: %s", clientType)})
			return
		}
	}

	// Создаем услугу для каждого типа клиента
	var serviceIds []int
	for clientType, price := range input.Prices {
		service := models.Service{
			Name:       input.Name,
			ClientType: clientType,
			Price:      int(price),
		}

		id, err := h.services.Service.Create(service)
		if err != nil {
			logger.Error("Ошибка при создании услуги для типа клиента %s: %v", clientType, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("ошибка при создании услуги для типа клиента %s: %v", clientType, err)})
			return
		}
		serviceIds = append(serviceIds, id)
	}

	logger.Info("Успешно созданы услуги с ID: %v", serviceIds)
	c.JSON(http.StatusCreated, gin.H{"ids": serviceIds})
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
		Name   string             `json:"name"`
		Prices map[string]float64 `json:"prices"`
	}

	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении услуги: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	// Получаем все типы клиентов
	clientTypes, err := h.services.Client.GetTypes()
	if err != nil {
		logger.Error("Ошибка при получении типов клиентов: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить типы клиентов"})
		return
	}

	// Проверяем, что для каждого типа клиента указана цена
	for _, clientType := range clientTypes {
		if _, exists := input.Prices[clientType]; !exists {
			logger.Warning("Не указана цена для типа клиента: %s", clientType)
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("не указана цена для типа клиента: %s", clientType)})
			return
		}
	}

	// Обновляем услугу для каждого типа клиента
	for clientType, price := range input.Prices {
		service := models.Service{
			Name:       input.Name,
			ClientType: clientType,
			Price:      int(price),
		}

		if err := h.services.Service.Update(id, service); err != nil {
			logger.Error("Ошибка при обновлении услуги для типа клиента %s: %v", clientType, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("ошибка при обновлении услуги для типа клиента %s: %v", clientType, err)})
			return
		}
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

func (h *Handler) GetWorkerStatistics(c *gin.Context) {
	userId, _ := c.Get("userId")
	logger.Debug("Получен запрос на получение статистики работника user_id:%v", userId)

	// Получаем worker_id из user_id
	worker, err := h.services.Worker.GetByUserId(userId.(int))
	if err != nil {
		logger.Error("Ошибка при получении данных работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при получении данных работника"})
		return
	}

	stats, err := h.services.Worker.GetStatistics(worker.ID)
	if err != nil {
		logger.Error("Ошибка при получении статистики работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Debug("Успешно получена статистика для работника ID:%v", worker.ID)
	c.JSON(http.StatusOK, stats)
}

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
