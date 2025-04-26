package handlers

import (
	"database/sql"
	"net/http"
	"regexp"
	"time"

	"go_hinomontaj/models"

	"github.com/gin-gonic/gin"
)

// CreateOrderRequest структура для запроса создания заказа
type CreateOrderRequest struct {
	VehicleNumber string `json:"vehicle_number" binding:"required"`
	PaymentMethod string `json:"payment_method" binding:"required"`
	ClientType    string `json:"client_type" binding:"required"`
	Services      []struct {
		ServiceType   string `json:"service_type" binding:"required"`
		WheelPosition string `json:"wheel_position" binding:"required"`
	} `json:"services" binding:"required"`
}

// CreateOrder создает новый заказ
func CreateOrder(c *gin.Context) {
	var request CreateOrderRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	// Проверяем, что есть хотя бы одна услуга
	if len(request.Services) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Необходимо выбрать хотя бы одну услугу"})
		return
	}

	db := c.MustGet("db").(*sql.DB)
	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании транзакции: " + err.Error()})
		return
	}

	// Создаем заказ
	result, err := tx.Exec(`
		INSERT INTO orders (vehicle_number, payment_method, client_type, created_at)
		VALUES (?, ?, ?, ?)
	`, request.VehicleNumber, request.PaymentMethod, request.ClientType, time.Now())
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании заказа: " + err.Error()})
		return
	}

	orderID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении ID заказа: " + err.Error()})
		return
	}

	// Добавляем услуги к заказу
	for _, service := range request.Services {
		var serviceID int
		err = tx.QueryRow("SELECT id FROM services WHERE name = ?", service.ServiceType).Scan(&serviceID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный тип услуги: " + service.ServiceType})
			return
		}

		_, err = tx.Exec(`
			INSERT INTO order_services (order_id, service_id, wheel_position)
			VALUES (?, ?, ?)
		`, orderID, serviceID, service.WheelPosition)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении услуги к заказу: " + err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении заказа: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Заказ успешно создан",
		"order_id": orderID,
		"services": request.Services,
	})
}

// GetOrders возвращает список заказов
func GetOrders(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)

	rows, err := db.Query(`
		SELECT o.id, o.vehicle_number, o.payment_method, o.client_type, o.created_at,
			   os.id, os.service_id, os.wheel_position, s.name
		FROM orders o
		LEFT JOIN order_services os ON o.id = os.order_id
		LEFT JOIN services s ON os.service_id = s.id
		ORDER BY o.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	defer rows.Close()

	orders := make(map[int]*models.Order)
	for rows.Next() {
		var (
			orderID        int
			vehicleNumber  string
			paymentMethod  string
			clientType     string
			createdAt      time.Time
			serviceID      sql.NullInt64
			serviceName    sql.NullString
			wheelPosition  sql.NullString
			orderServiceID sql.NullInt64
		)

		err := rows.Scan(&orderID, &vehicleNumber, &paymentMethod, &clientType, &createdAt,
			&orderServiceID, &serviceID, &wheelPosition, &serviceName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order"})
			return
		}

		if _, exists := orders[orderID]; !exists {
			orders[orderID] = &models.Order{
				ID:            orderID,
				VehicleNumber: vehicleNumber,
				PaymentMethod: paymentMethod,
				ClientType:    clientType,
				CreatedAt:     createdAt,
				Services:      make([]models.OrderService, 0),
			}
		}

		if serviceID.Valid && serviceName.Valid && wheelPosition.Valid {
			orders[orderID].Services = append(orders[orderID].Services, models.OrderService{
				ID:            int(orderServiceID.Int64),
				OrderID:       orderID,
				ServiceID:     int(serviceID.Int64),
				ServiceName:   serviceName.String,
				WheelPosition: wheelPosition.String,
			})
		}
	}

	orderList := make([]*models.Order, 0, len(orders))
	for _, order := range orders {
		orderList = append(orderList, order)
	}

	c.JSON(http.StatusOK, orderList)
}

// GetServices возвращает список доступных услуг
func GetServices(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)

	rows, err := db.Query("SELECT id, name, price_individual, price_company FROM services")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения списка услуг: " + err.Error()})
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var service models.Service
		err := rows.Scan(&service.ID, &service.Name, &service.PriceIndividual, &service.PriceCompany)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки данных услуги: " + err.Error()})
			return
		}
		services = append(services, service)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при чтении результатов запроса: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, services)
}

// Вспомогательные функции для валидации
func isValidVehicleNumber(number string) bool {
	// Регулярное выражение для проверки номера транспортного средства
	// Формат: три буквы, три цифры, две или три цифры региона
	pattern := `^[АВЕКМНОРСТУХ]{1}\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$`
	matched, _ := regexp.MatchString(pattern, number)
	return matched
}

func isValidWheelPosition(position string) bool {
	validPositions := map[string]bool{
		"Передняя ось: левое":           true,
		"Передняя ось: правое":          true,
		"Задняя ось: внешнее левое":     true,
		"Задняя ось: внутреннее левое":  true,
		"Задняя ось: внутреннее правое": true,
		"Задняя ось: внешнее правое":    true,
		"Ось 1: внешнее левое":          true,
		"Ось 1: внутреннее левое":       true,
		"Ось 1: внутреннее правое":      true,
		"Ось 1: внешнее правое":         true,
		"Ось 2: внешнее левое":          true,
		"Ось 2: внутреннее левое":       true,
		"Ось 2: внутреннее правое":      true,
		"Ось 2: внешнее правое":         true,
		"Ось 3: внешнее левое":          true,
		"Ось 3: внутреннее левое":       true,
		"Ось 3: внутреннее правое":      true,
		"Ось 3: внешнее правое":         true,
	}
	return validPositions[position]
}

func isValidPaymentMethod(method string) bool {
	validMethods := map[string]bool{
		"нал":        true,
		"агрегатор":  true,
		"контрагент": true,
	}
	return validMethods[method]
}

func isValidClientType(clientType string) bool {
	validTypes := map[string]bool{
		"individual": true,
		"company":    true,
	}
	return validTypes[clientType]
}
