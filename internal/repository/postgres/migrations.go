package postgres

import (
	"database/sql"
	"fmt"
	"go-hinomontaj/pkg/logger"
	"path/filepath"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// waitForDB ждет, пока база данных станет доступной
func waitForDB(dsn string, maxAttempts int) error {
	for i := 0; i < maxAttempts; i++ {
		db, err := sql.Open("pgx", dsn)
		if err != nil {
			logger.Info("Попытка подключения к БД %d/%d: %v", i+1, maxAttempts, err)
			time.Sleep(time.Second)
			continue
		}
		defer db.Close()

		if err = db.Ping(); err != nil {
			logger.Info("Попытка пинга БД %d/%d: %v", i+1, maxAttempts, err)
			time.Sleep(time.Second)
			continue
		}

		logger.Info("База данных доступна")
		return nil
	}
	return fmt.Errorf("не удалось подключиться к базе данных после %d попыток", maxAttempts)
}

// MigrateDB выполняет миграции базы данных
func MigrateDB(dsn string, migrationsPath string) error {
	// Ждем, пока база данных станет доступной
	if err := waitForDB(dsn, 30); err != nil {
		return fmt.Errorf("ошибка ожидания БД: %w", err)
	}

	// Инициализируем подключение к БД с увеличенным таймаутом
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("ошибка подключения к БД: %w", err)
	}
	defer db.Close()

	// Устанавливаем таймауты
	db.SetConnMaxLifetime(time.Minute * 3)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)

	// Проверяем подключение
	if err = db.Ping(); err != nil {
		return fmt.Errorf("ошибка проверки подключения к БД: %w", err)
	}

	// Устанавливаем путь к миграциям
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("ошибка получения абсолютного пути к миграциям: %w", err)
	}

	// Применяем миграции
	if err := goose.Up(db, absPath); err != nil {
		return fmt.Errorf("ошибка применения миграций: %w", err)
	}

	// Получаем текущую версию
	version, err := goose.GetDBVersion(db)
	if err != nil {
		logger.Error("Не удалось получить версию БД: %v", err)
	} else {
		logger.Info("Миграции успешно применены. Текущая версия: %d", version)
	}

	return nil
}

// RollbackDB откатывает последнюю миграцию
func RollbackDB(dsn string, migrationsPath string) error {
	// Ждем, пока база данных станет доступной
	if err := waitForDB(dsn, 30); err != nil {
		return fmt.Errorf("ошибка ожидания БД: %w", err)
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("ошибка подключения к БД: %w", err)
	}
	defer db.Close()

	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("ошибка получения абсолютного пути к миграциям: %w", err)
	}

	if err := goose.Down(db, absPath); err != nil {
		return fmt.Errorf("ошибка отката миграции: %w", err)
	}

	version, err := goose.GetDBVersion(db)
	if err != nil {
		logger.Error("Не удалось получить версию БД: %v", err)
	} else {
		logger.Info("Миграция успешно откачена. Текущая версия: %d", version)
	}

	return nil
}

// ResetDB сбрасывает все миграции
func ResetDB(dsn string, migrationsPath string) error {
	// Ждем, пока база данных станет доступной
	if err := waitForDB(dsn, 30); err != nil {
		return fmt.Errorf("ошибка ожидания БД: %w", err)
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("ошибка подключения к БД: %w", err)
	}
	defer db.Close()

	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("ошибка получения абсолютного пути к миграциям: %w", err)
	}

	// Получаем текущую версию
	version, err := goose.GetDBVersion(db)
	if err != nil {
		return fmt.Errorf("ошибка получения версии БД: %w", err)
	}

	// Откатываем все миграции
	for version > 0 {
		if err := goose.Down(db, absPath); err != nil {
			return fmt.Errorf("ошибка отката миграции: %w", err)
		}
		version--
	}

	logger.Info("База данных успешно сброшена")
	return nil
}
