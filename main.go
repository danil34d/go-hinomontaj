package main

import (
	"log"
	"net/http"

	"go_hinomontaj/database"
	"go_hinomontaj/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Инициализация базы данных
	if err := database.InitDB(); err != nil {
		log.Fatal("Ошибка инициализации базы данных:", err)
	}

	// Создание роутера
	r := gin.Default()

	// Middleware для установки базы данных в контекст
	r.Use(func(c *gin.Context) {
		c.Set("db", database.DB)
		c.Next()
	})

	// Настройка CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}
		c.Next()
	})

	// Обслуживание статических файлов
	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")
	r.StaticFile("/index.html", "./static/index.html")
	r.StaticFile("/style.css", "./static/style.css")
	r.StaticFile("/main.js", "./static/main.js")
	r.StaticFile("/price.json", "./static/price.json")
	r.StaticFile("/price_ds.json", "./static/price_ds.json")

	// Маршруты API
	api := r.Group("/api")
	{
		api.POST("/orders", handlers.CreateOrder)
		api.GET("/orders", handlers.GetOrders)
		api.GET("/services", handlers.GetServices)
	}

	// Обработка 404
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// Запуск сервера
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Ошибка запуска сервера:", err)
	}
}
