package main

import (
	"context"
	"flag"
	"go-hinomontaj/configs"
	"go-hinomontaj/internal/handlers"
	"go-hinomontaj/internal/repository/postgres"
	"go-hinomontaj/internal/service"
	"go-hinomontaj/pkg/logger"
	"go-hinomontaj/pkg/testdata"
	"go-hinomontaj/server"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	// Парсим флаги командной строки
	generateTestData := flag.Bool("with-testdata", false, "Генерировать тестовые данные")
	flag.Parse()

	// Загружаем конфигурацию
	config, err := configs.LoadConfig("configs/config.yaml")
	if err != nil {
		logger.Fatal("Ошибка загрузки конфигурации: %v", err)
	}

	// Применяем миграции
	logger.Info("Применение миграций...")
	if err := postgres.MigrateDB(config.GetDSN(), config.GetMigrationsPath()); err != nil {
		logger.Fatal("Ошибка применения миграций: %v", err)
	}
	logger.Info("Миграции успешно применены")

	// Подключаемся к базе данных
	db, err := postgres.NewPostgresDB(postgres.Config{
		Host:     config.DB.Host,
		Port:     config.DB.Port,
		Username: config.DB.Username,
		Password: config.DB.Password,
		DBName:   config.DB.DBName,
		SSLMode:  config.DB.SSLMode,
	})
	if err != nil {
		logger.Fatal("Ошибка подключения к базе данных: %v", err)
	}
	defer db.Close()

	// Инициализируем репозиторий
	repo := postgres.NewRepository(db)

	// Инициализируем сервисы
	services := service.NewServices(service.ServicesConfig{
		Repository: repo,
		SigningKey: config.Auth.SigningKey,
	})

	// Если указан флаг, генерируем тестовые данные
	if *generateTestData {
		logger.Info("Генерация тестовых данных...")
		generator := testdata.NewTestDataGenerator(services, &service.DBConfig{DB: db})
		if err := generator.GenerateTestData(); err != nil {
			logger.Fatal("Ошибка генерации тестовых данных: %v", err)
		}
		logger.Info("Тестовые данные успешно сгенерированы")
	}

	// Инициализируем обработчики
	handlers := handlers.NewHandler(services)

	// Создаем и запускаем сервер
	srv := new(server.Server)
	go func() {
		if err := srv.RunServer(config.Port, handlers.InitRoutes()); err != nil {
			logger.Fatal("Ошибка при запуске HTTP сервера: %v", err)
		}
	}()
	logger.Info("HTTP сервер запущен на порту %s", config.Port)

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit

	logger.Info("Завершение работы сервера...")
	if err := srv.Shutdown(context.Background()); err != nil {
		logger.Error("Ошибка при остановке сервера: %v", err)
	}

	logger.Info("Сервер успешно остановлен")
}
