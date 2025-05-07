package configs

import (
	"os"
	"path/filepath"
	"runtime"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Port string `yaml:"port"`
	DB   struct {
		Host     string `yaml:"host"`
		Port     string `yaml:"port"`
		Username string `yaml:"username"`
		Password string `yaml:"password"`
		DBName   string `yaml:"dbname"`
		SSLMode  string `yaml:"sslmode"`
	} `yaml:"db"`
	Auth struct {
		SigningKey string `yaml:"signing_key"`
		TokenTTL   string `yaml:"token_ttl"`
	} `yaml:"auth"`
	Migrations struct {
		Path string `yaml:"path"`
	} `yaml:"migrations"`
}

// GetDSN возвращает строку подключения к базе данных
func (c *Config) GetDSN() string {
	return "postgres://" + c.DB.Username + ":" + c.DB.Password + "@" + c.DB.Host + ":" + c.DB.Port + "/" + c.DB.DBName + "?sslmode=" + c.DB.SSLMode
}

// GetMigrationsPath возвращает абсолютный путь к директории с миграциями
func (c *Config) GetMigrationsPath() string {
	// Получаем текущую рабочую директорию
	wd, err := os.Getwd()
	if err != nil {
		// Если не удалось получить рабочую директорию, используем путь относительно исполняемого файла
		_, b, _, _ := runtime.Caller(0)
		wd = filepath.Join(filepath.Dir(b), "../")
	}

	if c.Migrations.Path != "" {
		if filepath.IsAbs(c.Migrations.Path) {
			return c.Migrations.Path
		}
		return filepath.Join(wd, c.Migrations.Path)
	}
	return filepath.Join(wd, "migrations")
}

func LoadConfig(path string) (*Config, error) {
	config := &Config{}

	file, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	err = yaml.Unmarshal(file, config)
	if err != nil {
		return nil, err
	}

	if host := os.Getenv("DB_HOST"); host != "" {
		config.DB.Host = host
	}
	if port := os.Getenv("DB_PORT"); port != "" {
		config.DB.Port = port
	}
	if username := os.Getenv("DB_USER"); username != "" {
		config.DB.Username = username
	}
	if password := os.Getenv("DB_PASSWORD"); password != "" {
		config.DB.Password = password
	}
	if dbname := os.Getenv("DB_NAME"); dbname != "" {
		config.DB.DBName = dbname
	}
	if migPath := os.Getenv("MIGRATIONS_PATH"); migPath != "" {
		config.Migrations.Path = migPath
	}

	return config, nil
}
