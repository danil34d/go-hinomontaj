package postgres

import (
	"fmt"
	"go-hinomontaj/pkg/logger"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	DBName   string
	SSLMode  string
}

func NewPostgresDB(cfg Config) (*sqlx.DB, error) {
	logger.Info("Подключение к PostgreSQL на %s:%s...", cfg.Host, cfg.Port)

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s client_encoding=UTF8",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.DBName, cfg.SSLMode)

	db, err := sqlx.Open("postgres", connStr)
	if err != nil {
		logger.Error("Ошибка открытия соединения с БД: %v", err)
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		logger.Error("Ошибка проверки соединения с БД: %v", err)
		return nil, err
	}

	logger.Info("Успешное подключение к PostgreSQL")
	return db, nil
}
