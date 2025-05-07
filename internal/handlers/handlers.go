package handlers

import (
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
		AllowOrigins: []string{"http://localhost:3000"},

		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return origin == "http://localhost:3000"
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

	client := api.Group("/client")
	{
		client.GET("", h.GetClient)
		client.POST("", h.CreateClient)
		client.PUT(":id", h.UpdateClient)
		client.DELETE(":id", h.DeleteClient)
	}

	worker := api.Group("/worker")
	worker.Use(h.workerRoleMiddleware)
	{
		worker.GET("", h.GetMyOrders)
		worker.POST("", h.CreateOrder)
	}

	manager := api.Group("/manager")
	manager.Use(h.managerRoleMiddleware)
	{
		manager.GET("", h.GetOrders)
		manager.PUT(":id", h.UpdateOrder)
		manager.DELETE(":id", h.DeleteOrder)
		manager.GET("/statistics", h.GetStatistics)

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

	orders, err := h.services.Order.GetByWorkerId(workerId.(int))
	if err != nil {
		logger.Error("Ошибка при получении заказов работника: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d заказов для работника ID:%v", len(orders), workerId)
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

	workerId, _ := c.Get("userId")
	input.WorkerID = workerId.(int)

	id, err := h.services.Order.Create(input)
	if err != nil {
		logger.Error("Ошибка при создании заказа: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создан заказ ID:%d работником ID:%d", id, workerId)
	c.JSON(http.StatusOK, gin.H{"id": id})
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
	var input models.Worker
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	id, err := h.services.Worker.Create(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	logger.Debug("Успешно получено %d услуг", len(services))
	c.JSON(http.StatusOK, services)
}

func (h *Handler) CreateService(c *gin.Context) {
	logger.Debug("Получен запрос на создание услуги")
	var input models.Service
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при создании услуги: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	id, err := h.services.Service.Create(input)
	if err != nil {
		logger.Error("Ошибка при создании услуги: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно создана услуга ID:%d", id)
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
	var input models.Service
	if err := c.BindJSON(&input); err != nil {
		logger.Warning("Ошибка привязки JSON при обновлении услуги: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный формат данных"})
		return
	}

	if err := h.services.Service.Update(id, input); err != nil {
		logger.Error("Ошибка при обновлении услуги ID:%d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Успешно обновлена услуга ID:%d", id)
	c.JSON(http.StatusOK, gin.H{"status": "успешно обновлено"})
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
