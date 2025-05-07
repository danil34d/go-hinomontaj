.PHONY: migrate-create migrate-up migrate-down migrate-force add-test-users remove-test-users create-db drop-db init-db docker-db-up docker-db-down docker-db-restart docker-compose-up docker-compose-down docker-compose-init build run-dev clean

MIGRATION_NAME ?= migration
DB_NAME = hinomontaj
DB_USER = postgres
DB_PASSWORD = postgres
DB_HOST = localhost
DB_PORT = 5432
DB_URL = postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable

# Сборка и запуск проекта
build:
	@echo "Сборка проекта..."
	docker-compose build

run-dev: build
	@echo "Запуск проекта в режиме разработки..."
	docker-compose up -d
	@echo "Проект успешно запущен!"
	@echo "Frontend доступен на http://localhost:3000"
	@echo "Backend доступен на http://localhost:8080"

clean:
	@echo "Остановка и удаление контейнеров..."
	docker-compose down -v
	@echo "Удаление собранных образов..."
	docker rmi hinomontaj-frontend hinomontaj-backend || true

# Docker Compose команды
docker-compose-up:
	docker-compose up -d

docker-compose-down:
	docker-compose down

docker-compose-init: docker-compose-up
	@echo "База данных успешно инициализирована"

# Docker команды
docker-db-up:
	docker run --name $(DB_NAME)-db \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-e POSTGRES_DB=$(DB_NAME) \
		-p $(DB_PORT):5432 \
		-d postgres:15-alpine

docker-db-down:
	docker stop $(DB_NAME)-db || true
	docker rm $(DB_NAME)-db || true

docker-db-restart: docker-db-down docker-db-up

# Docker инициализация с ожиданием готовности БД
docker-init-db: docker-db-restart
	@echo "Ожидание запуска PostgreSQL..."
	@sleep 3
	@echo "База данных успешно инициализирована"

# Создание базы данных
create-db:
	PGPASSWORD=$(DB_PASSWORD) createdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) $(DB_NAME)

# Удаление базы данных
drop-db:
	PGPASSWORD=$(DB_PASSWORD) dropdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) --if-exists $(DB_NAME)

# Полная инициализация БД (удаление -> создание -> миграции -> тестовые пользователи)
init-db: drop-db create-db migrate-up add-test-users
	@echo "База данных успешно инициализирована"

migrate-create:
	migrate create -ext sql -dir migrations -seq $(MIGRATION_NAME)

migrate-up:
	migrate -path migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path migrations -database "$(DB_URL)" down

migrate-force:
	migrate -path migrations -database "$(DB_URL)" force $(version)

add-test-users:
	migrate -path migrations -database "$(DB_URL)" up 4

remove-test-users:
	migrate -path migrations -database "$(DB_URL)" down 1 